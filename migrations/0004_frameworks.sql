-- +goose Up
CREATE TABLE frameworks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key text NOT NULL UNIQUE,
    name text NOT NULL,
    version text NOT NULL DEFAULT '1.0',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE framework_requirements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id uuid NOT NULL REFERENCES frameworks(id),
    ref_code text NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE controls (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES organizations(id),
    key text NOT NULL,
    title text NOT NULL,
    description text,
    domain text NOT NULL DEFAULT 'ai_governance',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_controls_key_org ON controls(key, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'));

CREATE TABLE control_requirement_map (
    control_id uuid NOT NULL REFERENCES controls(id),
    requirement_id uuid NOT NULL REFERENCES framework_requirements(id),
    PRIMARY KEY (control_id, requirement_id)
);

CREATE TABLE asset_control_status (
    asset_id uuid NOT NULL REFERENCES assets(id),
    control_id uuid NOT NULL REFERENCES controls(id),
    status text NOT NULL DEFAULT 'not_started',
    justification text,
    updated_by uuid REFERENCES users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (asset_id, control_id)
);

-- +goose Down
DROP TABLE IF EXISTS asset_control_status;
DROP TABLE IF EXISTS control_requirement_map;
DROP TABLE IF EXISTS controls;
DROP TABLE IF EXISTS framework_requirements;
DROP TABLE IF EXISTS frameworks;
