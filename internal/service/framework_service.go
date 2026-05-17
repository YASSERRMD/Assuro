package service

import (
	"context"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/jackc/pgx/v5/pgtype"
)

// FrameworkService handles framework and control operations.
type FrameworkService struct {
	db      *store.DB
	queries *qgen.Queries
}

// NewFrameworkService creates a new framework service.
func NewFrameworkService(db *store.DB) *FrameworkService {
	return &FrameworkService{
		db:      db,
		queries: qgen.New(db.Pool()),
	}
}

// Framework represents a compliance framework.
type Framework struct {
	ID      string `json:"id"`
	Key     string `json:"key"`
	Name    string `json:"name"`
	Version string `json:"version"`
}

// ListFrameworks returns all registered frameworks.
func (s *FrameworkService) ListFrameworks(ctx context.Context) ([]Framework, error) {
	rows, err := s.queries.ListFrameworks(ctx)
	if err != nil {
		return nil, fmt.Errorf("list frameworks: %w", err)
	}

	result := make([]Framework, len(rows))
	for i, r := range rows {
		result[i] = Framework{
			ID:      r.ID.String(),
			Key:     r.Key,
			Name:    r.Name,
			Version: r.Version,
		}
	}
	return result, nil
}

// Control represents a compliance control.
type Control struct {
	ID          string `json:"id"`
	Key         string `json:"key"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Domain      string `json:"domain"`
}

// ListControls returns all built-in controls.
func (s *FrameworkService) ListControls(ctx context.Context) ([]Control, error) {
	rows, err := s.queries.ListControls(ctx, pgtype.UUID{})
	if err != nil {
		return nil, fmt.Errorf("list controls: %w", err)
	}

	result := make([]Control, len(rows))
	for i, r := range rows {
		result[i] = Control{
			ID:          r.ID.String(),
			Key:         r.Key,
			Title:       r.Title,
			Description: r.Description.String,
			Domain:      r.Domain,
		}
	}
	return result, nil
}

// SetControlStatusInput contains control status update fields.
type SetControlStatusInput struct {
	AssetID     string
	ControlID   string
	Status      string
	Justification string
	UpdatedBy   string
}

// SetControlStatus updates the status of a control for an asset.
func (s *FrameworkService) SetControlStatus(ctx context.Context, in SetControlStatusInput) error {
	aID := parseUUID(in.AssetID)
	cID := parseUUID(in.ControlID)
	uID := pgtype.UUID{}
	if in.UpdatedBy != "" {
		uID = parseUUID(in.UpdatedBy)
	}

	_, err := s.queries.SetControlStatus(ctx, qgen.SetControlStatusParams{
		AssetID:       aID,
		ControlID:     cID,
		Status:        in.Status,
		Justification: pgtype.Text{String: in.Justification, Valid: in.Justification != ""},
		UpdatedBy:     uID,
	})
	if err != nil {
		return fmt.Errorf("set control status: %w", err)
	}

	return nil
}

// ControlStatusEntry holds a control with its status for an asset.
type ControlStatusEntry struct {
	ControlKey    string `json:"control_key"`
	ControlTitle  string `json:"control_title"`
	ControlDomain string `json:"control_domain"`
	Status        string `json:"status"`
	Justification string `json:"justification"`
}

// GetStatementOfApplicability returns all controls with their statuses for an asset.
func (s *FrameworkService) GetStatementOfApplicability(ctx context.Context, assetID string) ([]ControlStatusEntry, error) {
	aID := parseUUID(assetID)

	rows, err := s.queries.GetControlStatusWithDetails(ctx, aID)
	if err != nil {
		return nil, fmt.Errorf("get control statuses: %w", err)
	}

	result := make([]ControlStatusEntry, len(rows))
	for i, r := range rows {
		result[i] = ControlStatusEntry{
			ControlKey:    r.ControlKey,
			ControlTitle:  r.ControlTitle,
			ControlDomain: r.ControlDomain,
			Status:        r.Status,
			Justification: r.Justification.String,
		}
	}
	return result, nil
}

// FrameworkCoverage returns the coverage percentage for a framework.
type FrameworkCoverage struct {
	FrameworkKey  string  `json:"framework_key"`
	TotalReqs     int     `json:"total_requirements"`
	CoveredReqs   int     `json:"covered_requirements"`
	CoveragePct   float64 `json:"coverage_pct"`
}

// GetCoverage computes coverage percentages per framework for an asset.
func (s *FrameworkService) GetCoverage(ctx context.Context, assetID string) ([]FrameworkCoverage, error) {
	frameworks, err := s.ListFrameworks(ctx)
	if err != nil {
		return nil, err
	}

	statusMap := make(map[string]bool)
	statusRows, err := s.queries.GetControlStatusWithDetails(ctx, parseUUID(assetID))
	if err == nil {
		for _, r := range statusRows {
			if r.Status == "implemented" {
				statusMap[r.ControlKey] = true
			}
		}
	}

	var result []FrameworkCoverage
	for _, fw := range frameworks {
		reqs, err := s.queries.GetRequirementsByFramework(ctx, parseUUID(fw.ID))
		if err != nil {
			continue
		}

		coveredReqs := 0
		for _, req := range reqs {
			ctrls, err := s.queries.GetControlsForRequirement(ctx, req.ID)
			if err != nil {
				continue
			}
			for _, c := range ctrls {
				if statusMap[c.Key] {
					coveredReqs++
					break
				}
			}
		}

		total := len(reqs)
		pct := 0.0
		if total > 0 {
			pct = float64(coveredReqs) / float64(total) * 100
		}

		result = append(result, FrameworkCoverage{
			FrameworkKey: fw.Key,
			TotalReqs:    total,
			CoveredReqs:  coveredReqs,
			CoveragePct:  pct,
		})
	}

	return result, nil
}
