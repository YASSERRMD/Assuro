-- +goose Up

CREATE TABLE IF NOT EXISTS ai_usage_log (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    task         text NOT NULL,
    provider     text NOT NULL,
    model        text NOT NULL,
    tokens_in    integer NOT NULL DEFAULT 0,
    tokens_out   integer NOT NULL DEFAULT 0,
    latency_ms   integer NOT NULL DEFAULT 0,
    used_fallback boolean NOT NULL DEFAULT false,
    created_at   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_org ON ai_usage_log (org_id, created_at DESC);

-- +goose Down
DROP INDEX IF EXISTS idx_ai_usage_log_org;
DROP TABLE IF EXISTS ai_usage_log;
