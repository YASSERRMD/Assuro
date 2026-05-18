-- +goose Up

CREATE TABLE IF NOT EXISTS jobs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind         text NOT NULL,
    payload      jsonb NOT NULL DEFAULT '{}',
    status       text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'dead')),
    attempts     integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    scheduled_at timestamp with time zone NOT NULL DEFAULT now(),
    locked_at    timestamp with time zone,
    locked_by    text,
    last_error   text,
    created_at   timestamp with time zone NOT NULL DEFAULT now(),
    updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

-- Efficient dequeue: only pending jobs scheduled now or earlier
CREATE INDEX IF NOT EXISTS idx_jobs_dequeue
    ON jobs (scheduled_at ASC)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_jobs_kind_status ON jobs (kind, status);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER jobs_set_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS jobs_set_updated_at ON jobs;
DROP INDEX IF EXISTS idx_jobs_dequeue;
DROP INDEX IF EXISTS idx_jobs_kind_status;
DROP TABLE IF EXISTS jobs;
