package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ShadowAIHandler handles shadow AI detection endpoints.
type ShadowAIHandler struct {
	svc    *service.ShadowAIService
	logger *zap.Logger
}

// NewShadowAIHandler creates a ShadowAIHandler.
func NewShadowAIHandler(svc *service.ShadowAIService, logger *zap.Logger) *ShadowAIHandler {
	return &ShadowAIHandler{svc: svc, logger: logger}
}

// ListFindings handles GET /v1/shadow-ai.
func (h *ShadowAIHandler) ListFindings(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	status := r.URL.Query().Get("status")
	items, err := h.svc.ListFindings(r.Context(), p.OrgID, status)
	if err != nil {
		h.logger.Error("list shadow ai findings", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list findings")
		return
	}
	if items == nil {
		items = []service.ShadowAIFinding{}
	}
	writeJSON(w, http.StatusOK, items)
}

// RecordFinding handles POST /v1/shadow-ai.
func (h *ShadowAIHandler) RecordFinding(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var f service.ShadowAIFinding
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil || f.SourceType == "" || f.SourceRef == "" || f.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "source_type, source_ref and name are required")
		return
	}
	f.OrgID = p.OrgID
	created, err := h.svc.RecordFinding(r.Context(), f)
	if err != nil {
		h.logger.Error("record shadow finding", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to record finding")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// UpdateFindingStatus handles PATCH /v1/shadow-ai/{id}.
func (h *ShadowAIHandler) UpdateFindingStatus(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Status == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "status is required")
		return
	}
	if err := h.svc.UpdateFindingStatus(r.Context(), id, p.OrgID, body.Status, p.UserID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update finding")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
