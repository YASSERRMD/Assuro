package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// FrameworkHandler handles framework HTTP requests.
type FrameworkHandler struct {
	svc    *service.FrameworkService
	logger *zap.Logger
}

// NewFrameworkHandler creates a new framework handler.
func NewFrameworkHandler(svc *service.FrameworkService, logger *zap.Logger) *FrameworkHandler {
	return &FrameworkHandler{svc: svc, logger: logger}
}

// ListFrameworks handles GET /v1/frameworks.
func (h *FrameworkHandler) ListFrameworks(w http.ResponseWriter, r *http.Request) {
	frameworks, err := h.svc.ListFrameworks(r.Context())
	if err != nil {
		h.logger.Error("list frameworks failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list frameworks")
		return
	}
	writeJSON(w, http.StatusOK, frameworks)
}

// ListControls handles GET /v1/controls.
func (h *FrameworkHandler) ListControls(w http.ResponseWriter, r *http.Request) {
	controls, err := h.svc.ListControls(r.Context())
	if err != nil {
		h.logger.Error("list controls failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list controls")
		return
	}
	writeJSON(w, http.StatusOK, controls)
}

type setControlStatusRequest struct {
	ControlID     string `json:"control_id"`
	Status        string `json:"status"`
	Justification string `json:"justification"`
}

// SetControlStatus handles POST /v1/assets/{id}/controls/status.
func (h *FrameworkHandler) SetControlStatus(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	assetID := r.PathValue("id")
	if assetID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	var req setControlStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if req.ControlID == "" || req.Status == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "control_id and status are required")
		return
	}

	err := h.svc.SetControlStatus(r.Context(), service.SetControlStatusInput{
		AssetID:       assetID,
		ControlID:     req.ControlID,
		Status:        req.Status,
		Justification: req.Justification,
		UpdatedBy:     p.UserID,
	})
	if err != nil {
		h.logger.Error("set control status failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to set control status")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetCoverage handles GET /v1/assets/{id}/coverage.
func (h *FrameworkHandler) GetCoverage(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	assetID := r.PathValue("id")
	if assetID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	coverage, err := h.svc.GetCoverage(r.Context(), assetID)
	if err != nil {
		h.logger.Error("get coverage failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to get coverage")
		return
	}

	writeJSON(w, http.StatusOK, coverage)
}

// GetSoA handles GET /v1/assets/{id}/soa.
func (h *FrameworkHandler) GetSoA(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	assetID := r.PathValue("id")
	if assetID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	soa, err := h.svc.GetStatementOfApplicability(r.Context(), assetID)
	if err != nil {
		h.logger.Error("get soa failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to get SoA")
		return
	}

	writeJSON(w, http.StatusOK, soa)
}
