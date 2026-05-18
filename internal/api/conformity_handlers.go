package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ConformityHandler handles conformity assessment and declaration endpoints.
type ConformityHandler struct {
	svc    *service.ConformityService
	logger *zap.Logger
}

// NewConformityHandler creates a ConformityHandler.
func NewConformityHandler(svc *service.ConformityService, logger *zap.Logger) *ConformityHandler {
	return &ConformityHandler{svc: svc, logger: logger}
}

// ListAssessments handles GET /v1/conformity/assessments.
func (h *ConformityHandler) ListAssessments(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	assetID := r.URL.Query().Get("asset_id")
	kind := r.URL.Query().Get("kind")
	items, err := h.svc.ListAssessments(r.Context(), p.OrgID, assetID, kind)
	if err != nil {
		h.logger.Error("list conformity assessments", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list assessments")
		return
	}
	if items == nil {
		items = []service.ConformityAssessment{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateAssessment handles POST /v1/conformity/assessments.
func (h *ConformityHandler) CreateAssessment(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var a service.ConformityAssessment
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil || a.AssetID == "" || a.Kind == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset_id, kind and title are required")
		return
	}
	a.OrgID = p.OrgID
	userID := p.UserID
	a.CreatedBy = &userID
	created, err := h.svc.CreateAssessment(r.Context(), a)
	if err != nil {
		h.logger.Error("create conformity assessment", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create assessment")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// UpdateAssessment handles PATCH /v1/conformity/assessments/{id}.
func (h *ConformityHandler) UpdateAssessment(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		Status     string          `json:"status"`
		Conclusion string          `json:"conclusion"`
		Findings   json.RawMessage `json:"findings"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if err := h.svc.UpdateAssessment(r.Context(), id, p.OrgID, body.Status, body.Conclusion, body.Findings); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update assessment")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// SignAssessment handles POST /v1/conformity/assessments/{id}/sign.
func (h *ConformityHandler) SignAssessment(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.SignAssessment(r.Context(), id, p.OrgID, p.UserID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to sign assessment")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// IssueDeclaration handles POST /v1/conformity/declarations.
func (h *ConformityHandler) IssueDeclaration(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var d service.ConformityDeclaration
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil || d.AssetID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset_id is required")
		return
	}
	d.OrgID = p.OrgID
	created, err := h.svc.IssueDeclaration(r.Context(), d)
	if err != nil {
		h.logger.Error("issue declaration", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to issue declaration")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListDeclarations handles GET /v1/conformity/declarations.
func (h *ConformityHandler) ListDeclarations(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	assetID := r.URL.Query().Get("asset_id")
	items, err := h.svc.ListDeclarations(r.Context(), p.OrgID, assetID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list declarations")
		return
	}
	if items == nil {
		items = []service.ConformityDeclaration{}
	}
	writeJSON(w, http.StatusOK, items)
}
