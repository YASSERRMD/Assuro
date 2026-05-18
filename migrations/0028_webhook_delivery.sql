-- +goose Up
CREATE TABLE webhook_delivery_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id  UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type   TEXT NOT NULL,
    payload      JSONB NOT NULL DEFAULT '{}',
    http_status  INT,
    error        TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_delivery_endpoint ON webhook_delivery_logs (endpoint_id, delivered_at DESC);

-- +goose Down
DROP INDEX IF EXISTS idx_webhook_delivery_endpoint;
DROP TABLE IF EXISTS webhook_delivery_logs;
