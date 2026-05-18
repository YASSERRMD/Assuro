-- +goose Up

CREATE TABLE IF NOT EXISTS tasks (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title         text NOT NULL,
    description   text,
    task_type     text NOT NULL DEFAULT 'remediation'
                      CHECK (task_type IN ('remediation','review','investigation','training','custom')),
    status        text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','blocked','done','cancelled')),
    priority      text NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','critical')),
    resource_type text,
    resource_id   text,
    assignee_id   uuid REFERENCES users(id),
    due_date      date,
    completed_at  timestamp with time zone,
    created_by    uuid REFERENCES users(id),
    created_at    timestamp with time zone NOT NULL DEFAULT now(),
    updated_at    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks (org_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_resource ON tasks (org_id, resource_type, resource_id) WHERE resource_type IS NOT NULL;

CREATE TABLE IF NOT EXISTS task_comments (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES users(id),
    body       text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments (task_id);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER tasks_set_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS tasks;
