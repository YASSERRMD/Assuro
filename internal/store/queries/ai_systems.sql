-- name: CreateAISystemDetails :one
INSERT INTO ai_system_details (asset_id, provider, model_family, modality, deployment_context, data_sources, intended_purpose, affected_populations, eu_market_exposure, is_agentic, autonomy_level, lifecycle_stage)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING id, asset_id, provider, model_family, modality, deployment_context, data_sources, intended_purpose, affected_populations, eu_market_exposure, is_agentic, autonomy_level, lifecycle_stage, created_at, updated_at;

-- name: GetAISystemDetailsByAssetID :one
SELECT id, asset_id, provider, model_family, modality, deployment_context, data_sources, intended_purpose, affected_populations, eu_market_exposure, is_agentic, autonomy_level, lifecycle_stage, created_at, updated_at
FROM ai_system_details
WHERE asset_id = $1;

-- name: UpdateAISystemDetails :one
UPDATE ai_system_details
SET provider = $1, model_family = $2, modality = $3, deployment_context = $4, data_sources = $5, intended_purpose = $6, affected_populations = $7, eu_market_exposure = $8, is_agentic = $9, autonomy_level = $10, lifecycle_stage = $11, updated_at = now()
WHERE asset_id = $12
RETURNING id, asset_id, provider, model_family, modality, deployment_context, data_sources, intended_purpose, affected_populations, eu_market_exposure, is_agentic, autonomy_level, lifecycle_stage, created_at, updated_at;

-- name: ListAISystems :many
SELECT a.id, a.org_id, a.asset_type, a.name, a.description, a.owner_user_id, a.metadata, a.lifecycle_status, a.created_at, a.updated_at,
       d.provider, d.model_family, d.modality, d.deployment_context, d.data_sources, d.intended_purpose, d.affected_populations, d.eu_market_exposure, d.is_agentic, d.autonomy_level, d.lifecycle_stage
FROM assets a
JOIN ai_system_details d ON d.asset_id = a.id
WHERE a.org_id = $1
  AND (sqlc.narg('lifecycle_status')::text IS NULL OR a.lifecycle_status = sqlc.narg('lifecycle_status')::text)
ORDER BY a.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');
