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

// AssessmentHandler handles assessment HTTP requests.
type AssessmentHandler struct {
	svc    *service.AssessmentService
	logger *zap.Logger
}

// NewAssessmentHandler creates a new assessment handler.
func NewAssessmentHandler(svc *service.AssessmentService, logger *zap.Logger) *AssessmentHandler {
	return &AssessmentHandler{svc: svc, logger: logger}
}

type createAssessmentRequest struct {
	AssetID    string `json:"asset_id"`
	TemplateID string `json:"template_id"`
}

// Create handles POST /v1/assessments.
func (h *AssessmentHandler) Create(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	var req createAssessmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if req.AssetID == "" || req.TemplateID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "asset_id and template_id are required")
		return
	}

	assessment, err := h.svc.CreateAssessment(r.Context(), service.CreateAssessmentInput{
		OrgID:      p.OrgID,
		AssetID:    req.AssetID,
		TemplateID: req.TemplateID,
		StartedBy:  p.UserID,
	})
	if err != nil {
		h.logger.Error("create assessment failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create assessment")
		return
	}

	writeJSON(w, http.StatusCreated, assessment)
}

type saveResponseRequest struct {
	QuestionID string `json:"question_id"`
	Answer     any    `json:"answer"`
	Note       string `json:"note"`
}

// SaveResponse handles POST /v1/assessments/{id}/responses.
func (h *AssessmentHandler) SaveResponse(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	assessmentID := chi.URLParam(r, "id")
	if assessmentID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "assessment id is required")
		return
	}

	var req saveResponseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	answerBytes, _ := json.Marshal(req.Answer)

	resp, err := h.svc.SaveResponse(r.Context(), service.SaveResponseInput{
		AssessmentID: assessmentID,
		QuestionID:   req.QuestionID,
		Answer:       answerBytes,
		AnsweredBy:   p.UserID,
		Note:         req.Note,
	})
	if err != nil {
		h.logger.Error("save response failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to save response")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Submit handles POST /v1/assessments/{id}/submit.
func (h *AssessmentHandler) Submit(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	assessmentID := chi.URLParam(r, "id")
	if assessmentID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "assessment id is required")
		return
	}

	if err := h.svc.SubmitAssessment(r.Context(), p.OrgID, assessmentID); err != nil {
		h.logger.Error("submit assessment failed", zap.Error(err))
		WriteError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "completed"})
}

// List handles GET /v1/assessments.
func (h *AssessmentHandler) List(w http.ResponseWriter, r *http.Request) {
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

	assessments, err := h.svc.ListAssessmentsByOrg(r.Context(), p.OrgID, int32(limit), int32(offset))
	if err != nil {
		h.logger.Error("list assessments failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list assessments")
		return
	}

	writeJSON(w, http.StatusOK, assessments)
}

// GetOne handles GET /v1/assessments/{id}.
func (h *AssessmentHandler) GetOne(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "assessment id is required")
		return
	}

	assessment, err := h.svc.GetAssessment(r.Context(), p.OrgID, id)
	if err != nil {
		WriteError(w, http.StatusNotFound, "not_found", "assessment not found")
		return
	}

	writeJSON(w, http.StatusOK, assessment)
}
