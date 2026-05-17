-- name: CreateMonitoringSignal :one
INSERT INTO monitoring_signals (org_id, asset_id, signal_type, severity, value, source)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, org_id, asset_id, signal_type, severity, value, detected_at, source;

-- name: ListSignalsByAsset :many
SELECT id, org_id, asset_id, signal_type, severity, value, detected_at, source
FROM monitoring_signals
WHERE asset_id = $1
ORDER BY detected_at DESC
LIMIT $2 OFFSET $3;

-- name: CreateIncident :one
INSERT INTO incidents (org_id, asset_id, title, description, severity, raised_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, org_id, asset_id, title, description, severity, status, raised_by, raised_at, closed_at;

-- name: GetIncidentByID :one
SELECT id, org_id, asset_id, title, description, severity, status, raised_by, raised_at, closed_at
FROM incidents
WHERE id = $1;

-- name: UpdateIncidentStatus :one
UPDATE incidents SET status = $1, closed_at = CASE WHEN $1 = 'closed' THEN now() ELSE closed_at END
WHERE id = $2
RETURNING id, org_id, asset_id, title, description, severity, status, raised_by, raised_at, closed_at;

-- name: ListIncidentsByOrg :many
SELECT id, org_id, asset_id, title, description, severity, status, raised_by, raised_at, closed_at
FROM incidents
WHERE org_id = $1
ORDER BY raised_at DESC
LIMIT $2 OFFSET $3;

-- name: CreateCorrectiveAction :one
INSERT INTO corrective_actions (incident_id, description, owner_user_id, due_date)
VALUES ($1, $2, $3, $4)
RETURNING id, incident_id, description, owner_user_id, due_date, status, completed_at;

-- name: UpdateActionStatus :one
UPDATE corrective_actions SET status = $1, completed_at = CASE WHEN $1 = 'done' THEN now() ELSE completed_at END
WHERE id = $2
RETURNING id, incident_id, description, owner_user_id, due_date, status, completed_at;

-- name: ListActionsByIncident :many
SELECT id, incident_id, description, owner_user_id, due_date, status, completed_at
FROM corrective_actions
WHERE incident_id = $1
ORDER BY id;

-- name: CountOpenActionsByIncident :one
SELECT COUNT(*) FROM corrective_actions WHERE incident_id = $1 AND status != 'done';
