package api

import (
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// RegulatoryHandler exposes regulatory content endpoints.
type RegulatoryHandler struct {
	svc    *service.RegulatoryService
	logger *zap.Logger
}

// NewRegulatoryHandler creates a RegulatoryHandler.
func NewRegulatoryHandler(svc *service.RegulatoryService, logger *zap.Logger) *RegulatoryHandler {
	return &RegulatoryHandler{svc: svc, logger: logger}
}

// ListRequirements handles GET /v1/regulatory/requirements.
func (h *RegulatoryHandler) ListRequirements(w http.ResponseWriter, r *http.Request) {
	fwKey := r.URL.Query().Get("framework")
	q := r.URL.Query().Get("q")

	var reqs []service.RegulatoryRequirement
	var err error
	if q != "" {
		reqs, err = h.svc.SearchRequirements(r.Context(), q)
	} else {
		reqs, err = h.svc.ListRequirements(r.Context(), fwKey)
	}
	if err != nil {
		h.logger.Error("list requirements", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list requirements")
		return
	}
	if reqs == nil {
		reqs = []service.RegulatoryRequirement{}
	}
	writeJSON(w, http.StatusOK, reqs)
}

// ListControls handles GET /v1/regulatory/controls.
func (h *RegulatoryHandler) ListControls(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	controls, err := h.svc.ListControls(r.Context(), domain)
	if err != nil {
		h.logger.Error("list regulatory controls", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list controls")
		return
	}
	if controls == nil {
		controls = []service.RegulatoryControl{}
	}
	writeJSON(w, http.StatusOK, controls)
}
