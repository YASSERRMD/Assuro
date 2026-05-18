-- +goose Up

CREATE TABLE IF NOT EXISTS agent_behavior_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action      text NOT NULL,
    input       jsonb NOT NULL DEFAULT '{}',
    output      jsonb NOT NULL DEFAULT '{}',
    latency_ms  int,
    status      text NOT NULL DEFAULT 'ok'
                    CHECK (status IN ('ok','error','blocked','anomaly')),
    metadata    jsonb NOT NULL DEFAULT '{}',
    occurred_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_behavior_agent ON agent_behavior_logs (agent_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_behavior_org ON agent_behavior_logs (org_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS guardrail_policies (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name         text NOT NULL,
    description  text,
    policy_type  text NOT NULL DEFAULT 'block'
                     CHECK (policy_type IN ('block','warn','log')),
    conditions   jsonb NOT NULL DEFAULT '{}',
    enabled      boolean NOT NULL DEFAULT true,
    created_by   uuid REFERENCES users(id),
    created_at   timestamp with time zone NOT NULL DEFAULT now(),
    updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guardrail_org ON guardrail_policies (org_id, enabled);

CREATE TABLE IF NOT EXISTS agent_anomalies (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id      uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    anomaly_type  text NOT NULL,
    severity      text NOT NULL DEFAULT 'medium'
                      CHECK (severity IN ('low','medium','high','critical')),
    description   text,
    log_id        uuid REFERENCES agent_behavior_logs(id),
    resolved      boolean NOT NULL DEFAULT false,
    detected_at   timestamp with time zone NOT NULL DEFAULT now(),
    resolved_at   timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_anomalies_agent ON agent_anomalies (agent_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_org_open ON agent_anomalies (org_id, resolved) WHERE NOT resolved;

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER guardrail_policies_set_updated_at
    BEFORE UPDATE ON guardrail_policies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS guardrail_policies_set_updated_at ON guardrail_policies;
DROP TABLE IF EXISTS agent_anomalies;
DROP TABLE IF EXISTS guardrail_policies;
DROP TABLE IF EXISTS agent_behavior_logs;
