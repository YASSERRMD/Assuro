package api

import (
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/report"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ReportHandler handles report HTTP requests.
type ReportHandler struct {
	builder *report.Builder
	logger  *zap.Logger
}

// NewReportHandler creates a new report handler.
func NewReportHandler(builder *report.Builder, logger *zap.Logger) *ReportHandler {
	return &ReportHandler{builder: builder, logger: logger}
}

// GetReport handles GET /v1/assets/{id}/report.
func (h *ReportHandler) GetReport(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	assetID := chi.URLParam(r, "id")
	if assetID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset id is required")
		return
	}

	framework := r.URL.Query().Get("framework")
	if framework == "" {
		framework = "eu_ai_act"
	}

	format := r.URL.Query().Get("format")

	reportData, err := h.builder.BuildJSON(assetID, framework, nil, nil, nil)
	if err != nil {
		h.logger.Error("build report failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to build report")
		return
	}

	if format == "html" {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(h.builder.BuildHTML(reportData)))
		return
	}

	writeJSON(w, http.StatusOK, reportData)
}
