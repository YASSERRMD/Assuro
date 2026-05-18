-- +goose Up

CREATE TABLE IF NOT EXISTS policies (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name         text NOT NULL,
    description  text,
    policy_type  text NOT NULL DEFAULT 'governance'
                     CHECK (policy_type IN ('governance','acceptable_use','data_handling','security','custom')),
    status       text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','in_review','approved','archived')),
    version      text NOT NULL DEFAULT '1.0',
    content      text NOT NULL DEFAULT '',
    owner_id     uuid REFERENCES users(id),
    approved_by  uuid REFERENCES users(id),
    approved_at  timestamp with time zone,
    review_due   date,
    created_by   uuid REFERENCES users(id),
    created_at   timestamp with time zone NOT NULL DEFAULT now(),
    updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policies_org ON policies (org_id, status);

CREATE TABLE IF NOT EXISTS policy_attestations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id   uuid NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES users(id),
    attested_at timestamp with time zone NOT NULL DEFAULT now(),
    version     text NOT NULL,
    notes       text
);

CREATE INDEX IF NOT EXISTS idx_attestations_policy ON policy_attestations (policy_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_unique ON policy_attestations (policy_id, user_id, version);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER policies_set_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS policies_set_updated_at ON policies;
DROP TABLE IF EXISTS policy_attestations;
DROP TABLE IF EXISTS policies;
