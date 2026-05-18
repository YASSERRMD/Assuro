package service

import (
	"context"
	"fmt"
	"time"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// RegulatoryChange is a single entry in the regulatory change feed.
type RegulatoryChange struct {
	ID           string     `json:"id"`
	FrameworkKey string     `json:"framework_key"`
	RefCode      string     `json:"ref_code"`
	ChangeKind   string     `json:"change_kind"`
	Summary      string     `json:"summary"`
	EffectiveDate *string   `json:"effective_date,omitempty"`
	SourceURL    string     `json:"source_url,omitempty"`
	PublishedAt  time.Time  `json:"published_at"`
}

// ImpactAssessment links a regulatory change to an org's AI system.
type ImpactAssessment struct {
	ID          string  `json:"id"`
	OrgID       string  `json:"org_id"`
	ChangeID    string  `json:"change_id"`
	AssetID     *string `json:"asset_id,omitempty"`
	ImpactLevel string  `json:"impact_level"`
	Notes       string  `json:"notes"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"created_at"`
}

// RegulatoryIntelligenceService manages the change feed and impact mapping.
type RegulatoryIntelligenceService struct {
	db *store.DB
}

// NewRegulatoryIntelligenceService creates a RegulatoryIntelligenceService.
func NewRegulatoryIntelligenceService(db *store.DB) *RegulatoryIntelligenceService {
	return &RegulatoryIntelligenceService{db: db}
}

// AddChange records a new regulatory change event.
func (s *RegulatoryIntelligenceService) AddChange(ctx context.Context, c RegulatoryChange) (*RegulatoryChange, error) {
	var id string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO regulatory_changes (framework_key, ref_code, change_kind, summary, source_url)
		 VALUES ($1,$2,$3,$4,NULLIF($5,''))
		 RETURNING id, published_at`,
		c.FrameworkKey, c.RefCode, c.ChangeKind, c.Summary, c.SourceURL,
	).Scan(&id, &c.PublishedAt)
	if err != nil {
		return nil, fmt.Errorf("add change: %w", err)
	}
	c.ID = id
	return &c, nil
}

// ListChanges returns the regulatory change feed, optionally filtered by framework key.
func (s *RegulatoryIntelligenceService) ListChanges(ctx context.Context, frameworkKey string, limit int) ([]RegulatoryChange, error) {
	if limit <= 0 {
		limit = 100
	}
	var rows interface {
		Next() bool
		Scan(...any) error
		Err() error
		Close()
	}
	var err error

	if frameworkKey != "" {
		r, e := s.db.Pool().Query(ctx,
			`SELECT id, framework_key, ref_code, change_kind, summary,
			        effective_date::text, COALESCE(source_url,''), published_at
			 FROM regulatory_changes WHERE framework_key = $1
			 ORDER BY published_at DESC LIMIT $2`,
			frameworkKey, limit)
		rows, err = r, e
	} else {
		r, e := s.db.Pool().Query(ctx,
			`SELECT id, framework_key, ref_code, change_kind, summary,
			        effective_date::text, COALESCE(source_url,''), published_at
			 FROM regulatory_changes ORDER BY published_at DESC LIMIT $1`,
			limit)
		rows, err = r, e
	}
	if err != nil {
		return nil, fmt.Errorf("list changes: %w", err)
	}
	defer rows.Close()

	var out []RegulatoryChange
	for rows.Next() {
		var c RegulatoryChange
		if err := rows.Scan(&c.ID, &c.FrameworkKey, &c.RefCode, &c.ChangeKind,
			&c.Summary, &c.EffectiveDate, &c.SourceURL, &c.PublishedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// CreateImpactAssessment links a regulatory change to org assets for review.
func (s *RegulatoryIntelligenceService) CreateImpactAssessment(ctx context.Context, a ImpactAssessment) (*ImpactAssessment, error) {
	if a.ImpactLevel == "" {
		a.ImpactLevel = "medium"
	}
	var id, createdAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO regulatory_impact_assessments
		   (org_id, change_id, asset_id, impact_level, notes)
		 VALUES ($1,$2,NULLIF($3,'')::uuid,$4,$5)
		 RETURNING id, created_at`,
		a.OrgID, a.ChangeID, a.AssetID, a.ImpactLevel, a.Notes,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("create impact assessment: %w", err)
	}
	a.ID = id
	a.CreatedAt = createdAt
	a.Status = "open"
	return &a, nil
}

// ListImpactAssessments returns impact assessments for an org.
func (s *RegulatoryIntelligenceService) ListImpactAssessments(ctx context.Context, orgID, status string) ([]ImpactAssessment, error) {
	var rows interface {
		Next() bool
		Scan(...any) error
		Err() error
		Close()
	}
	var err error

	if status != "" {
		r, e := s.db.Pool().Query(ctx,
			`SELECT id, org_id, change_id, asset_id::text, impact_level, COALESCE(notes,''), status, created_at
			 FROM regulatory_impact_assessments WHERE org_id=$1 AND status=$2
			 ORDER BY created_at DESC`,
			orgID, status)
		rows, err = r, e
	} else {
		r, e := s.db.Pool().Query(ctx,
			`SELECT id, org_id, change_id, asset_id::text, impact_level, COALESCE(notes,''), status, created_at
			 FROM regulatory_impact_assessments WHERE org_id=$1
			 ORDER BY created_at DESC`,
			orgID)
		rows, err = r, e
	}
	if err != nil {
		return nil, fmt.Errorf("list impact assessments: %w", err)
	}
	defer rows.Close()

	var out []ImpactAssessment
	for rows.Next() {
		var a ImpactAssessment
		if err := rows.Scan(&a.ID, &a.OrgID, &a.ChangeID, &a.AssetID,
			&a.ImpactLevel, &a.Notes, &a.Status, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// UpdateImpactStatus updates the status of an impact assessment.
func (s *RegulatoryIntelligenceService) UpdateImpactStatus(ctx context.Context, id, orgID, status string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE regulatory_impact_assessments SET status=$1 WHERE id=$2 AND org_id=$3`,
		status, id, orgID,
	)
	return err
}
