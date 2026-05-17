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

// AssetHandler handles asset HTTP requests.
type AssetHandler struct {
	svc    *service.AssetService
	logger *zap.Logger
}

// NewAssetHandler creates a new asset handler.
func NewAssetHandler(svc *service.AssetService, logger *zap.Logger) *AssetHandler {
	return &AssetHandler{svc: svc, logger: logger}
}

type createAssetRequest struct {
	AssetType   string `json:"asset_type"`
	Name        string `json:"name"`
	Description string `json:"description"`
	OwnerUserID string `json:"owner_user_id"`
}

// Create handles POST /v1/assets.
func (h *AssetHandler) Create(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	var req createAssetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if req.AssetType == "" || req.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset_type and name are required")
		return
	}

	asset, err := h.svc.CreateAsset(r.Context(), service.CreateAssetInput{
		OrgID:       p.OrgID,
		AssetType:   req.AssetType,
		Name:        req.Name,
		Description: req.Description,
		OwnerUserID: req.OwnerUserID,
	})
	if err != nil {
		h.logger.Error("create asset failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create asset")
		return
	}

	writeJSON(w, http.StatusCreated, asset)
}

// GetOne handles GET /v1/assets/{id}.
func (h *AssetHandler) GetOne(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	asset, err := h.svc.GetAssetByID(r.Context(), p.OrgID, id)
	if err != nil {
		WriteError(w, http.StatusNotFound, "not_found", "asset not found")
		return
	}

	writeJSON(w, http.StatusOK, asset)
}

// List handles GET /v1/assets.
func (h *AssetHandler) List(w http.ResponseWriter, r *http.Request) {
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

	assets, err := h.svc.ListAssets(r.Context(), service.ListAssetsInput{
		OrgID:           p.OrgID,
		AssetType:       r.URL.Query().Get("asset_type"),
		LifecycleStatus: r.URL.Query().Get("status"),
		Limit:           int32(limit),
		Offset:          int32(offset),
	})
	if err != nil {
		h.logger.Error("list assets failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list assets")
		return
	}

	writeJSON(w, http.StatusOK, assets)
}

type updateAssetRequest struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	OwnerUserID     string `json:"owner_user_id"`
	LifecycleStatus string `json:"lifecycle_status"`
}

// Update handles PATCH /v1/assets/{id}.
func (h *AssetHandler) Update(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	var req updateAssetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	asset, err := h.svc.UpdateAsset(r.Context(), service.UpdateAssetInput{
		AssetID:         id,
		OrgID:           p.OrgID,
		Name:            req.Name,
		Description:     req.Description,
		OwnerUserID:     req.OwnerUserID,
		LifecycleStatus: req.LifecycleStatus,
	})
	if err != nil {
		h.logger.Error("update asset failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update asset")
		return
	}

	writeJSON(w, http.StatusOK, asset)
}

// Archive handles DELETE /v1/assets/{id}.
func (h *AssetHandler) Archive(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	if err := h.svc.ArchiveAsset(r.Context(), p.OrgID, id); err != nil {
		h.logger.Error("archive asset failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to archive asset")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
