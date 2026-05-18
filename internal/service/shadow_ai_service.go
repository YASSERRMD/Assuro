package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// ShadowAIFinding represents an unregistered AI model detected during discovery.
type ShadowAIFinding struct {
	ID          string          `json:"id"`
	OrgID       string          `json:"org_id"`
	ConnectorID *string         `json:"connector_id,omitempty"`
	SourceType  string          `json:"source_type"`
	SourceRef   string          `json:"source_ref"`
	Name        string          `json:"name"`
	ModelType   string          `json:"model_type,omitempty"`
	RiskLevel   string          `json:"risk_level"`
	Status      string          `json:"status"`
	Metadata    json.RawMessage `json:"metadata"`
	DetectedAt  string          `json:"detected_at"`
	ReviewedAt  *string         `json:"reviewed_at,omitempty"`
	ReviewedBy  *string         `json:"reviewed_by,omitempty"`
}

// ShadowAIService manages shadow AI findings.
type ShadowAIService struct {
	db *store.DB
}

// NewShadowAIService creates a ShadowAIService.
func NewShadowAIService(db *store.DB) *ShadowAIService {
	return &ShadowAIService{db: db}
}

// RecordFinding upserts a shadow AI finding by (org, source_type, source_ref).
func (s *ShadowAIService) RecordFinding(ctx context.Context, f ShadowAIFinding) (*ShadowAIFinding, error) {
	if f.Metadata == nil {
		f.Metadata = json.RawMessage("{}")
	}
	if f.RiskLevel == "" {
		f.RiskLevel = "unknown"
	}
	var id, detectedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO shadow_ai_findings
		   (org_id, connector_id, source_type, source_ref, name, model_type, risk_level, metadata)
		 VALUES ($1, NULLIF($2,'')::uuid, $3, $4, $5, NULLIF($6,''), $7, $8)
		 ON CONFLICT (org_id, source_type, source_ref) DO UPDATE
		   SET name=EXCLUDED.name, model_type=EXCLUDED.model_type,
		       risk_level=EXCLUDED.risk_level, metadata=EXCLUDED.metadata
		 RETURNING id, detected_at::text`,
		f.OrgID, derefStr(f.ConnectorID), f.SourceType, f.SourceRef,
		f.Name, f.ModelType, f.RiskLevel, f.Metadata,
	).Scan(&id, &detectedAt)
	if err != nil {
		return nil, fmt.Errorf("record shadow finding: %w", err)
	}
	f.ID = id
	f.Status = "open"
	f.DetectedAt = detectedAt
	return &f, nil
}

// ListFindings returns shadow AI findings for an org.
func (s *ShadowAIService) ListFindings(ctx context.Context, orgID, status string) ([]ShadowAIFinding, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, connector_id::text, source_type, source_ref, name,
		        COALESCE(model_type,''), risk_level, status, metadata,
		        detected_at::text, reviewed_at::text, reviewed_by::text
		 FROM shadow_ai_findings
		 WHERE org_id=$1 AND ($2='' OR status=$2)
		 ORDER BY detected_at DESC`,
		orgID, status,
	)
	if err != nil {
		return nil, fmt.Errorf("list shadow findings: %w", err)
	}
	defer rows.Close()

	var out []ShadowAIFinding
	for rows.Next() {
		var f ShadowAIFinding
		if err := rows.Scan(&f.ID, &f.OrgID, &f.ConnectorID, &f.SourceType, &f.SourceRef,
			&f.Name, &f.ModelType, &f.RiskLevel, &f.Status, &f.Metadata,
			&f.DetectedAt, &f.ReviewedAt, &f.ReviewedBy); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

// UpdateFindingStatus changes the status of a finding (reviewed/dismissed/registered).
func (s *ShadowAIService) UpdateFindingStatus(ctx context.Context, id, orgID, status, userID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE shadow_ai_findings
		 SET status=$1, reviewed_at=now(), reviewed_by=NULLIF($2,'')::uuid
		 WHERE id=$3 AND org_id=$4`,
		status, userID, id, orgID,
	)
	return err
}
