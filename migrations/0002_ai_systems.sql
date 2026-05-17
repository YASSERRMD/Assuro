-- +goose Up
CREATE TABLE ai_system_details (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id uuid NOT NULL UNIQUE REFERENCES assets(id),
    provider text,
    model_family text,
    modality text,
    deployment_context text,
    data_sources jsonb DEFAULT '[]',
    intended_purpose text,
    affected_populations jsonb DEFAULT '[]',
    eu_market_exposure boolean DEFAULT false,
    is_agentic boolean DEFAULT false,
    autonomy_level integer DEFAULT 0,
    lifecycle_stage text DEFAULT 'design',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_system_details_asset_id ON ai_system_details(asset_id);

-- +goose Down
DROP INDEX IF EXISTS idx_ai_system_details_asset_id;
DROP TABLE IF EXISTS ai_system_details;
