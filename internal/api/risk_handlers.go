package api

import (
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// RiskHandler handles risk HTTP requests.
type RiskHandler struct {
	svc    *service.RiskService
	logger *zap.Logger
}

// NewRiskHandler creates a new risk handler.
func NewRiskHandler(svc *service.RiskService, logger *zap.Logger) *RiskHandler {
	return &RiskHandler{svc: svc, logger: logger}
}

// Compute handles POST /v1/assets/{id}/risk:compute.
func (h *RiskHandler) Compute(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	result, err := h.svc.ComputeRisk(r.Context(), id)
	if err != nil {
		h.logger.Error("compute risk failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to compute risk")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GetLatest handles GET /v1/assets/{id}/risk.
func (h *RiskHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	result, err := h.svc.GetLatestRisk(r.Context(), id)
	if err != nil {
		WriteError(w, http.StatusNotFound, "not_found", "no risk assessment found")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GetHistory handles GET /v1/assets/{id}/risk/history.
func (h *RiskHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	history, err := h.svc.ListRiskHistory(r.Context(), id)
	if err != nil {
		h.logger.Error("list risk history failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list risk history")
		return
	}

	writeJSON(w, http.StatusOK, history)
}
