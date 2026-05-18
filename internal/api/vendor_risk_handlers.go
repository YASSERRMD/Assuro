package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// VendorRiskHandler handles vendor registry and assessment endpoints.
type VendorRiskHandler struct {
	svc    *service.VendorRiskService
	logger *zap.Logger
}

// NewVendorRiskHandler creates a VendorRiskHandler.
func NewVendorRiskHandler(svc *service.VendorRiskService, logger *zap.Logger) *VendorRiskHandler {
	return &VendorRiskHandler{svc: svc, logger: logger}
}

// ListVendors handles GET /v1/vendors.
func (h *VendorRiskHandler) ListVendors(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	vendorType := r.URL.Query().Get("type")
	riskTier := r.URL.Query().Get("risk_tier")
	items, err := h.svc.ListVendors(r.Context(), p.OrgID, vendorType, riskTier)
	if err != nil {
		h.logger.Error("list vendors", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list vendors")
		return
	}
	if items == nil {
		items = []service.Vendor{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateVendor handles POST /v1/vendors.
func (h *VendorRiskHandler) CreateVendor(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var v service.Vendor
	if err := json.NewDecoder(r.Body).Decode(&v); err != nil || v.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}
	v.OrgID = p.OrgID
	userID := p.UserID
	v.CreatedBy = &userID
	created, err := h.svc.CreateVendor(r.Context(), v)
	if err != nil {
		h.logger.Error("create vendor", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create vendor")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListAssessments handles GET /v1/vendors/{id}/assessments.
func (h *VendorRiskHandler) ListAssessments(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	vendorID := chi.URLParam(r, "id")
	items, err := h.svc.ListAssessments(r.Context(), vendorID, p.OrgID)
	if err != nil {
		h.logger.Error("list vendor assessments", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list assessments")
		return
	}
	if items == nil {
		items = []service.VendorAssessment{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateAssessment handles POST /v1/vendors/{id}/assessments.
func (h *VendorRiskHandler) CreateAssessment(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	vendorID := chi.URLParam(r, "id")
	var a service.VendorAssessment
	_ = json.NewDecoder(r.Body).Decode(&a)
	a.VendorID = vendorID
	a.OrgID = p.OrgID
	userID := p.UserID
	a.AssessedBy = &userID
	created, err := h.svc.CreateAssessment(r.Context(), a)
	if err != nil {
		h.logger.Error("create vendor assessment", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create assessment")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}
