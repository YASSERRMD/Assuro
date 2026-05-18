-- +goose Up

CREATE TABLE IF NOT EXISTS connectors (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name           text NOT NULL,
    connector_type text NOT NULL,
    status         text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','inactive','error')),
    config         jsonb NOT NULL DEFAULT '{}',
    credential_ref text,
    last_synced_at timestamp with time zone,
    last_error     text,
    created_by     uuid REFERENCES users(id),
    created_at     timestamp with time zone NOT NULL DEFAULT now(),
    updated_at     timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connectors_org ON connectors (org_id, connector_type, status);

CREATE TABLE IF NOT EXISTS connector_sync_runs (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    connector_id   uuid NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
    org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    status         text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','running','success','failed')),
    records_synced int NOT NULL DEFAULT 0,
    error_message  text,
    started_at     timestamp with time zone NOT NULL DEFAULT now(),
    finished_at    timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_connector ON connector_sync_runs (connector_id, started_at DESC);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER connectors_set_updated_at
    BEFORE UPDATE ON connectors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS connectors_set_updated_at ON connectors;
DROP TABLE IF EXISTS connector_sync_runs;
DROP TABLE IF EXISTS connectors;
