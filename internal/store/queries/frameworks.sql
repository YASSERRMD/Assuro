-- name: ListFrameworks :many
SELECT id, key, name, version, created_at
FROM frameworks
ORDER BY key;

-- name: ListControls :many
SELECT id, org_id, key, title, description, domain, created_at
FROM controls
WHERE ($1::uuid IS NULL OR org_id IS NULL OR org_id = $1)
ORDER BY key;

-- name: SetControlStatus :one
INSERT INTO asset_control_status (asset_id, control_id, status, justification, updated_by, updated_at)
VALUES ($1, $2, $3, $4, $5, now())
ON CONFLICT (asset_id, control_id)
DO UPDATE SET status = $3, justification = $4, updated_by = $5, updated_at = now()
RETURNING asset_id, control_id, status, justification, updated_by, updated_at;

-- name: GetControlStatus :one
SELECT asset_id, control_id, status, justification, updated_by, updated_at
FROM asset_control_status
WHERE asset_id = $1 AND control_id = $2;

-- name: ListControlStatusByAsset :many
SELECT asset_id, control_id, status, justification, updated_by, updated_at
FROM asset_control_status
WHERE asset_id = $1;

-- name: GetRequirementsByFramework :many
SELECT id, framework_id, ref_code, title, description
FROM framework_requirements
WHERE framework_id = $1
ORDER BY ref_code;

-- name: GetControlsForRequirement :many
SELECT c.id, c.org_id, c.key, c.title, c.description, c.domain
FROM controls c
JOIN control_requirement_map m ON m.control_id = c.id
WHERE m.requirement_id = $1;

-- name: GetControlStatusWithDetails :many
SELECT acs.asset_id, acs.control_id, acs.status, acs.justification, acs.updated_by, acs.updated_at,
       c.key AS control_key, c.title AS control_title, c.domain AS control_domain
FROM asset_control_status acs
JOIN controls c ON c.id = acs.control_id
WHERE acs.asset_id = $1
ORDER BY c.key;
