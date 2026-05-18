-- +goose Up

-- Remove the restrictive asset_type check so future modules (e.g. EHS) can add types.
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_asset_type_check;

-- Add updated_at auto-update function and triggers for core mutable tables.
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
-- +goose StatementEnd

CREATE OR REPLACE TRIGGER assets_set_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER ai_system_details_set_updated_at
    BEFORE UPDATE ON ai_system_details
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add risk_tier column to ai_system_details for fast list queries.
ALTER TABLE ai_system_details
    ADD COLUMN IF NOT EXISTS latest_risk_tier text DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS latest_risk_score integer DEFAULT 0;

-- Index to support filtering AI systems by risk tier.
CREATE INDEX IF NOT EXISTS idx_ai_system_details_risk_tier
    ON ai_system_details(latest_risk_tier);

-- +goose Down
ALTER TABLE assets
    ADD CONSTRAINT assets_asset_type_check CHECK (asset_type IN ('ai_system'));

DROP TRIGGER IF EXISTS assets_set_updated_at ON assets;
DROP TRIGGER IF EXISTS ai_system_details_set_updated_at ON ai_system_details;
DROP FUNCTION IF EXISTS set_updated_at;

DROP INDEX IF EXISTS idx_ai_system_details_risk_tier;
ALTER TABLE ai_system_details
    DROP COLUMN IF EXISTS latest_risk_tier,
    DROP COLUMN IF EXISTS latest_risk_score;
