package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// ConformityAssessment is a structured review for EU AI Act, FRIA or DPIA.
type ConformityAssessment struct {
	ID         string          `json:"id"`
	OrgID      string          `json:"org_id"`
	AssetID    string          `json:"asset_id"`
	Kind       string          `json:"kind"`
	Title      string          `json:"title"`
	Status     string          `json:"status"`
	Findings   json.RawMessage `json:"findings"`
	Conclusion string          `json:"conclusion,omitempty"`
	SignedBy   *string         `json:"signed_by,omitempty"`
	SignedAt   *string         `json:"signed_at,omitempty"`
	CreatedBy  *string         `json:"created_by,omitempty"`
	CreatedAt  string          `json:"created_at"`
	UpdatedAt  string          `json:"updated_at"`
}

// ConformityDeclaration is an EU Declaration of Conformity or similar document.
type ConformityDeclaration struct {
	ID              string          `json:"id"`
	OrgID           string          `json:"org_id"`
	AssetID         string          `json:"asset_id"`
	AssessmentID    *string         `json:"assessment_id,omitempty"`
	DeclarationType string          `json:"declaration_type"`
	Content         json.RawMessage `json:"content"`
	IssuedAt        string          `json:"issued_at"`
	ValidUntil      *string         `json:"valid_until,omitempty"`
}

// ConformityService manages conformity assessments and declarations.
type ConformityService struct {
	db *store.DB
}

// NewConformityService creates a ConformityService.
func NewConformityService(db *store.DB) *ConformityService {
	return &ConformityService{db: db}
}

// CreateAssessment creates a new conformity assessment.
func (s *ConformityService) CreateAssessment(ctx context.Context, a ConformityAssessment) (*ConformityAssessment, error) {
	if a.Findings == nil {
		a.Findings = json.RawMessage("{}")
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO conformity_assessments
		   (org_id, asset_id, kind, title, findings, created_by)
		 VALUES ($1,$2,$3,$4,$5,NULLIF($6,'')::uuid)
		 RETURNING id, created_at, updated_at`,
		a.OrgID, a.AssetID, a.Kind, a.Title, a.Findings, derefStr(a.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create assessment: %w", err)
	}
	a.ID = id
	a.Status = "draft"
	a.CreatedAt = createdAt
	a.UpdatedAt = updatedAt
	return &a, nil
}

// ListAssessments returns all assessments for an org, optionally filtered by asset and kind.
func (s *ConformityService) ListAssessments(ctx context.Context, orgID, assetID, kind string) ([]ConformityAssessment, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, asset_id, kind, title, status,
		        findings, COALESCE(conclusion,''),
		        signed_by::text, signed_at::text, created_by::text,
		        created_at::text, updated_at::text
		 FROM conformity_assessments
		 WHERE org_id=$1
		   AND ($2='' OR asset_id::text=$2)
		   AND ($3='' OR kind=$3)
		 ORDER BY created_at DESC`,
		orgID, assetID, kind,
	)
	if err != nil {
		return nil, fmt.Errorf("list assessments: %w", err)
	}
	defer rows.Close()

	var out []ConformityAssessment
	for rows.Next() {
		var a ConformityAssessment
		if err := rows.Scan(&a.ID, &a.OrgID, &a.AssetID, &a.Kind, &a.Title,
			&a.Status, &a.Findings, &a.Conclusion, &a.SignedBy, &a.SignedAt,
			&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// UpdateAssessment updates status, findings or conclusion.
func (s *ConformityService) UpdateAssessment(ctx context.Context, id, orgID, status, conclusion string, findings json.RawMessage) error {
	args := []any{status, conclusion, id, orgID}
	q := `UPDATE conformity_assessments
		  SET status=$1, conclusion=$2, updated_at=now()
		  WHERE id=$3 AND org_id=$4`
	if len(findings) > 0 {
		q = `UPDATE conformity_assessments
			 SET status=$1, conclusion=$2, findings=$5, updated_at=now()
			 WHERE id=$3 AND org_id=$4`
		args = append(args, findings)
	}
	_, err := s.db.Pool().Exec(ctx, q, args...)
	return err
}

// SignAssessment marks an assessment as signed by a user.
func (s *ConformityService) SignAssessment(ctx context.Context, id, orgID, userID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE conformity_assessments
		 SET signed_by=$1, signed_at=now(), status='complete', updated_at=now()
		 WHERE id=$2 AND org_id=$3`,
		userID, id, orgID,
	)
	return err
}

// IssueDeclaration creates an EU DoC or similar declaration document.
func (s *ConformityService) IssueDeclaration(ctx context.Context, d ConformityDeclaration) (*ConformityDeclaration, error) {
	if d.Content == nil {
		d.Content = json.RawMessage("{}")
	}
	if d.DeclarationType == "" {
		d.DeclarationType = "eu_doc"
	}
	var id, issuedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO conformity_declarations
		   (org_id, asset_id, assessment_id, declaration_type, content)
		 VALUES ($1,$2,NULLIF($3,'')::uuid,$4,$5)
		 RETURNING id, issued_at`,
		d.OrgID, d.AssetID, derefStr(d.AssessmentID), d.DeclarationType, d.Content,
	).Scan(&id, &issuedAt)
	if err != nil {
		return nil, fmt.Errorf("issue declaration: %w", err)
	}
	d.ID = id
	d.IssuedAt = issuedAt
	return &d, nil
}

// ListDeclarations returns declarations for an org and asset.
func (s *ConformityService) ListDeclarations(ctx context.Context, orgID, assetID string) ([]ConformityDeclaration, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, asset_id, assessment_id::text,
		        declaration_type, content, issued_at::text, valid_until::text
		 FROM conformity_declarations
		 WHERE org_id=$1 AND ($2='' OR asset_id::text=$2)
		 ORDER BY issued_at DESC`,
		orgID, assetID,
	)
	if err != nil {
		return nil, fmt.Errorf("list declarations: %w", err)
	}
	defer rows.Close()

	var out []ConformityDeclaration
	for rows.Next() {
		var d ConformityDeclaration
		if err := rows.Scan(&d.ID, &d.OrgID, &d.AssetID, &d.AssessmentID,
			&d.DeclarationType, &d.Content, &d.IssuedAt, &d.ValidUntil); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
