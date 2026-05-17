-- +goose Up
CREATE TABLE risk_assessments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id uuid NOT NULL REFERENCES assets(id),
    tier text NOT NULL,
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    factors jsonb DEFAULT '[]',
    ruleset_version text NOT NULL,
    computed_at timestamptz NOT NULL DEFAULT now(),
    computed_by text NOT NULL DEFAULT 'system'
);

CREATE INDEX idx_risk_assessments_asset_id ON risk_assessments(asset_id);
CREATE INDEX idx_risk_assessments_computed_at ON risk_assessments(computed_at DESC);

-- +goose Down
DROP INDEX IF EXISTS idx_risk_assessments_computed_at;
DROP INDEX IF EXISTS idx_risk_assessments_asset_id;
DROP TABLE IF EXISTS risk_assessments;
