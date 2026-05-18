package service

import (
	"context"
	"fmt"
	"time"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// OrgRole is a custom role scoped to an organisation.
type OrgRole struct {
	ID          string    `json:"id"`
	OrgID       string    `json:"org_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// RolePermission is a permission string assigned to a role.
type RolePermission struct {
	RoleID     string    `json:"role_id"`
	Permission string    `json:"permission"`
	GrantedAt  time.Time `json:"granted_at"`
}

// UserRole links a user to a custom role within an org.
type UserRole struct {
	UserID    string     `json:"user_id"`
	OrgID     string     `json:"org_id"`
	RoleID    string     `json:"role_id"`
	RoleName  string     `json:"role_name"`
	GrantedBy *string    `json:"granted_by,omitempty"`
	GrantedAt time.Time  `json:"granted_at"`
}

// RBACService manages custom roles and fine-grained permissions.
type RBACService struct {
	db *store.DB
}

// NewRBACService creates an RBACService.
func NewRBACService(db *store.DB) *RBACService {
	return &RBACService{db: db}
}

// KnownPermissions returns the canonical permission strings for the system.
func KnownPermissions() []string {
	return []string{
		"assets:read", "assets:write", "assets:delete",
		"risks:read", "risks:write",
		"incidents:read", "incidents:write",
		"policies:read", "policies:write", "policies:approve",
		"vendors:read", "vendors:write",
		"agents:read", "agents:write", "agents:kill",
		"tasks:read", "tasks:write",
		"audit:read", "audit:export",
		"analytics:read",
		"approvals:read", "approvals:decide",
		"users:read", "users:invite", "users:manage",
		"connectors:read", "connectors:write",
		"model_cards:read", "model_cards:write",
		"shadow_ai:read", "shadow_ai:manage",
	}
}

// CreateRole creates a new custom role for an org.
func (s *RBACService) CreateRole(ctx context.Context, orgID, name, description string) (*OrgRole, error) {
	var r OrgRole
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO org_roles (org_id, name, description)
		 VALUES ($1, $2, $3)
		 RETURNING id::text, org_id::text, name, description, created_at`,
		orgID, name, description,
	).Scan(&r.ID, &r.OrgID, &r.Name, &r.Description, &r.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create role: %w", err)
	}
	return &r, nil
}

// ListRoles returns all custom roles for an org.
func (s *RBACService) ListRoles(ctx context.Context, orgID string) ([]OrgRole, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id::text, org_id::text, name, description, created_at
		 FROM org_roles WHERE org_id=$1 ORDER BY name`,
		orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list roles: %w", err)
	}
	defer rows.Close()
	var out []OrgRole
	for rows.Next() {
		var r OrgRole
		if err := rows.Scan(&r.ID, &r.OrgID, &r.Name, &r.Description, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if out == nil {
		out = []OrgRole{}
	}
	return out, rows.Err()
}

// DeleteRole removes a custom role (cascades to permissions and user assignments).
func (s *RBACService) DeleteRole(ctx context.Context, roleID, orgID string) error {
	tag, err := s.db.Pool().Exec(ctx,
		`DELETE FROM org_roles WHERE id=$1::uuid AND org_id=$2::uuid`,
		roleID, orgID,
	)
	if err != nil {
		return fmt.Errorf("delete role: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("role not found")
	}
	return nil
}

// GrantPermission adds a permission to a role.
func (s *RBACService) GrantPermission(ctx context.Context, roleID, orgID, permission string) error {
	_, err := s.db.Pool().Exec(ctx,
		`INSERT INTO role_permissions (role_id, permission)
		 SELECT id, $2 FROM org_roles WHERE id=$1::uuid AND org_id=$3::uuid
		 ON CONFLICT DO NOTHING`,
		roleID, permission, orgID,
	)
	return err
}

// RevokePermission removes a permission from a role.
func (s *RBACService) RevokePermission(ctx context.Context, roleID, orgID, permission string) error {
	_, err := s.db.Pool().Exec(ctx,
		`DELETE FROM role_permissions rp
		 USING org_roles r
		 WHERE rp.role_id=r.id AND r.id=$1::uuid AND r.org_id=$2::uuid AND rp.permission=$3`,
		roleID, orgID, permission,
	)
	return err
}

// ListPermissions returns all permissions assigned to a role.
func (s *RBACService) ListPermissions(ctx context.Context, roleID, orgID string) ([]RolePermission, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT rp.role_id::text, rp.permission, rp.granted_at
		 FROM role_permissions rp
		 JOIN org_roles r ON r.id=rp.role_id
		 WHERE rp.role_id=$1::uuid AND r.org_id=$2::uuid
		 ORDER BY rp.permission`,
		roleID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list permissions: %w", err)
	}
	defer rows.Close()
	var out []RolePermission
	for rows.Next() {
		var p RolePermission
		if err := rows.Scan(&p.RoleID, &p.Permission, &p.GrantedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	if out == nil {
		out = []RolePermission{}
	}
	return out, rows.Err()
}

// AssignRole assigns a custom role to a user.
func (s *RBACService) AssignRole(ctx context.Context, userID, orgID, roleID, grantedBy string) error {
	_, err := s.db.Pool().Exec(ctx,
		`INSERT INTO user_roles (user_id, org_id, role_id, granted_by)
		 SELECT $1::uuid, $2::uuid, id, $4::uuid
		 FROM org_roles WHERE id=$3::uuid AND org_id=$2::uuid
		 ON CONFLICT DO NOTHING`,
		userID, orgID, roleID, grantedBy,
	)
	return err
}

// RemoveRole removes a custom role assignment from a user.
func (s *RBACService) RemoveRole(ctx context.Context, userID, orgID, roleID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`DELETE FROM user_roles ur
		 USING org_roles r
		 WHERE ur.role_id=r.id AND ur.user_id=$1::uuid AND r.org_id=$2::uuid AND ur.role_id=$3::uuid`,
		userID, orgID, roleID,
	)
	return err
}

// ListUserRoles returns all custom roles assigned to a user in an org.
func (s *RBACService) ListUserRoles(ctx context.Context, userID, orgID string) ([]UserRole, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT ur.user_id::text, ur.org_id::text, ur.role_id::text,
		        r.name, ur.granted_by::text, ur.granted_at
		 FROM user_roles ur
		 JOIN org_roles r ON r.id=ur.role_id
		 WHERE ur.user_id=$1::uuid AND ur.org_id=$2::uuid
		 ORDER BY r.name`,
		userID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list user roles: %w", err)
	}
	defer rows.Close()
	var out []UserRole
	for rows.Next() {
		var u UserRole
		var grantedBy *string
		if err := rows.Scan(&u.UserID, &u.OrgID, &u.RoleID, &u.RoleName, &grantedBy, &u.GrantedAt); err != nil {
			return nil, err
		}
		u.GrantedBy = grantedBy
		out = append(out, u)
	}
	if out == nil {
		out = []UserRole{}
	}
	return out, rows.Err()
}

// HasPermission checks if a user has a given permission through any of their custom roles.
func (s *RBACService) HasPermission(ctx context.Context, userID, orgID, permission string) (bool, error) {
	var exists bool
	err := s.db.Pool().QueryRow(ctx,
		`SELECT EXISTS (
		   SELECT 1 FROM user_roles ur
		   JOIN role_permissions rp ON rp.role_id=ur.role_id
		   WHERE ur.user_id=$1::uuid AND ur.org_id=$2::uuid AND rp.permission=$3
		 )`,
		userID, orgID, permission,
	).Scan(&exists)
	return exists, err
}
