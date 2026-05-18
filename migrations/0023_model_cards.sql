-- +goose Up

CREATE TABLE IF NOT EXISTS model_cards (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id          uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    version           text NOT NULL DEFAULT '1.0',
    status            text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','published','archived')),
    model_details     jsonb NOT NULL DEFAULT '{}',
    intended_use      jsonb NOT NULL DEFAULT '{}',
    limitations       jsonb NOT NULL DEFAULT '{}',
    ethical_concerns  jsonb NOT NULL DEFAULT '{}',
    performance       jsonb NOT NULL DEFAULT '{}',
    training_data     jsonb NOT NULL DEFAULT '{}',
    published_at      timestamp with time zone,
    created_by        uuid REFERENCES users(id),
    created_at        timestamp with time zone NOT NULL DEFAULT now(),
    updated_at        timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (asset_id, version)
);

CREATE INDEX IF NOT EXISTS idx_model_cards_org ON model_cards (org_id, status);
CREATE INDEX IF NOT EXISTS idx_model_cards_asset ON model_cards (asset_id);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER model_cards_set_updated_at
    BEFORE UPDATE ON model_cards
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS model_cards_set_updated_at ON model_cards;
DROP TABLE IF EXISTS model_cards;
