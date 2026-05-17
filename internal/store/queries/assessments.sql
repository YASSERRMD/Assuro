-- name: CreateAssessment :one
INSERT INTO assessments (org_id, asset_id, template_id, status, started_by)
VALUES ($1, $2, $3, 'draft', $4)
RETURNING id, org_id, asset_id, template_id, status, started_by, completed_at, created_at;

-- name: GetAssessmentByID :one
SELECT id, org_id, asset_id, template_id, status, started_by, completed_at, created_at
FROM assessments
WHERE id = $1;

-- name: GetAssessmentByIDAndOrg :one
SELECT id, org_id, asset_id, template_id, status, started_by, completed_at, created_at
FROM assessments
WHERE id = $1 AND org_id = $2;

-- name: ListAssessmentsByOrg :many
SELECT id, org_id, asset_id, template_id, status, started_by, completed_at, created_at
FROM assessments
WHERE org_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListAssessmentsByAsset :many
SELECT id, org_id, asset_id, template_id, status, started_by, completed_at, created_at
FROM assessments
WHERE asset_id = $1
ORDER BY created_at DESC;

-- name: SaveResponse :one
INSERT INTO assessment_responses (assessment_id, question_id, answer, answered_by, note)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (assessment_id, question_id)
DO UPDATE SET answer = $3, answered_by = $4, answered_at = now(), note = $5
RETURNING id, assessment_id, question_id, answer, answered_by, answered_at, note;

-- name: GetResponsesByAssessment :many
SELECT id, assessment_id, question_id, answer, answered_by, answered_at, note
FROM assessment_responses
WHERE assessment_id = $1;

-- name: CountResponsesByAssessment :one
SELECT COUNT(*) FROM assessment_responses WHERE assessment_id = $1;

-- name: CountRequiredQuestionsByTemplate :one
SELECT COUNT(*) FROM template_questions WHERE template_id = $1 AND required = true;

-- name: GetQuestionsByTemplate :many
SELECT id, template_id, order_index, prompt, help_text, answer_type, options, control_id, weight, required
FROM template_questions
WHERE template_id = $1
ORDER BY order_index;

-- name: CompleteAssessment :one
UPDATE assessments SET status = 'completed', completed_at = now()
WHERE id = $1 AND org_id = $2
RETURNING id, org_id, asset_id, template_id, status, started_by, completed_at, created_at;

-- name: GetTemplateByKey :one
SELECT id, org_id, key, title, description, domain, framework_id, created_at
FROM assessment_templates
WHERE key = $1 AND org_id IS NULL;
