-- +goose Up
CREATE TABLE assessment_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES organizations(id),
    key text NOT NULL,
    title text NOT NULL,
    description text,
    domain text NOT NULL DEFAULT 'ai_governance',
    framework_id uuid REFERENCES frameworks(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_templates_key_org ON assessment_templates(key, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'));

CREATE TABLE template_questions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id uuid NOT NULL REFERENCES assessment_templates(id),
    order_index integer NOT NULL,
    prompt text NOT NULL,
    help_text text,
    answer_type text NOT NULL CHECK (answer_type IN ('yesno','single','multi','text','number')),
    options jsonb DEFAULT '[]',
    control_id uuid REFERENCES controls(id),
    weight integer NOT NULL DEFAULT 1,
    required boolean NOT NULL DEFAULT true
);

CREATE TABLE assessments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    asset_id uuid NOT NULL REFERENCES assets(id),
    template_id uuid NOT NULL REFERENCES assessment_templates(id),
    status text NOT NULL DEFAULT 'draft',
    started_by uuid REFERENCES users(id),
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assessment_responses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id uuid NOT NULL REFERENCES assessments(id),
    question_id uuid NOT NULL REFERENCES template_questions(id),
    answer jsonb,
    answered_by uuid REFERENCES users(id),
    answered_at timestamptz NOT NULL DEFAULT now(),
    note text
);

CREATE UNIQUE INDEX idx_responses_assessment_question ON assessment_responses(assessment_id, question_id);

-- +goose Down
DROP TABLE IF EXISTS assessment_responses;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS template_questions;
DROP TABLE IF EXISTS assessment_templates;
