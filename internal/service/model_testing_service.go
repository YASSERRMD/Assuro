package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// TestSuite is a collection of test cases for a model.
type TestSuite struct {
	ID          string  `json:"id"`
	OrgID       string  `json:"org_id"`
	AssetID     *string `json:"asset_id,omitempty"`
	Name        string  `json:"name"`
	Description string  `json:"description,omitempty"`
	SuiteType   string  `json:"suite_type"`
	Status      string  `json:"status"`
	CreatedBy   *string `json:"created_by,omitempty"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

// TestCase is a single test within a suite.
type TestCase struct {
	ID          string          `json:"id"`
	SuiteID     string          `json:"suite_id"`
	OrgID       string          `json:"org_id"`
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	Input       json.RawMessage `json:"input"`
	Expected    json.RawMessage `json:"expected"`
	Tags        []string        `json:"tags"`
	CreatedAt   string          `json:"created_at"`
}

// TestRun is an execution of a test suite.
type TestRun struct {
	ID          string   `json:"id"`
	SuiteID     string   `json:"suite_id"`
	OrgID       string   `json:"org_id"`
	Status      string   `json:"status"`
	Total       int      `json:"total"`
	Passed      int      `json:"passed"`
	Failed      int      `json:"failed"`
	Score       *float64 `json:"score,omitempty"`
	TriggeredBy *string  `json:"triggered_by,omitempty"`
	StartedAt   string   `json:"started_at"`
	FinishedAt  *string  `json:"finished_at,omitempty"`
}

// TestResult is the outcome of a single test case in a run.
type TestResult struct {
	ID         string          `json:"id"`
	RunID      string          `json:"run_id"`
	CaseID     string          `json:"case_id"`
	OrgID      string          `json:"org_id"`
	Outcome    string          `json:"outcome"`
	Actual     json.RawMessage `json:"actual"`
	Score      *float64        `json:"score,omitempty"`
	ErrorMsg   string          `json:"error_msg,omitempty"`
	DurationMs *int            `json:"duration_ms,omitempty"`
	CreatedAt  string          `json:"created_at"`
}

// ModelTestingService manages test suites, runs and results.
type ModelTestingService struct {
	db *store.DB
}

// NewModelTestingService creates a ModelTestingService.
func NewModelTestingService(db *store.DB) *ModelTestingService {
	return &ModelTestingService{db: db}
}

// CreateSuite creates a new test suite.
func (s *ModelTestingService) CreateSuite(ctx context.Context, ts TestSuite) (*TestSuite, error) {
	if ts.SuiteType == "" {
		ts.SuiteType = "functional"
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO test_suites (org_id, asset_id, name, description, suite_type, created_by)
		 VALUES ($1, NULLIF($2,'')::uuid, $3, $4, $5, NULLIF($6,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		ts.OrgID, derefStr(ts.AssetID), ts.Name, ts.Description, ts.SuiteType, derefStr(ts.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create test suite: %w", err)
	}
	ts.ID = id
	ts.Status = "active"
	ts.CreatedAt = createdAt
	ts.UpdatedAt = updatedAt
	return &ts, nil
}

// ListSuites returns test suites for an org.
func (s *ModelTestingService) ListSuites(ctx context.Context, orgID, assetID string) ([]TestSuite, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, asset_id::text, name, COALESCE(description,''),
		        suite_type, status, created_by::text, created_at::text, updated_at::text
		 FROM test_suites
		 WHERE org_id=$1 AND ($2='' OR asset_id::text=$2)
		 ORDER BY created_at DESC`,
		orgID, assetID,
	)
	if err != nil {
		return nil, fmt.Errorf("list test suites: %w", err)
	}
	defer rows.Close()

	var out []TestSuite
	for rows.Next() {
		var ts TestSuite
		if err := rows.Scan(&ts.ID, &ts.OrgID, &ts.AssetID, &ts.Name, &ts.Description,
			&ts.SuiteType, &ts.Status, &ts.CreatedBy, &ts.CreatedAt, &ts.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, ts)
	}
	return out, rows.Err()
}

// AddTestCase adds a test case to a suite.
func (s *ModelTestingService) AddTestCase(ctx context.Context, tc TestCase) (*TestCase, error) {
	if tc.Input == nil {
		tc.Input = json.RawMessage("{}")
	}
	if tc.Expected == nil {
		tc.Expected = json.RawMessage("{}")
	}
	if tc.Tags == nil {
		tc.Tags = []string{}
	}
	var id, createdAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO test_cases (suite_id, org_id, name, description, input, expected, tags)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at::text`,
		tc.SuiteID, tc.OrgID, tc.Name, tc.Description, tc.Input, tc.Expected, tc.Tags,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("add test case: %w", err)
	}
	tc.ID = id
	tc.CreatedAt = createdAt
	return &tc, nil
}

// ListTestCases returns test cases for a suite.
func (s *ModelTestingService) ListTestCases(ctx context.Context, suiteID, orgID string) ([]TestCase, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, suite_id, org_id, name, COALESCE(description,''),
		        input, expected, tags, created_at::text
		 FROM test_cases WHERE suite_id=$1 AND org_id=$2 ORDER BY created_at`,
		suiteID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list test cases: %w", err)
	}
	defer rows.Close()

	var out []TestCase
	for rows.Next() {
		var tc TestCase
		if err := rows.Scan(&tc.ID, &tc.SuiteID, &tc.OrgID, &tc.Name, &tc.Description,
			&tc.Input, &tc.Expected, &tc.Tags, &tc.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, tc)
	}
	return out, rows.Err()
}

