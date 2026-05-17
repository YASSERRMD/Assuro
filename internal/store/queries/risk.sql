-- name: CreateRiskAssessment :one
INSERT INTO risk_assessments (asset_id, tier, score, factors, ruleset_version, computed_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, asset_id, tier, score, factors, ruleset_version, computed_at, computed_by;

-- name: GetLatestRiskAssessment :one
SELECT id, asset_id, tier, score, factors, ruleset_version, computed_at, computed_by
FROM risk_assessments
WHERE asset_id = $1
ORDER BY computed_at DESC
LIMIT 1;

-- name: ListRiskAssessmentsByAsset :many
SELECT id, asset_id, tier, score, factors, ruleset_version, computed_at, computed_by
FROM risk_assessments
WHERE asset_id = $1
ORDER BY computed_at DESC;
