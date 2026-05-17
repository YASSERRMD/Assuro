package api

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/YASSERRMD/Assuro/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"
)

const version = "v0.1.0"

// Server holds the HTTP server and its dependencies.
type Server struct {
	logger    *zap.Logger
	server    *http.Server
	started   time.Time
	db        *store.DB
	jwtSecret string
}

// ServerOption configures the server.
type ServerOption func(*Server)

// WithDB sets the database connection for readiness checks.
func WithDB(db *store.DB) ServerOption {
	return func(s *Server) { s.db = db }
}

// WithJWTSecret sets the JWT secret for authentication.
func WithJWTSecret(secret string) ServerOption {
	return func(s *Server) { s.jwtSecret = secret }
}

// NewServer creates and configures the HTTP server.
func NewServer(addr string, logger *zap.Logger, opts ...ServerOption) *Server {
	s := &Server{
		logger:  logger,
		started: time.Now().UTC(),
	}
	for _, opt := range opts {
		opt(s)
	}

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(requestLogger(logger))

	r.Get("/healthz", s.healthz)
	r.Get("/readyz", s.readyz)

	authSvc := service.NewAuthService(s.db, &service.AuthConfig{
		JWTSecret:     s.jwtSecret,
		JWTAccessTTL:  "15m",
		JWTRefreshTTL: "720h",
	})
	authHandler := NewAuthHandler(authSvc, logger)

	r.Post("/v1/auth/signup", authHandler.SignUp)
	r.Post("/v1/auth/login", authHandler.Login)

	s.server = &http.Server{
		Addr:    addr,
		Handler: r,
	}

	return s
}

// Start launches the server and blocks until shutdown.
func (s *Server) Start() error {
	s.logger.Info("starting http server", zap.String("addr", s.server.Addr))

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Fatal("server failed", zap.Error(err))
		}
	}()

	<-stop
	s.logger.Info("shutting down server")

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
