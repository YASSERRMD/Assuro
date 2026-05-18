-- +goose Up

CREATE TABLE IF NOT EXISTS notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category   text NOT NULL,
    title      text NOT NULL,
    body       text NOT NULL DEFAULT '',
    severity   text NOT NULL DEFAULT 'info'
                   CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    link_url   text,
    read_at    timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS notification_prefs (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category   text NOT NULL,
    in_app     boolean NOT NULL DEFAULT true,
    email      boolean NOT NULL DEFAULT false,
    PRIMARY KEY (user_id, category)
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    url         text NOT NULL,
    secret_ref  text NOT NULL,
    events      text[] NOT NULL DEFAULT '{}',
    enabled     boolean NOT NULL DEFAULT true,
    last_status text,
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org ON webhook_endpoints (org_id);

CREATE TABLE IF NOT EXISTS alert_rules (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name         text NOT NULL,
    trigger_kind text NOT NULL,
    condition    jsonb NOT NULL DEFAULT '{}',
    channels     text[] NOT NULL DEFAULT '{}',
    enabled      boolean NOT NULL DEFAULT true,
    created_at   timestamp with time zone NOT NULL DEFAULT now(),
    updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_org ON alert_rules (org_id, enabled);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER webhook_endpoints_set_updated_at
    BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER alert_rules_set_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS alert_rules_set_updated_at ON alert_rules;
DROP TRIGGER IF EXISTS webhook_endpoints_set_updated_at ON webhook_endpoints;
DROP TABLE IF EXISTS alert_rules;
DROP TABLE IF EXISTS webhook_endpoints;
DROP TABLE IF EXISTS notification_prefs;
DROP TABLE IF EXISTS notifications;
