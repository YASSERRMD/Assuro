-- +goose Up

CREATE TABLE IF NOT EXISTS discovery_inbox (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    connector_id   uuid REFERENCES connectors(id) ON DELETE SET NULL,
    source_type    text NOT NULL,
    source_ref     text NOT NULL,
    name           text NOT NULL,
    model_type     text,
    raw_data       jsonb NOT NULL DEFAULT '{}',
    dedup_key      text NOT NULL,
    state          text NOT NULL DEFAULT 'new'
                       CHECK (state IN ('new','reviewed','merged','dismissed')),
    asset_id       uuid REFERENCES assets(id) ON DELETE SET NULL,
    reviewed_by    uuid REFERENCES users(id),
    reviewed_at    timestamp with time zone,
    created_at     timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (org_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_discovery_inbox_org ON discovery_inbox (org_id, state);
CREATE INDEX IF NOT EXISTS idx_discovery_inbox_dedup ON discovery_inbox (org_id, dedup_key);

-- +goose Down
DROP TABLE IF EXISTS discovery_inbox;
