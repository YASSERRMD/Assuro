package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// Vendor is a third-party AI or data provider.
type Vendor struct {
	ID           string          `json:"id"`
	OrgID        string          `json:"org_id"`
	Name         string          `json:"name"`
	Description  string          `json:"description,omitempty"`
	VendorType   string          `json:"vendor_type"`
	Website      string          `json:"website,omitempty"`
	ContactEmail string          `json:"contact_email,omitempty"`
	RiskTier     string          `json:"risk_tier"`
	Status       string          `json:"status"`
	Metadata     json.RawMessage `json:"metadata"`
	CreatedBy    *string         `json:"created_by,omitempty"`
	CreatedAt    string          `json:"created_at"`
	UpdatedAt    string          `json:"updated_at"`
}

// VendorAssessment is a due-diligence assessment for a vendor.
type VendorAssessment struct {
	ID              string          `json:"id"`
	VendorID        string          `json:"vendor_id"`
	OrgID           string          `json:"org_id"`
	AssessmentDate  string          `json:"assessment_date"`
	RiskScore       *int            `json:"risk_score,omitempty"`
	RiskTier        string          `json:"risk_tier"`
	Findings        json.RawMessage `json:"findings"`
	Recommendations string          `json:"recommendations,omitempty"`
	NextReviewDate  *string         `json:"next_review_date,omitempty"`
	AssessedBy      *string         `json:"assessed_by,omitempty"`
	CreatedAt       string          `json:"created_at"`
}

// VendorRiskService manages vendor registry and due-diligence assessments.
type VendorRiskService struct {
	db *store.DB
}

// NewVendorRiskService creates a VendorRiskService.
func NewVendorRiskService(db *store.DB) *VendorRiskService {
	return &VendorRiskService{db: db}
}

// CreateVendor registers a new vendor.
func (s *VendorRiskService) CreateVendor(ctx context.Context, v Vendor) (*Vendor, error) {
	if v.VendorType == "" {
		v.VendorType = "ai_provider"
	}
	if v.Metadata == nil {
		v.Metadata = json.RawMessage("{}")
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO vendors (org_id, name, description, vendor_type, website, contact_email, metadata, created_by)
		 VALUES ($1,$2,$3,$4,NULLIF($5,''),NULLIF($6,''),$7,NULLIF($8,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		v.OrgID, v.Name, v.Description, v.VendorType, v.Website, v.ContactEmail,
		v.Metadata, derefStr(v.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create vendor: %w", err)
	}
	v.ID = id
	v.RiskTier = "unknown"
	v.Status = "active"
	v.CreatedAt = createdAt
	v.UpdatedAt = updatedAt
	return &v, nil
}

// ListVendors returns vendors for an org.
func (s *VendorRiskService) ListVendors(ctx context.Context, orgID, vendorType, riskTier string) ([]Vendor, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, name, COALESCE(description,''), vendor_type,
		        COALESCE(website,''), COALESCE(contact_email,''),
		        risk_tier, status, metadata, created_by::text, created_at::text, updated_at::text
		 FROM vendors
		 WHERE org_id=$1 AND ($2='' OR vendor_type=$2) AND ($3='' OR risk_tier=$3)
		 ORDER BY created_at DESC`,
		orgID, vendorType, riskTier,
	)
	if err != nil {
		return nil, fmt.Errorf("list vendors: %w", err)
	}
	defer rows.Close()

	var out []Vendor
	for rows.Next() {
		var v Vendor
		if err := rows.Scan(&v.ID, &v.OrgID, &v.Name, &v.Description, &v.VendorType,
			&v.Website, &v.ContactEmail, &v.RiskTier, &v.Status, &v.Metadata,
			&v.CreatedBy, &v.CreatedAt, &v.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

// CreateAssessment records a due-diligence assessment for a vendor.
func (s *VendorRiskService) CreateAssessment(ctx context.Context, a VendorAssessment) (*VendorAssessment, error) {
	if a.Findings == nil {
		a.Findings = json.RawMessage("{}")
	}
	if a.RiskTier == "" {
		a.RiskTier = "unknown"
	}
	var id, createdAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO vendor_assessments
		   (vendor_id, org_id, assessment_date, risk_score, risk_tier, findings,
		    recommendations, next_review_date, assessed_by)
		 VALUES ($1,$2,COALESCE(NULLIF($3,'')::date,CURRENT_DATE),$4,$5,$6,$7,
		         NULLIF($8,'')::date,NULLIF($9,'')::uuid)
		 RETURNING id, created_at::text`,
		a.VendorID, a.OrgID, a.AssessmentDate, a.RiskScore, a.RiskTier, a.Findings,
		a.Recommendations, derefStr(a.NextReviewDate), derefStr(a.AssessedBy),
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("create vendor assessment: %w", err)
	}
	a.ID = id
	a.CreatedAt = createdAt

	// Update the vendor's risk tier to match latest assessment
	_, _ = s.db.Pool().Exec(ctx,
		`UPDATE vendors SET risk_tier=$1, updated_at=now() WHERE id=$2 AND org_id=$3`,
		a.RiskTier, a.VendorID, a.OrgID,
	)
	return &a, nil
}

// ListAssessments returns assessments for a vendor.
func (s *VendorRiskService) ListAssessments(ctx context.Context, vendorID, orgID string) ([]VendorAssessment, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, vendor_id, org_id, assessment_date::text, risk_score, risk_tier,
		        findings, COALESCE(recommendations,''), next_review_date::text,
		        assessed_by::text, created_at::text
		 FROM vendor_assessments
		 WHERE vendor_id=$1 AND org_id=$2
		 ORDER BY assessment_date DESC`,
		vendorID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list vendor assessments: %w", err)
	}
	defer rows.Close()

	var out []VendorAssessment
	for rows.Next() {
		var a VendorAssessment
		if err := rows.Scan(&a.ID, &a.VendorID, &a.OrgID, &a.AssessmentDate,
			&a.RiskScore, &a.RiskTier, &a.Findings, &a.Recommendations,
			&a.NextReviewDate, &a.AssessedBy, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}
