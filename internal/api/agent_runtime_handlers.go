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

// AgentRuntimeHandler handles behavior logging, guardrails, kill-switch and anomalies.
type AgentRuntimeHandler struct {
	svc    *service.AgentRuntimeService
	logger *zap.Logger
}

// NewAgentRuntimeHandler creates an AgentRuntimeHandler.
func NewAgentRuntimeHandler(svc *service.AgentRuntimeService, logger *zap.Logger) *AgentRuntimeHandler {
	return &AgentRuntimeHandler{svc: svc, logger: logger}
}

// RecordBehavior handles POST /v1/agents/{id}/behavior.
func (h *AgentRuntimeHandler) RecordBehavior(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	agentID := chi.URLParam(r, "id")
	var l service.BehaviorLog
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil || l.Action == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "action is required")
		return
	}
	l.AgentID = agentID
	l.OrgID = p.OrgID
	created, err := h.svc.RecordBehavior(r.Context(), l)
	if err != nil {
		h.logger.Error("record behavior", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to record behavior")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListBehaviorLogs handles GET /v1/agents/{id}/behavior.
func (h *AgentRuntimeHandler) ListBehaviorLogs(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	agentID := chi.URLParam(r, "id")
	status := r.URL.Query().Get("status")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	items, err := h.svc.ListBehaviorLogs(r.Context(), agentID, p.OrgID, status, limit)
	if err != nil {
		h.logger.Error("list behavior logs", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list behavior logs")
		return
	}
	if items == nil {
		items = []service.BehaviorLog{}
	}
	writeJSON(w, http.StatusOK, items)
}

// KillSwitch handles POST /v1/agents/{id}/kill.
func (h *AgentRuntimeHandler) KillSwitch(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	agentID := chi.URLParam(r, "id")
	if err := h.svc.KillSwitch(r.Context(), agentID, p.OrgID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to suspend agent")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListGuardrailPolicies handles GET /v1/guardrails.
func (h *AgentRuntimeHandler) ListGuardrailPolicies(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	enabledOnly := r.URL.Query().Get("enabled") == "true"
	items, err := h.svc.ListGuardrailPolicies(r.Context(), p.OrgID, enabledOnly)
	if err != nil {
		h.logger.Error("list guardrail policies", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list policies")
		return
	}
	if items == nil {
		items = []service.GuardrailPolicy{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateGuardrailPolicy handles POST /v1/guardrails.
func (h *AgentRuntimeHandler) CreateGuardrailPolicy(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var pol service.GuardrailPolicy
	if err := json.NewDecoder(r.Body).Decode(&pol); err != nil || pol.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}
	pol.OrgID = p.OrgID
	userID := p.UserID
	pol.CreatedBy = &userID
	created, err := h.svc.CreateGuardrailPolicy(r.Context(), pol)
	if err != nil {
		h.logger.Error("create guardrail policy", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create policy")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ToggleGuardrailPolicy handles PATCH /v1/guardrails/{id}.
func (h *AgentRuntimeHandler) ToggleGuardrailPolicy(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		Enabled bool `json:"enabled"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if err := h.svc.ToggleGuardrailPolicy(r.Context(), id, p.OrgID, body.Enabled); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to toggle policy")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListAnomalies handles GET /v1/agents/{id}/anomalies.
func (h *AgentRuntimeHandler) ListAnomalies(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	agentID := chi.URLParam(r, "id")
	openOnly := r.URL.Query().Get("open") == "true"
	items, err := h.svc.ListAnomalies(r.Context(), p.OrgID, agentID, openOnly)
	if err != nil {
		h.logger.Error("list anomalies", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list anomalies")
		return
	}
	if items == nil {
		items = []service.AgentAnomaly{}
	}
	writeJSON(w, http.StatusOK, items)
}

// RecordAnomaly handles POST /v1/agents/{id}/anomalies.
func (h *AgentRuntimeHandler) RecordAnomaly(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	agentID := chi.URLParam(r, "id")
	var a service.AgentAnomaly
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil || a.AnomalyType == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "anomaly_type is required")
		return
	}
	a.AgentID = agentID
	a.OrgID = p.OrgID
	created, err := h.svc.RecordAnomaly(r.Context(), a)
	if err != nil {
		h.logger.Error("record anomaly", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to record anomaly")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ResolveAnomaly handles POST /v1/anomalies/{id}/resolve.
func (h *AgentRuntimeHandler) ResolveAnomaly(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.ResolveAnomaly(r.Context(), id, p.OrgID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to resolve anomaly")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
