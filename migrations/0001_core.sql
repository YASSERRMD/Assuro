-- +goose Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'viewer',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    asset_type text NOT NULL CHECK (asset_type IN ('ai_system')),
    name text NOT NULL,
    description text,
    owner_user_id uuid REFERENCES users(id),
    metadata jsonb DEFAULT '{}',
    lifecycle_status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    actor_user_id uuid REFERENCES users(id),
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    payload jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_org_id ON assets(org_id);
CREATE INDEX idx_assets_org_type ON assets(org_id, asset_type);
CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_users_org_id ON users(org_id);

-- +goose Down
DROP INDEX IF EXISTS idx_users_org_id;
DROP INDEX IF EXISTS idx_audit_log_org_id;
DROP INDEX IF EXISTS idx_assets_org_type;
DROP INDEX IF EXISTS idx_assets_org_id;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;
