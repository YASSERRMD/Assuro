package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// ExportHandler handles data export and import endpoints.
type ExportHandler struct {
	svc    *service.ExportService
	logger *zap.Logger
}

// NewExportHandler creates an ExportHandler.
func NewExportHandler(svc *service.ExportService, logger *zap.Logger) *ExportHandler {
	return &ExportHandler{svc: svc, logger: logger}
}

// ExportOrg handles GET /v1/export — returns full org JSON export.
func (h *ExportHandler) ExportOrg(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	exp, err := h.svc.ExportOrg(r.Context(), p.OrgID)
	if err != nil {
		h.logger.Error("export org", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to export org data")
		return
	}
	b, err := service.ExportJSON(exp)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to serialize export")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", `attachment; filename="assuro-export.json"`)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(b)
}

// ExportAssetsCSV handles GET /v1/export/assets.csv.
func (h *ExportHandler) ExportAssetsCSV(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="assets.csv"`)
	if err := h.svc.ExportAssetsCSV(r.Context(), p.OrgID, w); err != nil {
		h.logger.Error("export assets csv", zap.Error(err))
	}
}

// ImportAssets handles POST /v1/import/assets — bulk asset creation.
func (h *ExportHandler) ImportAssets(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	var rows []service.ImportAssetRow
	if err := json.NewDecoder(r.Body).Decode(&rows); err != nil || len(rows) == 0 {
		WriteError(w, http.StatusBadRequest, "invalid_request", "expected non-empty array of asset rows")
		return
	}
	result, err := h.svc.ImportAssets(r.Context(), p.OrgID, rows)
	if err != nil {
		h.logger.Error("import assets", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "import failed")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ImportVendors handles POST /v1/import/vendors — bulk vendor creation.
func (h *ExportHandler) ImportVendors(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	var rows []service.ImportVendorRow
	if err := json.NewDecoder(r.Body).Decode(&rows); err != nil || len(rows) == 0 {
		WriteError(w, http.StatusBadRequest, "invalid_request", "expected non-empty array of vendor rows")
		return
	}
	result, err := h.svc.ImportVendors(r.Context(), p.OrgID, rows)
	if err != nil {
		h.logger.Error("import vendors", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "import failed")
		return
	}
	writeJSON(w, http.StatusOK, result)
}
