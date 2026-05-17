package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// AISystemHandler handles AI system HTTP requests.
type AISystemHandler struct {
	svc    *service.AISystemService
	logger *zap.Logger
}

// NewAISystemHandler creates a new AI system handler.
func NewAISystemHandler(svc *service.AISystemService, logger *zap.Logger) *AISystemHandler {
	return &AISystemHandler{svc: svc, logger: logger}
}

type registerAISystemRequest struct {
	Name                string   `json:"name"`
	Description         string   `json:"description"`
	OwnerUserID         string   `json:"owner_user_id"`
	Provider            string   `json:"provider"`
	ModelFamily         string   `json:"model_family"`
	Modality            string   `json:"modality"`
	DeploymentContext   string   `json:"deployment_context"`
	DataSources         []string `json:"data_sources"`
	IntendedPurpose     string   `json:"intended_purpose"`
	AffectedPopulations []string `json:"affected_populations"`
	EUMarketExposure    bool     `json:"eu_market_exposure"`
	IsAgentic           bool     `json:"is_agentic"`
	AutonomyLevel       int32    `json:"autonomy_level"`
	LifecycleStage      string   `json:"lifecycle_stage"`
}

// Register handles POST /v1/ai-systems.
func (h *AISystemHandler) Register(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	var req registerAISystemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if req.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}

	aiSys, err := h.svc.RegisterAISystem(r.Context(), service.RegisterAISystemInput{
		OrgID:               p.OrgID,
		Name:                req.Name,
		Description:         req.Description,
		OwnerUserID:         req.OwnerUserID,
		Provider:            req.Provider,
		ModelFamily:         req.ModelFamily,
		Modality:            req.Modality,
		DeploymentContext:   req.DeploymentContext,
		DataSources:         req.DataSources,
		IntendedPurpose:     req.IntendedPurpose,
		AffectedPopulations: req.AffectedPopulations,
		EUMarketExposure:    req.EUMarketExposure,
		IsAgentic:           req.IsAgentic,
		AutonomyLevel:       req.AutonomyLevel,
		LifecycleStage:      req.LifecycleStage,
	})
	if err != nil {
		h.logger.Error("register ai system failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to register ai system")
		return
	}

	writeJSON(w, http.StatusCreated, aiSys)
}

// GetOne handles GET /v1/ai-systems/{id}.
func (h *AISystemHandler) GetOne(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	aiSys, err := h.svc.GetAISystem(r.Context(), p.OrgID, id)
	if err != nil {
		WriteError(w, http.StatusNotFound, "not_found", "ai system not found")
		return
	}

	writeJSON(w, http.StatusOK, aiSys)
}

// List handles GET /v1/ai-systems.
func (h *AISystemHandler) List(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	systems, err := h.svc.ListAISystems(r.Context(), service.ListAISystemsInput{
		OrgID:           p.OrgID,
		LifecycleStatus: r.URL.Query().Get("status"),
		Limit:           int32(limit),
		Offset:          int32(offset),
	})
	if err != nil {
		h.logger.Error("list ai systems failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list ai systems")
		return
	}

	writeJSON(w, http.StatusOK, systems)
}

// Import handles POST /v1/ai-systems/import.
func (h *AISystemHandler) Import(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	var req []registerAISystemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if len(req) == 0 {
		WriteError(w, http.StatusBadRequest, "invalid_request", "empty array")
		return
	}

	inputs := make([]service.RegisterAISystemInput, len(req))
	for i, r := range req {
		inputs[i] = service.RegisterAISystemInput{
			OrgID:               p.OrgID,
			Name:                r.Name,
			Description:         r.Description,
			Provider:            r.Provider,
			ModelFamily:         r.ModelFamily,
			Modality:            r.Modality,
			DeploymentContext:   r.DeploymentContext,
			DataSources:         r.DataSources,
			IntendedPurpose:     r.IntendedPurpose,
			AffectedPopulations: r.AffectedPopulations,
			EUMarketExposure:    r.EUMarketExposure,
			IsAgentic:           r.IsAgentic,
			AutonomyLevel:       r.AutonomyLevel,
			LifecycleStage:      r.LifecycleStage,
		}
	}

	results, err := h.svc.BulkRegister(r.Context(), service.BulkRegisterInput{
		OrgID:   p.OrgID,
		Systems: inputs,
	})
	if err != nil {
		h.logger.Error("bulk import failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "bulk import failed")
		return
	}

	writeJSON(w, http.StatusCreated, results)
}
