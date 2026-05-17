package api

import (
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// EvidenceHandler handles evidence HTTP requests.
type EvidenceHandler struct {
	svc    *service.EvidenceService
	logger *zap.Logger
}

// NewEvidenceHandler creates a new evidence handler.
func NewEvidenceHandler(svc *service.EvidenceService, logger *zap.Logger) *EvidenceHandler {
	return &EvidenceHandler{svc: svc, logger: logger}
}

// Upload handles POST /v1/evidence.
func (h *EvidenceHandler) Upload(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	title := r.FormValue("title")
	if title == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "title is required")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "file is required")
		return
	}
	defer file.Close()

	evidence, err := h.svc.UploadEvidence(r.Context(), service.UploadEvidenceInput{
		OrgID:      p.OrgID,
		Title:      title,
		UploadedBy: p.UserID,
		Content:    file,
	})
	if err != nil {
		h.logger.Error("upload evidence failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to upload evidence")
		return
	}

	writeJSON(w, http.StatusCreated, evidence)
}

// List handles GET /v1/evidence.
func (h *EvidenceHandler) List(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	targetType := r.URL.Query().Get("target_type")
	targetID := r.URL.Query().Get("target_id")

	if targetType != "" && targetID != "" {
		evidence, err := h.svc.ListEvidenceByTarget(r.Context(), targetType, targetID)
		if err != nil {
			h.logger.Error("list evidence failed", zap.Error(err))
			WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list evidence")
			return
		}
		writeJSON(w, http.StatusOK, evidence)
		return
	}

	writeJSON(w, http.StatusOK, []any{})
}
