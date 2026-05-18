package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// Agent represents an AI agent registered in the inventory.
type Agent struct {
	ID          string          `json:"id"`
	OrgID       string          `json:"org_id"`
	AssetID     *string         `json:"asset_id,omitempty"`
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	AgentType   string          `json:"agent_type"`
	Status      string          `json:"status"`
	IdentityRef string          `json:"identity_ref,omitempty"`
	Metadata    json.RawMessage `json:"metadata"`
	CreatedBy   *string         `json:"created_by,omitempty"`
	CreatedAt   string          `json:"created_at"`
	UpdatedAt   string          `json:"updated_at"`
}

// AgentPermission is a scoped capability granted to an agent.
type AgentPermission struct {
	ID        string  `json:"id"`
	AgentID   string  `json:"agent_id"`
	Scope     string  `json:"scope"`
	Resource  string  `json:"resource"`
	GrantedBy *string `json:"granted_by,omitempty"`
	GrantedAt string  `json:"granted_at"`
	ExpiresAt *string `json:"expires_at,omitempty"`
}

// AgentService manages the agent inventory and permissions.
type AgentService struct {
	db *store.DB
}

// NewAgentService creates an AgentService.
func NewAgentService(db *store.DB) *AgentService {
	return &AgentService{db: db}
}

// RegisterAgent inserts a new agent into the registry.
func (s *AgentService) RegisterAgent(ctx context.Context, a Agent) (*Agent, error) {
	if a.Metadata == nil {
		a.Metadata = json.RawMessage("{}")
	}
	if a.AgentType == "" {
		a.AgentType = "autonomous"
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO agents
		   (org_id, asset_id, name, description, agent_type, identity_ref, metadata, created_by)
		 VALUES ($1, NULLIF($2,'')::uuid, $3, $4, $5, NULLIF($6,''), $7, NULLIF($8,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		a.OrgID, derefStr(a.AssetID), a.Name, a.Description, a.AgentType,
		a.IdentityRef, a.Metadata, derefStr(a.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("register agent: %w", err)
	}
	a.ID = id
	a.Status = "active"
	a.CreatedAt = createdAt
	a.UpdatedAt = updatedAt
	return &a, nil
}

// ListAgents returns agents for an org, optionally filtered by status or asset.
func (s *AgentService) ListAgents(ctx context.Context, orgID, status, assetID string) ([]Agent, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, asset_id::text, name, COALESCE(description,''),
		        agent_type, status, COALESCE(identity_ref,''), metadata,
		        created_by::text, created_at::text, updated_at::text
		 FROM agents
		 WHERE org_id=$1
		   AND ($2='' OR status=$2)
		   AND ($3='' OR asset_id::text=$3)
		 ORDER BY created_at DESC`,
		orgID, status, assetID,
	)
	if err != nil {
		return nil, fmt.Errorf("list agents: %w", err)
	}
	defer rows.Close()

	var out []Agent
	for rows.Next() {
		var a Agent
		if err := rows.Scan(&a.ID, &a.OrgID, &a.AssetID, &a.Name, &a.Description,
			&a.AgentType, &a.Status, &a.IdentityRef, &a.Metadata,
			&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// GetAgent returns a single agent by id and org.
func (s *AgentService) GetAgent(ctx context.Context, id, orgID string) (*Agent, error) {
	var a Agent
	err := s.db.Pool().QueryRow(ctx,
		`SELECT id, org_id, asset_id::text, name, COALESCE(description,''),
		        agent_type, status, COALESCE(identity_ref,''), metadata,
		        created_by::text, created_at::text, updated_at::text
		 FROM agents WHERE id=$1 AND org_id=$2`,
		id, orgID,
	).Scan(&a.ID, &a.OrgID, &a.AssetID, &a.Name, &a.Description,
		&a.AgentType, &a.Status, &a.IdentityRef, &a.Metadata,
		&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get agent: %w", err)
	}
	return &a, nil
}

// UpdateAgentStatus changes the status of an agent.
func (s *AgentService) UpdateAgentStatus(ctx context.Context, id, orgID, status string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE agents SET status=$1, updated_at=now() WHERE id=$2 AND org_id=$3`,
		status, id, orgID,
	)
	return err
}

// GrantPermission grants a scoped permission to an agent.
func (s *AgentService) GrantPermission(ctx context.Context, p AgentPermission) (*AgentPermission, error) {
	if p.Resource == "" {
		p.Resource = "*"
	}
	var id, grantedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO agent_permissions (agent_id, scope, resource, granted_by, expires_at)
		 VALUES ($1, $2, $3, NULLIF($4,'')::uuid, NULLIF($5,'')::timestamptz)
		 ON CONFLICT (agent_id, scope, resource) DO UPDATE
		   SET granted_by=EXCLUDED.granted_by, granted_at=now(), expires_at=EXCLUDED.expires_at
		 RETURNING id, granted_at::text`,
		p.AgentID, p.Scope, p.Resource, derefStr(p.GrantedBy), derefStr(p.ExpiresAt),
	).Scan(&id, &grantedAt)
	if err != nil {
		return nil, fmt.Errorf("grant permission: %w", err)
	}
	p.ID = id
	p.GrantedAt = grantedAt
	return &p, nil
}

// ListPermissions returns all permissions for an agent.
func (s *AgentService) ListPermissions(ctx context.Context, agentID, orgID string) ([]AgentPermission, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT ap.id, ap.agent_id, ap.scope, ap.resource,
		        ap.granted_by::text, ap.granted_at::text, ap.expires_at::text
		 FROM agent_permissions ap
		 JOIN agents a ON a.id=ap.agent_id
		 WHERE ap.agent_id=$1 AND a.org_id=$2
		   AND (ap.expires_at IS NULL OR ap.expires_at > now())
		 ORDER BY ap.granted_at DESC`,
		agentID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list permissions: %w", err)
	}
	defer rows.Close()

	var out []AgentPermission
	for rows.Next() {
		var p AgentPermission
		if err := rows.Scan(&p.ID, &p.AgentID, &p.Scope, &p.Resource,
			&p.GrantedBy, &p.GrantedAt, &p.ExpiresAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// RevokePermission removes a permission from an agent.
func (s *AgentService) RevokePermission(ctx context.Context, permID, orgID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`DELETE FROM agent_permissions ap
		 USING agents a
		 WHERE ap.id=$1 AND ap.agent_id=a.id AND a.org_id=$2`,
		permID, orgID,
	)
	return err
}

// nowStr returns the current UTC time as RFC3339.
func nowStr() string {
	return time.Now().UTC().Format(time.RFC3339)
}
