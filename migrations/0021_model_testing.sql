-- +goose Up

CREATE TABLE IF NOT EXISTS test_suites (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id    uuid REFERENCES assets(id) ON DELETE SET NULL,
    name        text NOT NULL,
    description text,
    suite_type  text NOT NULL DEFAULT 'functional'
                    CHECK (suite_type IN ('functional','bias','robustness','security','custom')),
    status      text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived')),
    created_by  uuid REFERENCES users(id),
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_suites_org ON test_suites (org_id, asset_id);

CREATE TABLE IF NOT EXISTS test_cases (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_id    uuid NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name        text NOT NULL,
    description text,
    input       jsonb NOT NULL DEFAULT '{}',
    expected    jsonb NOT NULL DEFAULT '{}',
    tags        text[] NOT NULL DEFAULT '{}',
    created_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_suite ON test_cases (suite_id);

CREATE TABLE IF NOT EXISTS test_runs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_id     uuid NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status       text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','running','passed','failed','error')),
    total        int NOT NULL DEFAULT 0,
    passed       int NOT NULL DEFAULT 0,
    failed       int NOT NULL DEFAULT 0,
    score        numeric(5,2),
    triggered_by uuid REFERENCES users(id),
    started_at   timestamp with time zone NOT NULL DEFAULT now(),
    finished_at  timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_test_runs_suite ON test_runs (suite_id, started_at DESC);

CREATE TABLE IF NOT EXISTS test_results (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id      uuid NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    case_id     uuid NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    outcome     text NOT NULL DEFAULT 'pending'
                    CHECK (outcome IN ('pending','pass','fail','error','skip')),
    actual      jsonb NOT NULL DEFAULT '{}',
    score       numeric(5,2),
    error_msg   text,
    duration_ms int,
    created_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_results_run ON test_results (run_id);

-- +goose StatementBegin
CREATE OR REPLACE TRIGGER test_suites_set_updated_at
    BEFORE UPDATE ON test_suites
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER IF EXISTS test_suites_set_updated_at ON test_suites;
DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS test_runs;
DROP TABLE IF EXISTS test_cases;
DROP TABLE IF EXISTS test_suites;
