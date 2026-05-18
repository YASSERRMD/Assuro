package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ConnectorHandler handles connector registry and sync endpoints.
type ConnectorHandler struct {
	svc    *service.ConnectorService
	logger *zap.Logger
}

// NewConnectorHandler creates a ConnectorHandler.
func NewConnectorHandler(svc *service.ConnectorService, logger *zap.Logger) *ConnectorHandler {
	return &ConnectorHandler{svc: svc, logger: logger}
}

// ListConnectors handles GET /v1/connectors.
func (h *ConnectorHandler) ListConnectors(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	connType := r.URL.Query().Get("type")
	items, err := h.svc.ListConnectors(r.Context(), p.OrgID, connType)
	if err != nil {
		h.logger.Error("list connectors", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list connectors")
		return
	}
	if items == nil {
		items = []service.Connector{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateConnector handles POST /v1/connectors.
func (h *ConnectorHandler) CreateConnector(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var c service.Connector
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil || c.Name == "" || c.ConnectorType == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name and connector_type are required")
		return
	}
	c.OrgID = p.OrgID
	userID := p.UserID
	c.CreatedBy = &userID
	created, err := h.svc.CreateConnector(r.Context(), c)
	if err != nil {
		h.logger.Error("create connector", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create connector")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// UpdateConnectorStatus handles PATCH /v1/connectors/{id}.
func (h *ConnectorHandler) UpdateConnectorStatus(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		Status    string `json:"status"`
		LastError string `json:"last_error"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if err := h.svc.UpdateConnectorStatus(r.Context(), id, p.OrgID, body.Status, body.LastError); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update connector")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DeleteConnector handles DELETE /v1/connectors/{id}.
func (h *ConnectorHandler) DeleteConnector(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteConnector(r.Context(), id, p.OrgID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to delete connector")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// StartSyncRun handles POST /v1/connectors/{id}/sync.
func (h *ConnectorHandler) StartSyncRun(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	run, err := h.svc.StartSyncRun(r.Context(), id, p.OrgID)
	if err != nil {
		h.logger.Error("start sync run", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to start sync run")
		return
	}
	writeJSON(w, http.StatusCreated, run)
}

// FinishSyncRun handles PATCH /v1/connectors/{id}/sync/{runId}.
func (h *ConnectorHandler) FinishSyncRun(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	runID := chi.URLParam(r, "runId")
	var body struct {
		Status        string `json:"status"`
		RecordsSynced int    `json:"records_synced"`
		ErrorMessage  string `json:"error_message"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if err := h.svc.FinishSyncRun(r.Context(), runID, p.OrgID, body.Status, body.RecordsSynced, body.ErrorMessage); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to finish sync run")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListSyncRuns handles GET /v1/connectors/{id}/sync.
func (h *ConnectorHandler) ListSyncRuns(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	runs, err := h.svc.ListSyncRuns(r.Context(), id, p.OrgID)
	if err != nil {
		h.logger.Error("list sync runs", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list sync runs")
		return
	}
	if runs == nil {
		runs = []service.ConnectorSyncRun{}
	}
	writeJSON(w, http.StatusOK, runs)
}
