-- name: CreateUser :one
INSERT INTO users (org_id, email, password_hash, role)
VALUES ($1, $2, $3, $4)
RETURNING id, org_id, email, password_hash, role, created_at;

-- name: GetUserByID :one
SELECT id, org_id, email, password_hash, role, created_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, org_id, email, password_hash, role, created_at
FROM users
WHERE email = $1;

-- name: ListUsersByOrg :many
SELECT id, org_id, email, password_hash, role, created_at
FROM users
WHERE org_id = $1
ORDER BY created_at DESC;
