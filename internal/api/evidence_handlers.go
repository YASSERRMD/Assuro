package api

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
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

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "multipart parse failed")
		return
	}

	title := r.FormValue("title")
	if title == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "title is required")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "file is required")
		return
	}
	defer file.Close()

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	evidence, err := h.svc.UploadEvidence(r.Context(), service.UploadEvidenceInput{
		OrgID:        p.OrgID,
		Title:        title,
		OriginalName: header.Filename,
		MimeType:     mimeType,
		SizeBytes:    header.Size,
		UploadedBy:   p.UserID,
		Content:      file,
	})
	if err != nil {
		h.logger.Error("upload evidence failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to upload evidence")
		return
	}

	writeJSON(w, http.StatusCreated, evidence)
}

// Download handles GET /v1/evidence/{id}/download.
func (h *EvidenceHandler) Download(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "evidence id is required")
		return
	}

	rc, ev, err := h.svc.DownloadEvidence(r.Context(), id)
	if err != nil {
		h.logger.Error("download evidence failed", zap.Error(err))
		WriteError(w, http.StatusNotFound, "not_found", "file not available")
		return
	}
	defer rc.Close()

	filename := filepath.Base(ev.FileKey)
	mimeType := ev.MimeType.String
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	w.Header().Set("Content-Type", mimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("Cache-Control", "private, no-cache")

	if _, err := io.Copy(w, rc); err != nil {
		h.logger.Error("stream evidence failed", zap.Error(err))
	}
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
