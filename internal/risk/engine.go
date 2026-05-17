package risk

import (
	"github.com/YASSERRMD/Assuro/internal/domain"
)

// RuleSet classifies an asset and returns risk factors.
type RuleSet interface {
	// Classify returns the risk tier and explanatory factors.
	Classify(asset domain.Asset, details any) (domain.RiskTier, []domain.RiskFactor)
	// Version returns the ruleset version string.
	Version() string
}

var registry = make(map[string]RuleSet)

// Register adds a rule set for a given asset type.
func Register(assetType string, rs RuleSet) {
	registry[assetType] = rs
}

// Get retrieves a rule set by asset type.
func Get(assetType string) (RuleSet, bool) {
	rs, ok := registry[assetType]
	return rs, ok
}

// Engine runs the risk classification.
type Engine struct{}

// NewEngine creates a new risk engine.
func NewEngine() *Engine {
	return &Engine{}
}

// Classify runs the appropriate rule set for the asset type.
func (e *Engine) Classify(asset domain.Asset, details any) (domain.RiskTier, []domain.RiskFactor, string) {
	rs, ok := Get(string(asset.AssetType))
	if !ok {
		return domain.RiskTierMinimal, nil, "unknown"
	}
	tier, factors := rs.Classify(asset, details)
	return tier, factors, rs.Version()
}

// ScoreCalculator converts risk factors into a 0-100 score.
type ScoreCalculator struct{}

// Calculate computes a numeric score from factors.
func (s *ScoreCalculator) Calculate(factors []domain.RiskFactor) domain.RiskScore {
	total := 0
	for _, f := range factors {
		total += f.Weight
	}
	if total > 100 {
		total = 100
	}
	if total < 0 {
		total = 0
	}
	return domain.RiskScore(total)
}
