-- +goose Up

CREATE TABLE IF NOT EXISTS shadow_ai_findings (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    connector_id   uuid REFERENCES connectors(id) ON DELETE SET NULL,
    source_type    text NOT NULL,
    source_ref     text NOT NULL,
    name           text NOT NULL,
    model_type     text,
    risk_level     text NOT NULL DEFAULT 'unknown'
                       CHECK (risk_level IN ('unknown','low','medium','high')),
    status         text NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','reviewed','dismissed','registered')),
    metadata       jsonb NOT NULL DEFAULT '{}',
    detected_at    timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_at    timestamp with time zone,
    reviewed_by    uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_shadow_ai_org ON shadow_ai_findings (org_id, status);
CREATE INDEX IF NOT EXISTS idx_shadow_ai_src ON shadow_ai_findings (org_id, source_type, source_ref);

-- +goose Down
DROP TABLE IF EXISTS shadow_ai_findings;
