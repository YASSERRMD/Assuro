-- name: CreateAuditLog :one
INSERT INTO audit_log (org_id, actor_user_id, action, target_type, target_id, payload)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, org_id, actor_user_id, action, target_type, target_id, payload, created_at;

-- name: ListAuditLogsByOrg :many
SELECT id, org_id, actor_user_id, action, target_type, target_id, payload, created_at
FROM audit_log
WHERE org_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListAuditLogsByTarget :many
SELECT id, org_id, actor_user_id, action, target_type, target_id, payload, created_at
FROM audit_log
WHERE org_id = $1 AND target_type = $2 AND target_id = $3
ORDER BY created_at DESC;
