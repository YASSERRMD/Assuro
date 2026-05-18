-- +goose Up

CREATE TABLE IF NOT EXISTS agents (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id     uuid REFERENCES assets(id) ON DELETE SET NULL,
    name         text NOT NULL,
    description  text,
    agent_type   text NOT NULL DEFAULT 'autonomous'
                     CHECK (agent_type IN ('autonomous','assistant','pipeline','custom')),
    status       text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','inactive','suspended')),
    identity_ref text,
    metadata     jsonb NOT NULL DEFAULT '{}',
    created_by   uuid REFERENCES users(id),
    created_at   timestamp with time zone NOT NULL DEFAULT now(),
    updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents (org_id, status);
CREATE INDEX IF NOT EXISTS idx_agents_asset ON agents (asset_id) WHERE asset_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS agent_permissions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id   uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    scope      text NOT NULL,
    resource   text NOT NULL DEFAULT '*',
    granted_by uuid REFERENCES users(id),
    granted_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    UNIQUE (agent_id, scope, resource)
);

CREATE INDEX IF NOT EXISTS idx_agent_permissions_agent ON agent_permissions (agent_id);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER agents_set_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS agents_set_updated_at ON agents;
DROP TABLE IF EXISTS agent_permissions;
DROP TABLE IF EXISTS agents;
