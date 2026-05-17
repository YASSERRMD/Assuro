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

// MonitoringHandler handles monitoring HTTP requests.
type MonitoringHandler struct {
	svc    *service.MonitoringService
	logger *zap.Logger
}

// NewMonitoringHandler creates a new monitoring handler.
func NewMonitoringHandler(svc *service.MonitoringService, logger *zap.Logger) *MonitoringHandler {
	return &MonitoringHandler{svc: svc, logger: logger}
}

type recordSignalRequest struct {
	AssetID    string         `json:"asset_id"`
	SignalType string         `json:"signal_type"`
	Severity   string         `json:"severity"`
	Value      map[string]any `json:"value"`
	Source     string         `json:"source"`
}

// RecordSignal handles POST /v1/monitoring/signals.
func (h *MonitoringHandler) RecordSignal(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	var req recordSignalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	signal, err := h.svc.RecordSignal(r.Context(), service.RecordSignalInput{
		OrgID:      p.OrgID,
		AssetID:    req.AssetID,
		SignalType: req.SignalType,
		Severity:   req.Severity,
		Value:      req.Value,
		Source:     req.Source,
	})
	if err != nil {
		h.logger.Error("record signal failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to record signal")
		return
	}

	writeJSON(w, http.StatusCreated, signal)
}

// ListSignals handles GET /v1/assets/{id}/signals.
func (h *MonitoringHandler) ListSignals(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	assetID := chi.URLParam(r, "id")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	signals, err := h.svc.ListSignals(r.Context(), assetID, int32(limit), int32(offset))
	if err != nil {
		h.logger.Error("list signals failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list signals")
		return
	}

	writeJSON(w, http.StatusOK, signals)
}

// IncidentHandler handles incident HTTP requests.
type IncidentHandler struct {
	svc    *service.IncidentService
	logger *zap.Logger
}

// NewIncidentHandler creates a new incident handler.
func NewIncidentHandler(svc *service.IncidentService, logger *zap.Logger) *IncidentHandler {
	return &IncidentHandler{svc: svc, logger: logger}
}

type createIncidentRequest struct {
	AssetID     string `json:"asset_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
}

// Create handles POST /v1/incidents.
func (h *IncidentHandler) Create(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	var req createIncidentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	incident, err := h.svc.CreateIncident(r.Context(), service.CreateIncidentInput{
		OrgID:       p.OrgID,
		AssetID:     req.AssetID,
		Title:       req.Title,
		Description: req.Description,
		Severity:    req.Severity,
		RaisedBy:    p.UserID,
	})
	if err != nil {
		h.logger.Error("create incident failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create incident")
		return
	}

	writeJSON(w, http.StatusCreated, incident)
}

// List handles GET /v1/incidents.
func (h *IncidentHandler) List(w http.ResponseWriter, r *http.Request) {
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

	incidents, err := h.svc.ListIncidents(r.Context(), p.OrgID, int32(limit), int32(offset))
	if err != nil {
		h.logger.Error("list incidents failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list incidents")
		return
	}

	writeJSON(w, http.StatusOK, incidents)
}
