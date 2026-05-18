package service

import (
	"context"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// Policy is a governance or acceptable-use policy document.
type Policy struct {
	ID          string  `json:"id"`
	OrgID       string  `json:"org_id"`
	Name        string  `json:"name"`
	Description string  `json:"description,omitempty"`
	PolicyType  string  `json:"policy_type"`
	Status      string  `json:"status"`
	Version     string  `json:"version"`
	Content     string  `json:"content"`
	OwnerID     *string `json:"owner_id,omitempty"`
	ApprovedBy  *string `json:"approved_by,omitempty"`
	ApprovedAt  *string `json:"approved_at,omitempty"`
	ReviewDue   *string `json:"review_due,omitempty"`
	CreatedBy   *string `json:"created_by,omitempty"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

// PolicyAttestation records that a user has read and acknowledged a policy version.
type PolicyAttestation struct {
	ID         string  `json:"id"`
	PolicyID   string  `json:"policy_id"`
	OrgID      string  `json:"org_id"`
	UserID     string  `json:"user_id"`
	AttestedAt string  `json:"attested_at"`
	Version    string  `json:"version"`
	Notes      string  `json:"notes,omitempty"`
}

// PolicyService manages policy documents and attestations.
type PolicyService struct {
	db *store.DB
}

// NewPolicyService creates a PolicyService.
func NewPolicyService(db *store.DB) *PolicyService {
	return &PolicyService{db: db}
}

// CreatePolicy inserts a new policy document.
func (s *PolicyService) CreatePolicy(ctx context.Context, p Policy) (*Policy, error) {
	if p.PolicyType == "" {
		p.PolicyType = "governance"
	}
	if p.Version == "" {
		p.Version = "1.0"
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO policies
		   (org_id, name, description, policy_type, version, content, owner_id, review_due, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,'')::uuid,NULLIF($8,'')::date,NULLIF($9,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		p.OrgID, p.Name, p.Description, p.PolicyType, p.Version, p.Content,
		derefStr(p.OwnerID), derefStr(p.ReviewDue), derefStr(p.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create policy: %w", err)
	}
	p.ID = id
	p.Status = "draft"
	p.CreatedAt = createdAt
	p.UpdatedAt = updatedAt
	return &p, nil
}

// ListPolicies returns policies for an org.
func (s *PolicyService) ListPolicies(ctx context.Context, orgID, policyType, status string) ([]Policy, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, name, COALESCE(description,''), policy_type, status, version, content,
		        owner_id::text, approved_by::text, approved_at::text, review_due::text,
		        created_by::text, created_at::text, updated_at::text
		 FROM policies
		 WHERE org_id=$1 AND ($2='' OR policy_type=$2) AND ($3='' OR status=$3)
		 ORDER BY created_at DESC`,
		orgID, policyType, status,
	)
	if err != nil {
		return nil, fmt.Errorf("list policies: %w", err)
	}
	defer rows.Close()

	var out []Policy
	for rows.Next() {
		var p Policy
		if err := rows.Scan(&p.ID, &p.OrgID, &p.Name, &p.Description, &p.PolicyType,
			&p.Status, &p.Version, &p.Content, &p.OwnerID, &p.ApprovedBy, &p.ApprovedAt,
			&p.ReviewDue, &p.CreatedBy, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// UpdatePolicyStatus transitions a policy through the review workflow.
func (s *PolicyService) UpdatePolicyStatus(ctx context.Context, id, orgID, status, userID string) error {
	q := `UPDATE policies SET status=$1, updated_at=now() WHERE id=$2 AND org_id=$3`
	args := []any{status, id, orgID}
	if status == "approved" {
		q = `UPDATE policies SET status=$1, approved_by=NULLIF($4,'')::uuid, approved_at=now(), updated_at=now() WHERE id=$2 AND org_id=$3`
		args = append(args, userID)
	}
	_, err := s.db.Pool().Exec(ctx, q, args...)
	return err
}

// UpdatePolicyContent updates the content and bumps the version.
func (s *PolicyService) UpdatePolicyContent(ctx context.Context, id, orgID, content, version string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE policies SET content=$1, version=COALESCE(NULLIF($2,''),version), status='draft', updated_at=now()
		 WHERE id=$3 AND org_id=$4`,
		content, version, id, orgID,
	)
	return err
}

// Attest records that a user has acknowledged the current version of a policy.
func (s *PolicyService) Attest(ctx context.Context, a PolicyAttestation) (*PolicyAttestation, error) {
	var id, attestedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO policy_attestations (policy_id, org_id, user_id, version, notes)
		 VALUES ($1,$2,$3,$4,$5)
		 ON CONFLICT (policy_id, user_id, version) DO UPDATE SET attested_at=now(), notes=EXCLUDED.notes
		 RETURNING id, attested_at::text`,
		a.PolicyID, a.OrgID, a.UserID, a.Version, a.Notes,
	).Scan(&id, &attestedAt)
	if err != nil {
		return nil, fmt.Errorf("attest policy: %w", err)
	}
	a.ID = id
	a.AttestedAt = attestedAt
	return &a, nil
}

// ListAttestations returns attestations for a policy.
func (s *PolicyService) ListAttestations(ctx context.Context, policyID, orgID string) ([]PolicyAttestation, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, policy_id, org_id, user_id, attested_at::text, version, COALESCE(notes,'')
		 FROM policy_attestations
		 WHERE policy_id=$1 AND org_id=$2
		 ORDER BY attested_at DESC`,
		policyID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list attestations: %w", err)
	}
	defer rows.Close()

	var out []PolicyAttestation
	for rows.Next() {
		var a PolicyAttestation
		if err := rows.Scan(&a.ID, &a.PolicyID, &a.OrgID, &a.UserID, &a.AttestedAt, &a.Version, &a.Notes); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}
