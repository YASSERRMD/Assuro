-- +goose Up

-- Track versions of each framework requirement so changes can be detected
CREATE TABLE IF NOT EXISTS framework_requirement_versions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id uuid NOT NULL REFERENCES framework_requirements(id) ON DELETE CASCADE,
    version_num    integer NOT NULL,
    title          text NOT NULL,
    description    text,
    article_ref    text,
    obligation_level text NOT NULL DEFAULT 'mandatory',
    change_summary text,
    effective_date date,
    created_at     timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (requirement_id, version_num)
);

-- Regulatory change feed entries
CREATE TABLE IF NOT EXISTS regulatory_changes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_key   text NOT NULL,
    ref_code        text NOT NULL,
    change_kind     text NOT NULL CHECK (change_kind IN ('added','amended','removed','clarified')),
    summary         text NOT NULL,
    effective_date  date,
    source_url      text,
    published_at    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_changes_fw
    ON regulatory_changes (framework_key, published_at DESC);

-- Impact assessments linking a change to affected AI systems
CREATE TABLE IF NOT EXISTS regulatory_impact_assessments (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    change_id      uuid NOT NULL REFERENCES regulatory_changes(id) ON DELETE CASCADE,
    asset_id       uuid REFERENCES assets(id) ON DELETE SET NULL,
    impact_level   text NOT NULL DEFAULT 'medium'
                       CHECK (impact_level IN ('none','low','medium','high','critical')),
    notes          text,
    status         text NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','in_review','actioned','dismissed')),
    created_at     timestamp with time zone NOT NULL DEFAULT now(),
    updated_at     timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (org_id, change_id, COALESCE(asset_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

CREATE INDEX IF NOT EXISTS idx_impact_assessments_org
    ON regulatory_impact_assessments (org_id, status, created_at DESC);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER regulatory_impact_set_updated_at
    BEFORE UPDATE ON regulatory_impact_assessments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS regulatory_impact_set_updated_at ON regulatory_impact_assessments;
DROP TABLE IF EXISTS regulatory_impact_assessments;
DROP TABLE IF EXISTS regulatory_changes;
DROP TABLE IF EXISTS framework_requirement_versions;
