package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// TaskHandler handles task management endpoints.
type TaskHandler struct {
	svc    *service.TaskService
	logger *zap.Logger
}

// NewTaskHandler creates a TaskHandler.
func NewTaskHandler(svc *service.TaskService, logger *zap.Logger) *TaskHandler {
	return &TaskHandler{svc: svc, logger: logger}
}

// ListTasks handles GET /v1/tasks.
func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	q := r.URL.Query()
	items, err := h.svc.ListTasks(r.Context(), p.OrgID,
		q.Get("status"), q.Get("priority"), q.Get("assignee_id"),
		q.Get("resource_type"), q.Get("resource_id"),
	)
	if err != nil {
		h.logger.Error("list tasks", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list tasks")
		return
	}
	if items == nil {
		items = []service.Task{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateTask handles POST /v1/tasks.
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var t service.Task
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil || t.Title == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "title is required")
		return
	}
	t.OrgID = p.OrgID
	userID := p.UserID
	t.CreatedBy = &userID
	created, err := h.svc.CreateTask(r.Context(), t)
	if err != nil {
		h.logger.Error("create task", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create task")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// UpdateTaskStatus handles PATCH /v1/tasks/{id}/status.
func (h *TaskHandler) UpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Status == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "status is required")
		return
	}
	if err := h.svc.UpdateTaskStatus(r.Context(), id, p.OrgID, body.Status); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to update task status")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// AssignTask handles PATCH /v1/tasks/{id}/assign.
func (h *TaskHandler) AssignTask(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		AssigneeID string `json:"assignee_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if err := h.svc.AssignTask(r.Context(), id, p.OrgID, body.AssigneeID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to assign task")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// AddComment handles POST /v1/tasks/{id}/comments.
func (h *TaskHandler) AddComment(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	taskID := chi.URLParam(r, "id")
	var body struct {
		Body string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Body == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "body is required")
		return
	}
	comment := service.TaskComment{TaskID: taskID, OrgID: p.OrgID, UserID: p.UserID, Body: body.Body}
	created, err := h.svc.AddComment(r.Context(), comment)
	if err != nil {
		h.logger.Error("add task comment", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to add comment")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListComments handles GET /v1/tasks/{id}/comments.
func (h *TaskHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	taskID := chi.URLParam(r, "id")
	items, err := h.svc.ListComments(r.Context(), taskID, p.OrgID)
	if err != nil {
		h.logger.Error("list task comments", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list comments")
		return
	}
	if items == nil {
		items = []service.TaskComment{}
	}
	writeJSON(w, http.StatusOK, items)
}
