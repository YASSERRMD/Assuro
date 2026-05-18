-- +goose Up

CREATE TABLE IF NOT EXISTS secrets (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    scope      text NOT NULL,
    ref        text NOT NULL,
    ciphertext bytea NOT NULL,
    key_id     text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (org_id, scope, ref)
);

CREATE INDEX IF NOT EXISTS idx_secrets_org_scope ON secrets (org_id, scope);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER secrets_set_updated_at
    BEFORE UPDATE ON secrets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS secrets_set_updated_at ON secrets;
DROP INDEX IF EXISTS idx_secrets_org_scope;
DROP TABLE IF EXISTS secrets;
