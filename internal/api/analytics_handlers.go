package api

import (
	"net/http"
	"strconv"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// AnalyticsHandler handles analytics and metrics endpoints.
type AnalyticsHandler struct {
	svc    *service.AnalyticsService
	logger *zap.Logger
}

// NewAnalyticsHandler creates an AnalyticsHandler.
func NewAnalyticsHandler(svc *service.AnalyticsService, logger *zap.Logger) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc, logger: logger}
}

// GetDashboard handles GET /v1/analytics/dashboard.
func (h *AnalyticsHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	dash, err := h.svc.GetDashboard(r.Context(), p.OrgID)
	if err != nil {
		h.logger.Error("get analytics dashboard", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to get dashboard")
		return
	}
	writeJSON(w, http.StatusOK, dash)
}

// AssetRiskTrend handles GET /v1/analytics/assets/{id}/risk-trend.
func (h *AnalyticsHandler) AssetRiskTrend(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	// Get assetID from query param since we use a flat route
	assetID := r.URL.Query().Get("asset_id")
	if assetID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset_id is required")
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	trend, err := h.svc.AssetRiskTrend(r.Context(), assetID, p.OrgID, limit)
	if err != nil {
		h.logger.Error("asset risk trend", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to get risk trend")
		return
	}
	writeJSON(w, http.StatusOK, trend)
}
