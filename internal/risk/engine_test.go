package risk

import (
	"testing"

	"github.com/YASSERRMD/Assuro/internal/domain"
)

func TestEUAIACTProhibited(t *testing.T) {
	rs := &EUAIACTRuleSet{}
	asset := domain.Asset{
		Name:      "Social Scorer",
		AssetType: domain.AssetTypeAISystem,
	}
	details := domain.AISystemDetails{
		IntendedPurpose: "social scoring of citizens",
	}

	tier, factors := rs.Classify(asset, details)
	if tier != domain.RiskTierUnacceptable {
		t.Errorf("expected unacceptable, got %s", tier)
	}
	if len(factors) != 1 || factors[0].Code != "PROHIBITED" {
		t.Errorf("expected PROHIBITED factor, got %v", factors)
	}
}

func TestEUAIACTHighRisk(t *testing.T) {
	rs := &EUAIACTRuleSet{}
	asset := domain.Asset{
		Name:      "Credit Scorer",
		AssetType: domain.AssetTypeAISystem,
	}
	details := domain.AISystemDetails{
		IntendedPurpose:  "credit scoring for loan applications",
		EUMarketExposure: true,
	}

	tier, factors := rs.Classify(asset, details)
	if tier != domain.RiskTierHigh {
		t.Errorf("expected high, got %s", tier)
	}
	if len(factors) < 2 {
		t.Errorf("expected at least 2 factors, got %d", len(factors))
	}
}

func TestEUAIACTMinimal(t *testing.T) {
	rs := &EUAIACTRuleSet{}
	asset := domain.Asset{
		Name:      "Chatbot",
		AssetType: domain.AssetTypeAISystem,
	}
	details := domain.AISystemDetails{
		IntendedPurpose: "general customer support chatbot",
	}

	tier, factors := rs.Classify(asset, details)
	if tier != domain.RiskTierMinimal {
		t.Errorf("expected minimal, got %s", tier)
	}
	if len(factors) != 0 {
		t.Errorf("expected no factors, got %d", len(factors))
	}
}

func TestScoreCalculator(t *testing.T) {
	calc := &ScoreCalculator{}
	factors := []domain.RiskFactor{
		{Code: "A", Weight: 30},
		{Code: "B", Weight: 20},
	}
	score := calc.Calculate(factors)
	if score != 50 {
		t.Errorf("expected 50, got %d", score)
	}
}

func TestScoreClamped(t *testing.T) {
	calc := &ScoreCalculator{}
	factors := []domain.RiskFactor{
		{Code: "A", Weight: 100},
		{Code: "B", Weight: 50},
	}
	score := calc.Calculate(factors)
	if score != 100 {
		t.Errorf("expected 100, got %d", score)
	}
}

func TestEngineClassifyUnknown(t *testing.T) {
	engine := NewEngine()
	asset := domain.Asset{
		Name:      "Unknown",
		AssetType: "unknown_type",
	}
	tier, factors, version := engine.Classify(asset, nil)
	if tier != domain.RiskTierMinimal {
		t.Errorf("expected minimal, got %s", tier)
	}
	if version != "unknown" {
		t.Errorf("expected unknown version, got %s", version)
	}
	if len(factors) != 0 {
		t.Errorf("expected no factors, got %d", len(factors))
	}
}
