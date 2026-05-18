package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ModelCardHandler handles model card endpoints.
type ModelCardHandler struct {
	svc    *service.ModelCardService
	logger *zap.Logger
}

// NewModelCardHandler creates a ModelCardHandler.
func NewModelCardHandler(svc *service.ModelCardService, logger *zap.Logger) *ModelCardHandler {
	return &ModelCardHandler{svc: svc, logger: logger}
}

// ListCards handles GET /v1/model-cards.
func (h *ModelCardHandler) ListCards(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	assetID := r.URL.Query().Get("asset_id")
	status := r.URL.Query().Get("status")
	items, err := h.svc.ListCards(r.Context(), p.OrgID, assetID, status)
	if err != nil {
		h.logger.Error("list model cards", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list model cards")
		return
	}
	if items == nil {
		items = []service.ModelCard{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateCard handles POST /v1/model-cards.
func (h *ModelCardHandler) CreateCard(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var mc service.ModelCard
	if err := json.NewDecoder(r.Body).Decode(&mc); err != nil || mc.AssetID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset_id is required")
		return
	}
	mc.OrgID = p.OrgID
	userID := p.UserID
	mc.CreatedBy = &userID
	created, err := h.svc.CreateCard(r.Context(), mc)
	if err != nil {
		h.logger.Error("create model card", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create model card")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// UpdateCard handles PATCH /v1/model-cards/{id}.
func (h *ModelCardHandler) UpdateCard(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var mc service.ModelCard
	_ = json.NewDecoder(r.Body).Decode(&mc)
	if err := h.svc.UpdateCard(r.Context(), id, p.OrgID, mc); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update model card")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PublishCard handles POST /v1/model-cards/{id}/publish.
func (h *ModelCardHandler) PublishCard(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.PublishCard(r.Context(), id, p.OrgID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to publish model card")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
