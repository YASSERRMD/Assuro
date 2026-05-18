package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/YASSERRMD/Assuro/internal/aiassist"
	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/config"
	"github.com/YASSERRMD/Assuro/internal/jobs"
	"github.com/YASSERRMD/Assuro/internal/notify"
	"github.com/YASSERRMD/Assuro/internal/report"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/YASSERRMD/Assuro/internal/storage"
	"github.com/YASSERRMD/Assuro/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/zap"
)

const version = "v0.1.0"

// Server holds the HTTP server and its dependencies.
type Server struct {
	logger    *zap.Logger
	server    *http.Server
	started   time.Time
	db        *store.DB
	cfg       *config.Config
	jobWorker *jobs.Worker
	jobSched  *jobs.Scheduler
}

// ServerOption configures the server.
type ServerOption func(*Server)

// WithDB sets the database connection for readiness checks.
func WithDB(db *store.DB) ServerOption {
	return func(s *Server) { s.db = db }
}

// WithConfig sets the full application configuration.
func WithConfig(cfg *config.Config) ServerOption {
	return func(s *Server) { s.cfg = cfg }
}

// WithJWTSecret sets the JWT secret (kept for backward compatibility).
func WithJWTSecret(secret string) ServerOption {
	return func(s *Server) {
		if s.cfg == nil {
			s.cfg = &config.Config{}
		}
		s.cfg.JWTSecret = secret
	}
}

