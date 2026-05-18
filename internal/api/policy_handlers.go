package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// PolicyHandler handles policy management endpoints.
type PolicyHandler struct {
	svc    *service.PolicyService
	logger *zap.Logger
}

// NewPolicyHandler creates a PolicyHandler.
func NewPolicyHandler(svc *service.PolicyService, logger *zap.Logger) *PolicyHandler {
	return &PolicyHandler{svc: svc, logger: logger}
}

// ListPolicies handles GET /v1/policies.
func (h *PolicyHandler) ListPolicies(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	policyType := r.URL.Query().Get("type")
	status := r.URL.Query().Get("status")
	items, err := h.svc.ListPolicies(r.Context(), p.OrgID, policyType, status)
	if err != nil {
		h.logger.Error("list policies", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list policies")
		return
	}
	if items == nil {
		items = []service.Policy{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreatePolicy handles POST /v1/policies.
func (h *PolicyHandler) CreatePolicy(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var pol service.Policy
	if err := json.NewDecoder(r.Body).Decode(&pol); err != nil || pol.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}
	pol.OrgID = p.OrgID
	userID := p.UserID
	pol.CreatedBy = &userID
	created, err := h.svc.CreatePolicy(r.Context(), pol)
	if err != nil {
		h.logger.Error("create policy", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create policy")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// UpdatePolicyStatus handles PATCH /v1/policies/{id}/status.
func (h *PolicyHandler) UpdatePolicyStatus(w http.ResponseWriter, r *http.Request) {
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
	if err := h.svc.UpdatePolicyStatus(r.Context(), id, p.OrgID, body.Status, p.UserID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update status")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UpdatePolicyContent handles PATCH /v1/policies/{id}/content.
func (h *PolicyHandler) UpdatePolicyContent(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		Content string `json:"content"`
		Version string `json:"version"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid body")
		return
	}
	if err := h.svc.UpdatePolicyContent(r.Context(), id, p.OrgID, body.Content, body.Version); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update content")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Attest handles POST /v1/policies/{id}/attest.
func (h *PolicyHandler) Attest(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	policyID := chi.URLParam(r, "id")
	var body struct {
		Version string `json:"version"`
		Notes   string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Version == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "version is required")
		return
	}
	att := service.PolicyAttestation{
		PolicyID: policyID,
		OrgID:    p.OrgID,
		UserID:   p.UserID,
		Version:  body.Version,
		Notes:    body.Notes,
	}
	created, err := h.svc.Attest(r.Context(), att)
	if err != nil {
		h.logger.Error("attest policy", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to attest policy")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListAttestations handles GET /v1/policies/{id}/attestations.
func (h *PolicyHandler) ListAttestations(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	policyID := chi.URLParam(r, "id")
	items, err := h.svc.ListAttestations(r.Context(), policyID, p.OrgID)
	if err != nil {
		h.logger.Error("list attestations", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list attestations")
		return
	}
	if items == nil {
		items = []service.PolicyAttestation{}
	}
	writeJSON(w, http.StatusOK, items)
}
