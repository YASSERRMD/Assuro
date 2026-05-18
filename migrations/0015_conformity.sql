-- +goose Up

CREATE TABLE IF NOT EXISTS conformity_assessments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id    uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    kind        text NOT NULL CHECK (kind IN ('eu_ai_act','fria','dpia','custom')),
    title       text NOT NULL,
    status      text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','in_progress','complete','archived')),
    findings    jsonb NOT NULL DEFAULT '{}',
    conclusion  text,
    signed_by   uuid REFERENCES users(id),
    signed_at   timestamp with time zone,
    created_by  uuid REFERENCES users(id),
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conformity_org_asset
    ON conformity_assessments (org_id, asset_id, kind);

CREATE TABLE IF NOT EXISTS conformity_declarations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id          uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    assessment_id     uuid REFERENCES conformity_assessments(id),
    declaration_type  text NOT NULL DEFAULT 'eu_doc',
    content           jsonb NOT NULL DEFAULT '{}',
    issued_at         timestamp with time zone NOT NULL DEFAULT now(),
    valid_until       date,
    created_at        timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_declarations_org ON conformity_declarations (org_id, asset_id);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER conformity_set_updated_at
    BEFORE UPDATE ON conformity_assessments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS conformity_set_updated_at ON conformity_assessments;
DROP TABLE IF EXISTS conformity_declarations;
DROP TABLE IF EXISTS conformity_assessments;
