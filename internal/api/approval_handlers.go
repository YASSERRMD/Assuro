package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ApprovalHandler handles approval gate endpoints.
type ApprovalHandler struct {
	svc    *service.ApprovalService
	logger *zap.Logger
}

// NewApprovalHandler creates an ApprovalHandler.
func NewApprovalHandler(svc *service.ApprovalService, logger *zap.Logger) *ApprovalHandler {
	return &ApprovalHandler{svc: svc, logger: logger}
}

// ListWorkflows handles GET /v1/approval-workflows.
func (h *ApprovalHandler) ListWorkflows(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	resourceType := r.URL.Query().Get("resource_type")
	items, err := h.svc.ListWorkflows(r.Context(), p.OrgID, resourceType)
	if err != nil {
		h.logger.Error("list approval workflows", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list workflows")
		return
	}
	if items == nil {
		items = []service.ApprovalWorkflow{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateWorkflow handles POST /v1/approval-workflows.
func (h *ApprovalHandler) CreateWorkflow(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var wf service.ApprovalWorkflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil || wf.Name == "" || wf.ResourceType == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name and resource_type are required")
		return
	}
	wf.OrgID = p.OrgID
	userID := p.UserID
	wf.CreatedBy = &userID
	created, err := h.svc.CreateWorkflow(r.Context(), wf)
	if err != nil {
		h.logger.Error("create approval workflow", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create workflow")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListRequests handles GET /v1/approval-requests.
func (h *ApprovalHandler) ListRequests(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	status := r.URL.Query().Get("status")
	resourceType := r.URL.Query().Get("resource_type")
	items, err := h.svc.ListRequests(r.Context(), p.OrgID, status, resourceType)
	if err != nil {
		h.logger.Error("list approval requests", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list requests")
		return
	}
	if items == nil {
		items = []service.ApprovalRequest{}
	}
	writeJSON(w, http.StatusOK, items)
}

// SubmitRequest handles POST /v1/approval-requests.
func (h *ApprovalHandler) SubmitRequest(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var req service.ApprovalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.WorkflowID == "" || req.Title == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "workflow_id and title are required")
		return
	}
	req.OrgID = p.OrgID
	req.RequestedBy = p.UserID
	if req.RequiredCount < 1 {
		req.RequiredCount = 1
	}
	created, err := h.svc.SubmitRequest(r.Context(), req)
	if err != nil {
		h.logger.Error("submit approval request", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to submit request")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// Decide handles POST /v1/approval-requests/{id}/decide.
func (h *ApprovalHandler) Decide(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	requestID := chi.URLParam(r, "id")
	var body struct {
		Decision string `json:"decision"`
		Comment  string `json:"comment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || (body.Decision != "approve" && body.Decision != "reject") {
		WriteError(w, http.StatusBadRequest, "invalid_request", "decision must be 'approve' or 'reject'")
		return
	}
	dec := service.ApprovalDecision{
		RequestID: requestID,
		OrgID:     p.OrgID,
		UserID:    p.UserID,
		Decision:  body.Decision,
		Comment:   body.Comment,
	}
	created, err := h.svc.Decide(r.Context(), dec)
	if err != nil {
		h.logger.Error("record approval decision", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to record decision")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListDecisions handles GET /v1/approval-requests/{id}/decisions.
func (h *ApprovalHandler) ListDecisions(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	requestID := chi.URLParam(r, "id")
	items, err := h.svc.ListDecisions(r.Context(), requestID, p.OrgID)
	if err != nil {
		h.logger.Error("list approval decisions", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list decisions")
		return
	}
	if items == nil {
		items = []service.ApprovalDecision{}
	}
	writeJSON(w, http.StatusOK, items)
}