// StartRun creates a test run record.
func (s *ModelTestingService) StartRun(ctx context.Context, suiteID, orgID, userID string) (*TestRun, error) {
	// Count test cases for total
	var total int
	_ = s.db.Pool().QueryRow(ctx,
		`SELECT COUNT(*) FROM test_cases WHERE suite_id=$1 AND org_id=$2`,
		suiteID, orgID,
	).Scan(&total)

	var id, startedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO test_runs (suite_id, org_id, total, triggered_by)
		 VALUES ($1, $2, $3, NULLIF($4,'')::uuid)
		 RETURNING id, started_at::text`,
		suiteID, orgID, total, userID,
	).Scan(&id, &startedAt)
	if err != nil {
		return nil, fmt.Errorf("start test run: %w", err)
	}
	return &TestRun{
		ID:          id,
		SuiteID:     suiteID,
		OrgID:       orgID,
		Status:      "running",
		Total:       total,
		StartedAt:   startedAt,
		TriggeredBy: &userID,
	}, nil
}

// RecordResult stores a test case result and updates run aggregates.
func (s *ModelTestingService) RecordResult(ctx context.Context, res TestResult) (*TestResult, error) {
	if res.Actual == nil {
		res.Actual = json.RawMessage("{}")
	}
	if res.Outcome == "" {
		res.Outcome = "pending"
	}
	var id, createdAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO test_results (run_id, case_id, org_id, outcome, actual, score, error_msg, duration_ms)
		 VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7,''), $8)
		 RETURNING id, created_at::text`,
		res.RunID, res.CaseID, res.OrgID, res.Outcome, res.Actual, res.Score, res.ErrorMsg, res.DurationMs,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("record test result: %w", err)
	}
	res.ID = id
	res.CreatedAt = createdAt
	return &res, nil
}

// FinishRun marks a run complete and calculates the pass score.
func (s *ModelTestingService) FinishRun(ctx context.Context, runID, orgID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE test_runs tr
		 SET status = CASE WHEN failed = 0 THEN 'passed' ELSE 'failed' END,
		     passed = (SELECT COUNT(*) FROM test_results WHERE run_id=$1 AND outcome='pass'),
		     failed = (SELECT COUNT(*) FROM test_results WHERE run_id=$1 AND outcome='fail'),
		     score  = CASE WHEN total > 0
		                   THEN ROUND(100.0 * (SELECT COUNT(*) FROM test_results WHERE run_id=$1 AND outcome='pass') / total, 2)
		                   ELSE NULL END,
		     finished_at = now()
		 WHERE id=$1 AND org_id=$2`,
		runID, orgID,
	)
	return err
}

// ListRuns returns test runs for a suite.
func (s *ModelTestingService) ListRuns(ctx context.Context, suiteID, orgID string) ([]TestRun, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, suite_id, org_id, status, total, passed, failed,
		        score, triggered_by::text, started_at::text, finished_at::text
		 FROM test_runs WHERE suite_id=$1 AND org_id=$2
		 ORDER BY started_at DESC LIMIT 50`,
		suiteID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list test runs: %w", err)
	}
	defer rows.Close()

	var out []TestRun
	for rows.Next() {
		var tr TestRun
		if err := rows.Scan(&tr.ID, &tr.SuiteID, &tr.OrgID, &tr.Status,
			&tr.Total, &tr.Passed, &tr.Failed, &tr.Score,
			&tr.TriggeredBy, &tr.StartedAt, &tr.FinishedAt); err != nil {
			return nil, err
		}
		out = append(out, tr)
	}
	return out, rows.Err()
}

// ListResults returns test results for a run.
func (s *ModelTestingService) ListResults(ctx context.Context, runID, orgID string) ([]TestResult, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, run_id, case_id, org_id, outcome, actual, score,
		        COALESCE(error_msg,''), duration_ms, created_at::text
		 FROM test_results WHERE run_id=$1 AND org_id=$2 ORDER BY created_at`,
		runID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list test results: %w", err)
	}
	defer rows.Close()

	var out []TestResult
	for rows.Next() {
		var r TestResult
		if err := rows.Scan(&r.ID, &r.RunID, &r.CaseID, &r.OrgID, &r.Outcome,
			&r.Actual, &r.Score, &r.ErrorMsg, &r.DurationMs, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
