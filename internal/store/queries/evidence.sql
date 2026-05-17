-- name: CreateEvidence :one
INSERT INTO evidence (org_id, title, description, file_key, content_hash, mime_type, size_bytes, uploaded_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, org_id, title, description, file_key, content_hash, mime_type, size_bytes, uploaded_by, created_at;

-- name: GetEvidenceByID :one
SELECT id, org_id, title, description, file_key, content_hash, mime_type, size_bytes, uploaded_by, created_at
FROM evidence
WHERE id = $1;

-- name: ListEvidenceByOrg :many
SELECT id, org_id, title, description, file_key, content_hash, mime_type, size_bytes, uploaded_by, created_at
FROM evidence
WHERE org_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: LinkEvidence :exec
INSERT INTO evidence_links (evidence_id, target_type, target_id)
VALUES ($1, $2, $3);

-- name: ListEvidenceByTarget :many
SELECT e.id, e.org_id, e.title, e.description, e.file_key, e.content_hash, e.mime_type, e.size_bytes, e.uploaded_by, e.created_at
FROM evidence e
JOIN evidence_links l ON l.evidence_id = e.id
WHERE l.target_type = $1 AND l.target_id = $2;