// NewServer creates and configures the HTTP server with all routes wired.
func NewServer(addr string, logger *zap.Logger, opts ...ServerOption) *Server {
	s := &Server{
		logger:  logger,
		started: time.Now().UTC(),
	}
	for _, opt := range opts {
		opt(s)
	}

	if s.cfg == nil {
		s.cfg = &config.Config{
			JWTAccessTTL:  15 * time.Minute,
			JWTRefreshTTL: 168 * time.Hour,
		}
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(requestLogger(logger))
	r.Use(SecurityHeaders)

	// Health probes - public
	r.Get("/healthz", s.healthz)
	r.Get("/readyz", s.readyz)

	// Instantiate all services
	authSvc := service.NewAuthService(s.db, &service.AuthConfig{
		JWTSecret:     s.cfg.JWTSecret,
		JWTAccessTTL:  fmt.Sprintf("%v", s.cfg.JWTAccessTTL),
		JWTRefreshTTL: fmt.Sprintf("%v", s.cfg.JWTRefreshTTL),
	})
	assetSvc := service.NewAssetService(s.db)
	aiSvc := service.NewAISystemService(s.db, assetSvc)
	riskSvc := service.NewRiskService(s.db, aiSvc)
	fwSvc := service.NewFrameworkService(s.db)
	regSvc := service.NewRegulatoryService(s.db)
	regIntelSvc := service.NewRegulatoryIntelligenceService(s.db)
	assessSvc := service.NewAssessmentService(s.db, fwSvc)
	blobStore := storage.NewLocalStore("data/evidence")
	evidSvc := service.NewEvidenceService(s.db, blobStore)
	monSvc := service.NewMonitoringService(s.db)
	incSvc := service.NewIncidentService(s.db)
	confSvc := service.NewConformityService(s.db)
	agentSvc := service.NewAgentService(s.db)
	agentRuntimeSvc := service.NewAgentRuntimeService(s.db)
	connSvc := service.NewConnectorService(s.db)
	shadowSvc := service.NewShadowAIService(s.db)
	discoverySvc := service.NewDiscoveryService(s.db)
	testingSvc := service.NewModelTestingService(s.db)
	policySvc := service.NewPolicyService(s.db)
	modelCardSvc := service.NewModelCardService(s.db)
	vendorSvc := service.NewVendorRiskService(s.db)
	approvalSvc := service.NewApprovalService(s.db)
	taskSvc := service.NewTaskService(s.db)
	reportBuilder := report.NewBuilder()

	// Instantiate all handlers
	authH := NewAuthHandler(authSvc, logger)
	assetH := NewAssetHandler(assetSvc, logger)
	aiSysH := NewAISystemHandler(aiSvc, logger)
	riskH := NewRiskHandler(riskSvc, logger)
	fwH := NewFrameworkHandler(fwSvc, logger)
	regH := NewRegulatoryHandler(regSvc, logger)
	regIntelH := NewRegulatoryIntelligenceHandler(regIntelSvc, logger)
	assessH := NewAssessmentHandler(assessSvc, logger)
	evidH := NewEvidenceHandler(evidSvc, logger)
	monH := NewMonitoringHandler(monSvc, logger)
	incH := NewIncidentHandler(incSvc, logger)
	confH := NewConformityHandler(confSvc, logger)
	agentH := NewAgentHandler(agentSvc, logger)
	agentRtH := NewAgentRuntimeHandler(agentRuntimeSvc, logger)
	connH := NewConnectorHandler(connSvc, logger)
	shadowH := NewShadowAIHandler(shadowSvc, logger)
	discoveryH := NewDiscoveryHandler(discoverySvc, logger)
	testingH := NewModelTestingHandler(testingSvc, logger)
	policyH := NewPolicyHandler(policySvc, logger)
	modelCardH := NewModelCardHandler(modelCardSvc, logger)
	vendorH := NewVendorRiskHandler(vendorSvc, logger)
	approvalH := NewApprovalHandler(approvalSvc, logger)
	taskH := NewTaskHandler(taskSvc, logger)
	statsH := NewStatsHandler(s.db, logger)
	reportH := NewReportHandler(reportBuilder, logger)
	auditH := NewAuditHandler(s.db, logger)

	// AI assist provider (always available, defaults to null)
	aiProvider, _ := aiassist.Build(aiassist.ConfigFromEnv())
	var aiAssistH *AIAssistHandler
	if s.db != nil {
		aiAssistH = NewAIAssistHandler(aiProvider, s.db.Pool(), logger)
	}

	// Background jobs and notifications (only available when a DB is wired in)
	var jobsH *JobsHandler
	var notifH *NotificationHandler
	if s.db != nil {
		jobQueue := jobs.NewPostgresQueue(s.db.Pool())
		jobRegistry := jobs.NewRegistry()
		s.jobWorker = jobs.NewWorker(jobQueue, jobRegistry, jobs.WorkerConfig{}, logger)
		s.jobSched = jobs.NewScheduler(jobQueue, logger)
		jobsH = NewJobsHandler(jobQueue, logger)

		notifSvc := notify.NewService(s.db.Pool(), jobQueue)
		notifH = NewNotificationHandler(notifSvc, logger)
	}

	// Public auth routes
	r.Post("/v1/auth/signup", authH.SignUp)
	r.Post("/v1/auth/login", authH.Login)
	r.Post("/v1/auth/refresh", authH.Refresh)

	// All protected routes require a valid JWT
	r.Group(func(r chi.Router) {
		r.Use(auth.RequireAuth(s.cfg.JWTSecret))

		// Generic asset CRUD
		r.Post("/v1/assets", assetH.Create)
		r.Get("/v1/assets", assetH.List)

		r.Route("/v1/assets/{id}", func(r chi.Router) {
			r.Get("/", assetH.GetOne)
			r.Patch("/", assetH.Update)
			r.Delete("/", assetH.Archive)

			// Risk sub-resource
			r.Post("/risk/compute", riskH.Compute)
			r.Get("/risk", riskH.GetLatest)
			r.Get("/risk/history", riskH.GetHistory)

			// Framework compliance per asset
			r.Post("/controls/status", fwH.SetControlStatus)
			r.Get("/coverage", fwH.GetCoverage)
			r.Get("/soa", fwH.GetSoA)

			// Monitoring signals per asset
			r.Get("/signals", monH.ListSignals)

			// Audit-ready report per asset
			r.Get("/report", reportH.GetReport)
		})

		// AI Systems (import must come before /{id} to avoid ambiguity)
		r.Post("/v1/ai-systems/import", aiSysH.Import)
		r.Post("/v1/ai-systems", aiSysH.Register)
		r.Get("/v1/ai-systems", aiSysH.List)
		r.Get("/v1/ai-systems/{id}", aiSysH.GetOne)

		// Cross-framework register
		r.Get("/v1/frameworks", fwH.ListFrameworks)
		r.Get("/v1/controls", fwH.ListControls)

		// Regulatory content library
		r.Get("/v1/regulatory/requirements", regH.ListRequirements)
		r.Get("/v1/regulatory/controls", regH.ListControls)

		// Regulatory intelligence: change feed and impact mapping
		r.Get("/v1/regulatory/changes", regIntelH.ListChanges)
		r.Post("/v1/regulatory/changes", regIntelH.AddChange)
		r.Get("/v1/regulatory/impacts", regIntelH.ListImpacts)
		r.Post("/v1/regulatory/impacts", regIntelH.CreateImpact)
		r.Patch("/v1/regulatory/impacts/{id}", regIntelH.UpdateImpactStatus)

		// Assessments
		r.Post("/v1/assessments", assessH.Create)
		r.Get("/v1/assessments", assessH.List)
		r.Get("/v1/assessments/{id}", assessH.GetOne)
		r.Get("/v1/assessments/{id}/questions", assessH.GetQuestions)
		r.Post("/v1/assessments/{id}/responses", assessH.SaveResponse)
		r.Post("/v1/assessments/{id}/submit", assessH.Submit)

		// Evidence store
		r.Post("/v1/evidence", evidH.Upload)
		r.Get("/v1/evidence", evidH.List)
		r.Get("/v1/evidence/{id}/download", evidH.Download)

		// Monitoring signal ingest
		r.Post("/v1/monitoring/signals", monH.RecordSignal)

		// Agent registry, permissions, runtime
		r.Get("/v1/agents", agentH.ListAgents)
		r.Post("/v1/agents", agentH.RegisterAgent)
		r.Route("/v1/agents/{id}", func(r chi.Router) {
			r.Get("/", agentH.GetAgent)
			r.Patch("/", agentH.UpdateAgentStatus)
			r.Get("/permissions", agentH.ListPermissions)
			r.Post("/permissions", agentH.GrantPermission)
			r.Delete("/permissions/{permId}", agentH.RevokePermission)
			r.Post("/behavior", agentRtH.RecordBehavior)
			r.Get("/behavior", agentRtH.ListBehaviorLogs)
			r.Post("/kill", agentRtH.KillSwitch)
			r.Get("/anomalies", agentRtH.ListAnomalies)
			r.Post("/anomalies", agentRtH.RecordAnomaly)
		})
		r.Get("/v1/guardrails", agentRtH.ListGuardrailPolicies)
		r.Post("/v1/guardrails", agentRtH.CreateGuardrailPolicy)
		r.Patch("/v1/guardrails/{id}", agentRtH.ToggleGuardrailPolicy)
		r.Post("/v1/anomalies/{id}/resolve", agentRtH.ResolveAnomaly)

		// Connectors and sync jobs
		r.Get("/v1/connectors", connH.ListConnectors)
		r.Post("/v1/connectors", connH.CreateConnector)
		r.Route("/v1/connectors/{id}", func(r chi.Router) {
			r.Patch("/", connH.UpdateConnectorStatus)
			r.Delete("/", connH.DeleteConnector)
			r.Get("/sync", connH.ListSyncRuns)
			r.Post("/sync", connH.StartSyncRun)
			r.Patch("/sync/{runId}", connH.FinishSyncRun)
			r.Post("/scan", connH.ScanConnector)
		})

		// Task management
		r.Get("/v1/tasks", taskH.ListTasks)
		r.Post("/v1/tasks", taskH.CreateTask)
		r.Route("/v1/tasks/{id}", func(r chi.Router) {
			r.Patch("/status", taskH.UpdateTaskStatus)
			r.Patch("/assign", taskH.AssignTask)
			r.Get("/comments", taskH.ListComments)
			r.Post("/comments", taskH.AddComment)
		})

		// Approval gates
		r.Get("/v1/approval-workflows", approvalH.ListWorkflows)
		r.Post("/v1/approval-workflows", approvalH.CreateWorkflow)
		r.Get("/v1/approval-requests", approvalH.ListRequests)
		r.Post("/v1/approval-requests", approvalH.SubmitRequest)
		r.Route("/v1/approval-requests/{id}", func(r chi.Router) {
			r.Post("/decide", approvalH.Decide)
			r.Get("/decisions", approvalH.ListDecisions)
		})

		// Vendor risk management
		r.Get("/v1/vendors", vendorH.ListVendors)
		r.Post("/v1/vendors", vendorH.CreateVendor)
		r.Route("/v1/vendors/{id}", func(r chi.Router) {
			r.Get("/assessments", vendorH.ListAssessments)
			r.Post("/assessments", vendorH.CreateAssessment)
		})

		// Model cards
		r.Get("/v1/model-cards", modelCardH.ListCards)
		r.Post("/v1/model-cards", modelCardH.CreateCard)
		r.Route("/v1/model-cards/{id}", func(r chi.Router) {
			r.Patch("/", modelCardH.UpdateCard)
			r.Post("/publish", modelCardH.PublishCard)
		})

		// Policy management
		r.Get("/v1/policies", policyH.ListPolicies)
		r.Post("/v1/policies", policyH.CreatePolicy)
		r.Route("/v1/policies/{id}", func(r chi.Router) {
			r.Patch("/status", policyH.UpdatePolicyStatus)
			r.Patch("/content", policyH.UpdatePolicyContent)
			r.Post("/attest", policyH.Attest)
			r.Get("/attestations", policyH.ListAttestations)
		})

		// Model testing engine
		r.Get("/v1/test-suites", testingH.ListSuites)
		r.Post("/v1/test-suites", testingH.CreateSuite)
		r.Route("/v1/test-suites/{id}", func(r chi.Router) {
			r.Get("/cases", testingH.ListTestCases)
			r.Post("/cases", testingH.AddTestCase)
			r.Get("/runs", testingH.ListRuns)
			r.Post("/runs", testingH.StartRun)
		})
		r.Route("/v1/test-runs/{id}", func(r chi.Router) {
			r.Post("/results", testingH.RecordResult)
			r.Get("/results", testingH.ListResults)
			r.Post("/finish", testingH.FinishRun)
		})

		// Discovery inbox and reconciliation
		r.Get("/v1/discovery", discoveryH.ListInbox)
		r.Post("/v1/discovery", discoveryH.Ingest)
		r.Post("/v1/discovery/dedup", discoveryH.DeduplicateShadow)
		r.Post("/v1/discovery/{id}/reconcile", discoveryH.Reconcile)
		r.Post("/v1/discovery/{id}/dismiss", discoveryH.Dismiss)

		// Shadow AI detection
		r.Get("/v1/shadow-ai", shadowH.ListFindings)
		r.Post("/v1/shadow-ai", shadowH.RecordFinding)
		r.Patch("/v1/shadow-ai/{id}", shadowH.UpdateFindingStatus)

		// Conformity assessments and declarations
		r.Get("/v1/conformity/assessments", confH.ListAssessments)
		r.Post("/v1/conformity/assessments", confH.CreateAssessment)
		r.Patch("/v1/conformity/assessments/{id}", confH.UpdateAssessment)
		r.Post("/v1/conformity/assessments/{id}/sign", confH.SignAssessment)
		r.Get("/v1/conformity/declarations", confH.ListDeclarations)
		r.Post("/v1/conformity/declarations", confH.IssueDeclaration)

		// Incidents and CAPA
		r.Post("/v1/incidents", incH.Create)
		r.Get("/v1/incidents", incH.List)

		// Dashboard statistics
		r.Get("/v1/stats", statsH.Get)

		// Audit log (owner/admin only - enforced inside handler)
		r.Get("/v1/audit-log", auditH.List)

		// Admin: background job management (requires DB)
		if jobsH != nil {
			r.Route("/v1/admin/jobs", func(r chi.Router) {
				r.Post("/", jobsH.Enqueue)
				r.Get("/", jobsH.List)
				r.Get("/{id}", jobsH.GetOne)
			})
		}

		// AI assist
		if aiAssistH != nil {
			r.Get("/v1/ai-assist/status", aiAssistH.Status)
			r.Get("/v1/ai-assist/usage", aiAssistH.Usage)
		}

		// Notifications and webhooks
		if notifH != nil {
			r.Get("/v1/notifications", notifH.ListNotifications)
			r.Post("/v1/notifications/{id}/read", notifH.MarkRead)
			r.Post("/v1/webhooks", notifH.CreateWebhook)
			r.Get("/v1/webhooks", notifH.ListWebhooks)
			r.Delete("/v1/webhooks/{id}", notifH.DeleteWebhook)
		}
	})

	s.server = &http.Server{
		Addr:    addr,
		Handler: r,
	}

	return s
}

// Start launches the server and blocks until graceful shutdown.
func (s *Server) Start() error {
	s.logger.Info("starting http server", zap.String("addr", s.server.Addr))

	bgCtx, bgCancel := context.WithCancel(context.Background())
	defer bgCancel()

	if s.jobWorker != nil {
		s.jobWorker.Start(bgCtx)
	}
	if s.jobSched != nil {
		s.jobSched.Start(bgCtx)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Fatal("server failed", zap.Error(err))
		}
	}()

	<-stop
	s.logger.Info("shutting down server")

	bgCancel()
	if s.jobWorker != nil {
		s.jobWorker.Stop()
	}
	if s.jobSched != nil {
		s.jobSched.Stop()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	return s.server.Shutdown(ctx)
}

func requestLogger(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			next.ServeHTTP(w, r)
			logger.Info("request",
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.Duration("duration", time.Since(start)),
			)
		})
	}
}
