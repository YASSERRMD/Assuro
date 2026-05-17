-- name: CreateAsset :one
INSERT INTO assets (org_id, asset_type, name, description, owner_user_id, metadata, lifecycle_status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, org_id, asset_type, name, description, owner_user_id, metadata, lifecycle_status, created_at, updated_at;

-- name: GetAssetByID :one
SELECT id, org_id, asset_type, name, description, owner_user_id, metadata, lifecycle_status, created_at, updated_at
FROM assets
WHERE id = $1;

-- name: GetAssetByIDAndOrg :one
SELECT id, org_id, asset_type, name, description, owner_user_id, metadata, lifecycle_status, created_at, updated_at
FROM assets
WHERE id = $1 AND org_id = $2;

-- name: ListAssets :many
SELECT id, org_id, asset_type, name, description, owner_user_id, metadata, lifecycle_status, created_at, updated_at
FROM assets
WHERE org_id = $1
  AND ($2::text IS NULL OR asset_type = $2)
  AND ($3::text IS NULL OR lifecycle_status = $3)
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;

-- name: UpdateAsset :one
UPDATE assets
SET name = $1, description = $2, owner_user_id = $3, metadata = $4, lifecycle_status = $5, updated_at = now()
WHERE id = $6 AND org_id = $7
RETURNING id, org_id, asset_type, name, description, owner_user_id, metadata, lifecycle_status, created_at, updated_at;

-- name: ArchiveAsset :one
UPDATE assets
SET lifecycle_status = 'archived', updated_at = now()
WHERE id = $1 AND org_id = $2
RETURNING id, org_id, asset_type, name, description, owner_user_id, metadata, lifecycle_status, created_at, updated_at;
