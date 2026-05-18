package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Status values for a job.
const (
	StatusPending   = "pending"
	StatusRunning   = "running"
	StatusSucceeded = "succeeded"
	StatusFailed    = "failed"
	StatusDead      = "dead"
)

// Job represents a single unit of background work.
type Job struct {
	ID          string          `json:"id"`
	Kind        string          `json:"kind"`
	Payload     json.RawMessage `json:"payload"`
	Status      string          `json:"status"`
	Attempts    int             `json:"attempts"`
	MaxAttempts int             `json:"max_attempts"`
	ScheduledAt time.Time       `json:"scheduled_at"`
	LockedAt    *time.Time      `json:"locked_at,omitempty"`
	LockedBy    string          `json:"locked_by,omitempty"`
	LastError   string          `json:"last_error,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// EnqueueParams holds options for enqueueing a job.
type EnqueueParams struct {
	Kind        string
	Payload     any
	MaxAttempts int
	ScheduledAt time.Time
}

// Queue is the interface for the job store.
type Queue interface {
	Enqueue(ctx context.Context, p EnqueueParams) (*Job, error)
	Dequeue(ctx context.Context, workerID string, kinds []string) (*Job, error)
	Ack(ctx context.Context, jobID string) error
	Fail(ctx context.Context, jobID string, errMsg string) error
	List(ctx context.Context, status string, limit int) ([]Job, error)
	Get(ctx context.Context, jobID string) (*Job, error)
}

// PostgresQueue is a Postgres-backed job queue using SELECT FOR UPDATE SKIP LOCKED.
type PostgresQueue struct {
	pool *pgxpool.Pool
}

// NewPostgresQueue creates a PostgresQueue backed by the given pool.
func NewPostgresQueue(pool *pgxpool.Pool) *PostgresQueue {
	return &PostgresQueue{pool: pool}
}

func (q *PostgresQueue) Enqueue(ctx context.Context, p EnqueueParams) (*Job, error) {
	raw, err := json.Marshal(p.Payload)
	if err != nil {
		return nil, fmt.Errorf("marshal payload: %w", err)
	}

	maxAttempts := p.MaxAttempts
	if maxAttempts <= 0 {
		maxAttempts = 3
	}

	scheduledAt := p.ScheduledAt
	if scheduledAt.IsZero() {
		scheduledAt = time.Now().UTC()
	}

	const q1 = `
INSERT INTO jobs (kind, payload, max_attempts, scheduled_at)
VALUES ($1, $2, $3, $4)
RETURNING id, kind, payload, status, attempts, max_attempts,
          scheduled_at, locked_at, locked_by, last_error, created_at, updated_at`

	row := q.pool.QueryRow(ctx, q1, p.Kind, raw, maxAttempts, scheduledAt)
	return scanJob(row)
}

func (q *PostgresQueue) Dequeue(ctx context.Context, workerID string, kinds []string) (*Job, error) {
	var kindFilter any
	if len(kinds) > 0 {
		kindFilter = kinds
	}

	const q1 = `
UPDATE jobs SET
    status    = 'running',
    attempts  = attempts + 1,
    locked_at = now(),
    locked_by = $1,
    updated_at = now()
WHERE id = (
    SELECT id FROM jobs
    WHERE status = 'pending'
      AND scheduled_at <= now()
      AND ($2::text[] IS NULL OR kind = ANY($2::text[]))
    ORDER BY scheduled_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
)
RETURNING id, kind, payload, status, attempts, max_attempts,
          scheduled_at, locked_at, locked_by, last_error, created_at, updated_at`

	row := q.pool.QueryRow(ctx, q1, workerID, kindFilter)
	j, err := scanJob(row)
	if err != nil {
		if isNoRows(err) {
			return nil, nil
		}
		return nil, err
	}
	return j, nil
}

func (q *PostgresQueue) Ack(ctx context.Context, jobID string) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE jobs SET status = 'succeeded', locked_at = NULL, locked_by = NULL, updated_at = now() WHERE id = $1`,
		jobID,
	)
	return err
}

func (q *PostgresQueue) Fail(ctx context.Context, jobID string, errMsg string) error {
	const q1 = `
UPDATE jobs SET
    status     = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
    last_error = $2,
    locked_at  = NULL,
    locked_by  = NULL,
    updated_at = now()
WHERE id = $1`
	_, err := q.pool.Exec(ctx, q1, jobID, errMsg)
	return err
}

func (q *PostgresQueue) List(ctx context.Context, status string, limit int) ([]Job, error) {
	if limit <= 0 {
		limit = 50
	}

	var rows interface{ Next() bool; Scan(...any) error; Err() error }
	var err error

	if status == "" {
		r, e := q.pool.Query(ctx,
			`SELECT id, kind, payload, status, attempts, max_attempts,
                    scheduled_at, locked_at, locked_by, last_error, created_at, updated_at
             FROM jobs ORDER BY created_at DESC LIMIT $1`,
			limit,
		)
		rows, err = r, e
	} else {
		r, e := q.pool.Query(ctx,
			`SELECT id, kind, payload, status, attempts, max_attempts,
                    scheduled_at, locked_at, locked_by, last_error, created_at, updated_at
             FROM jobs WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
			status, limit,
		)
		rows, err = r, e
	}
	if err != nil {
		return nil, err
	}

	pgRows, ok := rows.(interface {
		Next() bool
		Scan(...any) error
		Err() error
		Close()
	})
	if !ok {
		return nil, fmt.Errorf("unexpected rows type")
	}
	defer pgRows.Close()

	var jobs []Job
	for pgRows.Next() {
		j, err := scanJobFromRows(pgRows)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, *j)
	}
	return jobs, pgRows.Err()
}

func (q *PostgresQueue) Get(ctx context.Context, jobID string) (*Job, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, kind, payload, status, attempts, max_attempts,
                scheduled_at, locked_at, locked_by, last_error, created_at, updated_at
         FROM jobs WHERE id = $1`,
		jobID,
	)
	j, err := scanJob(row)
	if err != nil {
		if isNoRows(err) {
			return nil, nil
		}
		return nil, err
	}
	return j, nil
}

// rowScanner is satisfied by pgx.Row.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanJob(row rowScanner) (*Job, error) {
	var j Job
	var lockedAt *time.Time
	var lockedBy, lastError *string
	err := row.Scan(
		&j.ID, &j.Kind, &j.Payload, &j.Status, &j.Attempts, &j.MaxAttempts,
		&j.ScheduledAt, &lockedAt, &lockedBy, &lastError, &j.CreatedAt, &j.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	j.LockedAt = lockedAt
	if lockedBy != nil {
		j.LockedBy = *lockedBy
	}
	if lastError != nil {
		j.LastError = *lastError
	}
	return &j, nil
}

type rowsScanner interface {
	Scan(...any) error
}

func scanJobFromRows(rows rowsScanner) (*Job, error) {
	var j Job
	var lockedAt *time.Time
	var lockedBy, lastError *string
	err := rows.Scan(
		&j.ID, &j.Kind, &j.Payload, &j.Status, &j.Attempts, &j.MaxAttempts,
		&j.ScheduledAt, &lockedAt, &lockedBy, &lastError, &j.CreatedAt, &j.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	j.LockedAt = lockedAt
	if lockedBy != nil {
		j.LockedBy = *lockedBy
	}
	if lastError != nil {
		j.LastError = *lastError
	}
	return &j, nil
}

func isNoRows(err error) bool {
	return err != nil && err.Error() == "no rows in result set"
}
