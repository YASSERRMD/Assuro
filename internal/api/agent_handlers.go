package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// AgentHandler handles agent registry endpoints.
type AgentHandler struct {
	svc    *service.AgentService
	logger *zap.Logger
}

// NewAgentHandler creates an AgentHandler.
func NewAgentHandler(svc *service.AgentService, logger *zap.Logger) *AgentHandler {
	return &AgentHandler{svc: svc, logger: logger}
}

// ListAgents handles GET /v1/agents.
func (h *AgentHandler) ListAgents(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	status := r.URL.Query().Get("status")
	assetID := r.URL.Query().Get("asset_id")
	items, err := h.svc.ListAgents(r.Context(), p.OrgID, status, assetID)
	if err != nil {
		h.logger.Error("list agents", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list agents")
		return
	}
	if items == nil {
		items = []service.Agent{}
	}
	writeJSON(w, http.StatusOK, items)
}

// RegisterAgent handles POST /v1/agents.
func (h *AgentHandler) RegisterAgent(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var a service.Agent
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil || a.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}
	a.OrgID = p.OrgID
	userID := p.UserID
	a.CreatedBy = &userID
	created, err := h.svc.RegisterAgent(r.Context(), a)
	if err != nil {
		h.logger.Error("register agent", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to register agent")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// GetAgent handles GET /v1/agents/{id}.
func (h *AgentHandler) GetAgent(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	agent, err := h.svc.GetAgent(r.Context(), id, p.OrgID)
	if err != nil {
		WriteError(w, http.StatusNotFound, "not_found", "agent not found")
		return
	}
	writeJSON(w, http.StatusOK, agent)
}

// UpdateAgentStatus handles PATCH /v1/agents/{id}.
func (h *AgentHandler) UpdateAgentStatus(w http.ResponseWriter, r *http.Request) {
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
	if err := h.svc.UpdateAgentStatus(r.Context(), id, p.OrgID, body.Status); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update agent")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListPermissions handles GET /v1/agents/{id}/permissions.
func (h *AgentHandler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	agentID := chi.URLParam(r, "id")
	items, err := h.svc.ListPermissions(r.Context(), agentID, p.OrgID)
	if err != nil {
		h.logger.Error("list permissions", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list permissions")
		return
	}
	if items == nil {
		items = []service.AgentPermission{}
	}
	writeJSON(w, http.StatusOK, items)
}

// GrantPermission handles POST /v1/agents/{id}/permissions.
func (h *AgentHandler) GrantPermission(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	agentID := chi.URLParam(r, "id")
	var perm service.AgentPermission
	if err := json.NewDecoder(r.Body).Decode(&perm); err != nil || perm.Scope == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "scope is required")
		return
	}
	perm.AgentID = agentID
	userID := p.UserID
	perm.GrantedBy = &userID
	created, err := h.svc.GrantPermission(r.Context(), perm)
	if err != nil {
		h.logger.Error("grant permission", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to grant permission")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// RevokePermission handles DELETE /v1/agents/{id}/permissions/{permId}.
func (h *AgentHandler) RevokePermission(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	permID := chi.URLParam(r, "permId")
	if err := h.svc.RevokePermission(r.Context(), permID, p.OrgID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to revoke permission")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
