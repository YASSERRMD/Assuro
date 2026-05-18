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

// RegulatoryIntelligenceHandler handles change feed and impact mapping endpoints.
type RegulatoryIntelligenceHandler struct {
	svc    *service.RegulatoryIntelligenceService
	logger *zap.Logger
}

// NewRegulatoryIntelligenceHandler creates a RegulatoryIntelligenceHandler.
func NewRegulatoryIntelligenceHandler(svc *service.RegulatoryIntelligenceService, logger *zap.Logger) *RegulatoryIntelligenceHandler {
	return &RegulatoryIntelligenceHandler{svc: svc, logger: logger}
}

// ListChanges handles GET /v1/regulatory/changes.
func (h *RegulatoryIntelligenceHandler) ListChanges(w http.ResponseWriter, r *http.Request) {
	fwKey := r.URL.Query().Get("framework")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	changes, err := h.svc.ListChanges(r.Context(), fwKey, limit)
	if err != nil {
		h.logger.Error("list regulatory changes", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list changes")
		return
	}
	if changes == nil {
		changes = []service.RegulatoryChange{}
	}
	writeJSON(w, http.StatusOK, changes)
}

// AddChange handles POST /v1/regulatory/changes (admin).
func (h *RegulatoryIntelligenceHandler) AddChange(w http.ResponseWriter, r *http.Request) {
	var c service.RegulatoryChange
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil || c.Summary == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "framework_key, ref_code, change_kind and summary are required")
		return
	}
	created, err := h.svc.AddChange(r.Context(), c)
	if err != nil {
		h.logger.Error("add change", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to add change")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListImpacts handles GET /v1/regulatory/impacts.
func (h *RegulatoryIntelligenceHandler) ListImpacts(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	status := r.URL.Query().Get("status")
	items, err := h.svc.ListImpactAssessments(r.Context(), p.OrgID, status)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list impacts")
		return
	}
	if items == nil {
		items = []service.ImpactAssessment{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateImpact handles POST /v1/regulatory/impacts.
func (h *RegulatoryIntelligenceHandler) CreateImpact(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var a service.ImpactAssessment
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil || a.ChangeID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "change_id is required")
		return
	}
	a.OrgID = p.OrgID
	created, err := h.svc.CreateImpactAssessment(r.Context(), a)
	if err != nil {
		h.logger.Error("create impact", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create impact assessment")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// UpdateImpactStatus handles PATCH /v1/regulatory/impacts/{id}.
func (h *RegulatoryIntelligenceHandler) UpdateImpactStatus(w http.ResponseWriter, r *http.Request) {
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
	if err := h.svc.UpdateImpactStatus(r.Context(), id, p.OrgID, body.Status); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update status")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
