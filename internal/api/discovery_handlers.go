package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// DiscoveryHandler handles discovery inbox endpoints.
type DiscoveryHandler struct {
	svc    *service.DiscoveryService
	logger *zap.Logger
}

// NewDiscoveryHandler creates a DiscoveryHandler.
func NewDiscoveryHandler(svc *service.DiscoveryService, logger *zap.Logger) *DiscoveryHandler {
	return &DiscoveryHandler{svc: svc, logger: logger}
}

// ListInbox handles GET /v1/discovery.
func (h *DiscoveryHandler) ListInbox(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	state := r.URL.Query().Get("state")
	items, err := h.svc.ListInbox(r.Context(), p.OrgID, state)
	if err != nil {
		h.logger.Error("list discovery inbox", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list inbox")
		return
	}
	if items == nil {
		items = []service.DiscoveryItem{}
	}
	writeJSON(w, http.StatusOK, items)
}

// Ingest handles POST /v1/discovery.
func (h *DiscoveryHandler) Ingest(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var item service.DiscoveryItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil || item.SourceType == "" || item.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "source_type and name are required")
		return
	}
	item.OrgID = p.OrgID
	created, err := h.svc.Ingest(r.Context(), item)
	if err != nil {
		h.logger.Error("ingest discovery item", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to ingest item")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// Reconcile handles POST /v1/discovery/{id}/reconcile.
func (h *DiscoveryHandler) Reconcile(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		AssetID *string `json:"asset_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if err := h.svc.Reconcile(r.Context(), id, p.OrgID, p.UserID, body.AssetID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to reconcile item")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Dismiss handles POST /v1/discovery/{id}/dismiss.
func (h *DiscoveryHandler) Dismiss(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.Dismiss(r.Context(), id, p.OrgID, p.UserID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to dismiss item")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DeduplicateShadow handles POST /v1/discovery/dedup.
func (h *DiscoveryHandler) DeduplicateShadow(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	count, err := h.svc.DeduplicateShadowFindings(r.Context(), p.OrgID)
	if err != nil {
		h.logger.Error("dedup shadow findings", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "dedup failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"reconciled": count})
}
