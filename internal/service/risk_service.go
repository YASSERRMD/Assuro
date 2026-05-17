package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/domain"
	"github.com/YASSERRMD/Assuro/internal/risk"
	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
)

// RiskService handles risk computation and history.
type RiskService struct {
	db      *store.DB
	queries *qgen.Queries
	engine  *risk.Engine
	calc    *risk.ScoreCalculator
	aiSvc   *AISystemService
}

// NewRiskService creates a new risk service.
func NewRiskService(db *store.DB, aiSvc *AISystemService) *RiskService {
	return &RiskService{
		db:      db,
		queries: qgen.New(db.Pool()),
		engine:  risk.NewEngine(),
		calc:    &risk.ScoreCalculator{},
		aiSvc:   aiSvc,
	}
}

// ComputeRisk runs the risk engine for an asset and persists the result.
func (s *RiskService) ComputeRisk(ctx context.Context, orgID, assetID string) (*domain.RiskAssessment, error) {
	asset, err := s.aiSvc.GetAISystem(ctx, orgID, assetID)
	if err != nil {
		return nil, fmt.Errorf("get asset: %w", err)
	}

	tier, factors, version := s.engine.Classify(asset.Asset, asset.Details)
	score := s.calc.Calculate(factors)

	factorBytes, _ := json.Marshal(factors)
	aID := parseUUID(assetID)

	result, err := s.queries.CreateRiskAssessment(ctx, qgen.CreateRiskAssessmentParams{
		AssetID:      aID,
		Tier:         string(tier),
		Score:        int32(score),
		Factors:      factorBytes,
		RulesetVersion: version,
		ComputedBy:   "system",
	})
	if err != nil {
		return nil, fmt.Errorf("persist risk: %w", err)
	}

	return toDomainRiskAssessment(result), nil
}

// GetLatestRisk returns the most recent risk assessment for an asset.
func (s *RiskService) GetLatestRisk(ctx context.Context, assetID string) (*domain.RiskAssessment, error) {
	aID := parseUUID(assetID)

	result, err := s.queries.GetLatestRiskAssessment(ctx, aID)
	if err != nil {
		return nil, fmt.Errorf("get latest risk: %w", err)
	}

	return toDomainRiskAssessment(result), nil
}

// ListRiskHistory returns all risk assessments for an asset.
func (s *RiskService) ListRiskHistory(ctx context.Context, assetID string) ([]domain.RiskAssessment, error) {
	aID := parseUUID(assetID)

	rows, err := s.queries.ListRiskAssessmentsByAsset(ctx, aID)
	if err != nil {
		return nil, fmt.Errorf("list risk history: %w", err)
	}

	result := make([]domain.RiskAssessment, len(rows))
	for i, r := range rows {
		result[i] = *toDomainRiskAssessment(r)
	}
	return result, nil
}

func toDomainRiskAssessment(r qgen.RiskAssessment) *domain.RiskAssessment {
	var factors []domain.RiskFactor
	if len(r.Factors) > 0 {
		json.Unmarshal(r.Factors, &factors)
	}

	return &domain.RiskAssessment{
		ID:             r.ID.String(),
		AssetID:        r.AssetID.String(),
		Tier:           domain.RiskTier(r.Tier),
		Score:          domain.RiskScore(r.Score),
		Factors:        factors,
		RulesetVersion: r.RulesetVersion,
		ComputedAt:     r.ComputedAt.Time,
		ComputedBy:     r.ComputedBy,
	}
}
