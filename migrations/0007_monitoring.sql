-- +goose Up
CREATE TABLE monitoring_signals (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    asset_id uuid NOT NULL REFERENCES assets(id),
    signal_type text NOT NULL CHECK (signal_type IN ('drift','performance','bias','policy_violation','other')),
    severity text NOT NULL DEFAULT 'low',
    value jsonb DEFAULT '{}',
    detected_at timestamptz NOT NULL DEFAULT now(),
    source text
);

CREATE TABLE incidents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    asset_id uuid REFERENCES assets(id),
    title text NOT NULL,
    description text,
    severity text NOT NULL DEFAULT 'low',
    status text NOT NULL DEFAULT 'open',
    raised_by uuid REFERENCES users(id),
    raised_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz
);

CREATE TABLE corrective_actions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id uuid NOT NULL REFERENCES incidents(id),
    description text NOT NULL,
    owner_user_id uuid REFERENCES users(id),
    due_date timestamptz,
    status text NOT NULL DEFAULT 'open',
    completed_at timestamptz
);

CREATE INDEX idx_monitoring_signals_org_asset ON monitoring_signals(org_id, asset_id);
CREATE INDEX idx_incidents_org ON incidents(org_id);
CREATE INDEX idx_corrective_actions_incident ON corrective_actions(incident_id);

-- +goose Down
DROP TABLE IF EXISTS corrective_actions;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS monitoring_signals;
