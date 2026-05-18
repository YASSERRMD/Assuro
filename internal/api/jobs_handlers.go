package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/YASSERRMD/Assuro/internal/jobs"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// JobsHandler exposes admin endpoints for the job queue.
type JobsHandler struct {
	queue  jobs.Queue
	logger *zap.Logger
}

// NewJobsHandler creates a JobsHandler.
func NewJobsHandler(q jobs.Queue, logger *zap.Logger) *JobsHandler {
	return &JobsHandler{queue: q, logger: logger}
}

type enqueueRequest struct {
	Kind        string          `json:"kind"`
	Payload     json.RawMessage `json:"payload"`
	MaxAttempts int             `json:"max_attempts"`
}

// Enqueue handles POST /v1/admin/jobs.
func (h *JobsHandler) Enqueue(w http.ResponseWriter, r *http.Request) {
	var req enqueueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}
	if req.Kind == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "kind is required")
		return
	}

	payload := req.Payload
	if len(payload) == 0 {
		payload = json.RawMessage("{}")
	}

	job, err := h.queue.Enqueue(r.Context(), jobs.EnqueueParams{
		Kind:        req.Kind,
		Payload:     payload,
		MaxAttempts: req.MaxAttempts,
	})
	if err != nil {
		h.logger.Error("enqueue job failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to enqueue job")
		return
	}

	writeJSON(w, http.StatusCreated, job)
}

// List handles GET /v1/admin/jobs.
func (h *JobsHandler) List(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	list, err := h.queue.List(r.Context(), status, limit)
	if err != nil {
		h.logger.Error("list jobs failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list jobs")
		return
	}

	if list == nil {
		list = []jobs.Job{}
	}
	writeJSON(w, http.StatusOK, list)
}

// GetOne handles GET /v1/admin/jobs/{id}.
func (h *JobsHandler) GetOne(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "job id is required")
		return
	}

	job, err := h.queue.Get(r.Context(), id)
	if err != nil {
		h.logger.Error("get job failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to get job")
		return
	}
	if job == nil {
		WriteError(w, http.StatusNotFound, "not_found", "job not found")
		return
	}

	writeJSON(w, http.StatusOK, job)
}
