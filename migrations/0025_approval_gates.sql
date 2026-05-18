-- +goose Up

CREATE TABLE IF NOT EXISTS approval_workflows (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name            text NOT NULL,
    description     text,
    resource_type   text NOT NULL,
    min_approvals   int NOT NULL DEFAULT 1,
    enabled         boolean NOT NULL DEFAULT true,
    created_by      uuid REFERENCES users(id),
    created_at      timestamp with time zone NOT NULL DEFAULT now(),
    updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_org ON approval_workflows (org_id, resource_type, enabled);

CREATE TABLE IF NOT EXISTS approval_requests (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     uuid NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    org_id          uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    resource_type   text NOT NULL,
    resource_id     text NOT NULL,
    title           text NOT NULL,
    description     text,
    payload         jsonb NOT NULL DEFAULT '{}',
    status          text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','cancelled')),
    required_count  int NOT NULL DEFAULT 1,
    approved_count  int NOT NULL DEFAULT 0,
    requested_by    uuid NOT NULL REFERENCES users(id),
    decided_at      timestamp with time zone,
    created_at      timestamp with time zone NOT NULL DEFAULT now(),
    updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_org ON approval_requests (org_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_resource ON approval_requests (org_id, resource_type, resource_id);

CREATE TABLE IF NOT EXISTS approval_decisions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  uuid NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES users(id),
    decision    text NOT NULL CHECK (decision IN ('approve','reject')),
    comment     text,
    decided_at  timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_decisions_request ON approval_decisions (request_id);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER approval_requests_set_updated_at
    BEFORE UPDATE ON approval_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER approval_workflows_set_updated_at
    BEFORE UPDATE ON approval_workflows
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS approval_requests_set_updated_at ON approval_requests;
DROP TRIGGER IF EXISTS approval_workflows_set_updated_at ON approval_workflows;
DROP TABLE IF EXISTS approval_decisions;
DROP TABLE IF EXISTS approval_requests;
DROP TABLE IF EXISTS approval_workflows;
