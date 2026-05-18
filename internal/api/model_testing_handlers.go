package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ModelTestingHandler handles model testing engine endpoints.
type ModelTestingHandler struct {
	svc    *service.ModelTestingService
	logger *zap.Logger
}

// NewModelTestingHandler creates a ModelTestingHandler.
func NewModelTestingHandler(svc *service.ModelTestingService, logger *zap.Logger) *ModelTestingHandler {
	return &ModelTestingHandler{svc: svc, logger: logger}
}

// ListSuites handles GET /v1/test-suites.
func (h *ModelTestingHandler) ListSuites(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	assetID := r.URL.Query().Get("asset_id")
	items, err := h.svc.ListSuites(r.Context(), p.OrgID, assetID)
	if err != nil {
		h.logger.Error("list test suites", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list suites")
		return
	}
	if items == nil {
		items = []service.TestSuite{}
	}
	writeJSON(w, http.StatusOK, items)
}

// CreateSuite handles POST /v1/test-suites.
func (h *ModelTestingHandler) CreateSuite(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var ts service.TestSuite
	if err := json.NewDecoder(r.Body).Decode(&ts); err != nil || ts.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}
	ts.OrgID = p.OrgID
	userID := p.UserID
	ts.CreatedBy = &userID
	created, err := h.svc.CreateSuite(r.Context(), ts)
	if err != nil {
		h.logger.Error("create test suite", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create suite")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// ListTestCases handles GET /v1/test-suites/{id}/cases.
func (h *ModelTestingHandler) ListTestCases(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	suiteID := chi.URLParam(r, "id")
	items, err := h.svc.ListTestCases(r.Context(), suiteID, p.OrgID)
	if err != nil {
		h.logger.Error("list test cases", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list test cases")
		return
	}
	if items == nil {
		items = []service.TestCase{}
	}
	writeJSON(w, http.StatusOK, items)
}

// AddTestCase handles POST /v1/test-suites/{id}/cases.
func (h *ModelTestingHandler) AddTestCase(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	suiteID := chi.URLParam(r, "id")
	var tc service.TestCase
	if err := json.NewDecoder(r.Body).Decode(&tc); err != nil || tc.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}
	tc.SuiteID = suiteID
	tc.OrgID = p.OrgID
	created, err := h.svc.AddTestCase(r.Context(), tc)
	if err != nil {
		h.logger.Error("add test case", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to add test case")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// StartRun handles POST /v1/test-suites/{id}/runs.
func (h *ModelTestingHandler) StartRun(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	suiteID := chi.URLParam(r, "id")
	run, err := h.svc.StartRun(r.Context(), suiteID, p.OrgID, p.UserID)
	if err != nil {
		h.logger.Error("start test run", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to start run")
		return
	}
	writeJSON(w, http.StatusCreated, run)
}

// ListRuns handles GET /v1/test-suites/{id}/runs.
func (h *ModelTestingHandler) ListRuns(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	suiteID := chi.URLParam(r, "id")
	runs, err := h.svc.ListRuns(r.Context(), suiteID, p.OrgID)
	if err != nil {
		h.logger.Error("list test runs", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list runs")
		return
	}
	if runs == nil {
		runs = []service.TestRun{}
	}
	writeJSON(w, http.StatusOK, runs)
}

// RecordResult handles POST /v1/test-runs/{id}/results.
func (h *ModelTestingHandler) RecordResult(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	runID := chi.URLParam(r, "id")
	var res service.TestResult
	if err := json.NewDecoder(r.Body).Decode(&res); err != nil || res.CaseID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "case_id is required")
		return
	}
	res.RunID = runID
	res.OrgID = p.OrgID
	created, err := h.svc.RecordResult(r.Context(), res)
	if err != nil {
		h.logger.Error("record test result", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to record result")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// FinishRun handles POST /v1/test-runs/{id}/finish.
func (h *ModelTestingHandler) FinishRun(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	runID := chi.URLParam(r, "id")
	if err := h.svc.FinishRun(r.Context(), runID, p.OrgID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to finish run")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListResults handles GET /v1/test-runs/{id}/results.
func (h *ModelTestingHandler) ListResults(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	runID := chi.URLParam(r, "id")
	results, err := h.svc.ListResults(r.Context(), runID, p.OrgID)
	if err != nil {
		h.logger.Error("list test results", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list results")
		return
	}
	if results == nil {
		results = []service.TestResult{}
	}
	writeJSON(w, http.StatusOK, results)
}
