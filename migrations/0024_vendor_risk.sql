-- +goose Up

CREATE TABLE IF NOT EXISTS vendors (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            text NOT NULL,
    description     text,
    vendor_type     text NOT NULL DEFAULT 'ai_provider'
                        CHECK (vendor_type IN ('ai_provider','data_provider','platform','tools','custom')),
    website         text,
    contact_email   text,
    risk_tier       text NOT NULL DEFAULT 'unknown'
                        CHECK (risk_tier IN ('unknown','low','medium','high','critical')),
    status          text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive','under_review')),
    metadata        jsonb NOT NULL DEFAULT '{}',
    created_by      uuid REFERENCES users(id),
    created_at      timestamp with time zone NOT NULL DEFAULT now(),
    updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors (org_id, risk_tier, status);

CREATE TABLE IF NOT EXISTS vendor_assessments (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id         uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assessment_date   date NOT NULL DEFAULT CURRENT_DATE,
    risk_score        int CHECK (risk_score BETWEEN 0 AND 100),
    risk_tier         text NOT NULL DEFAULT 'unknown'
                          CHECK (risk_tier IN ('unknown','low','medium','high','critical')),
    findings          jsonb NOT NULL DEFAULT '{}',
    recommendations   text,
    next_review_date  date,
    assessed_by       uuid REFERENCES users(id),
    created_at        timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_assessments ON vendor_assessments (vendor_id, assessment_date DESC);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER vendors_set_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS vendors_set_updated_at ON vendors;
DROP TABLE IF EXISTS vendor_assessments;
DROP TABLE IF EXISTS vendors;
