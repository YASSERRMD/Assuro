-- name: CreateOrganization :one
INSERT INTO organizations (name, slug)
VALUES ($1, $2)
RETURNING id, name, slug, created_at;

-- name: GetOrganizationByID :one
SELECT id, name, slug, created_at
FROM organizations
WHERE id = $1;

-- name: GetOrganizationBySlug :one
SELECT id, name, slug, created_at
FROM organizations
WHERE slug = $1;

-- name: ListOrganizations :many
SELECT id, name, slug, created_at
FROM organizations
ORDER BY created_at DESC;
