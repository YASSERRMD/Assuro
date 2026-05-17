package risk

import (
	"strings"

	"github.com/YASSERRMD/Assuro/internal/domain"
)

const euaiactVersion = "2024.1"

func init() {
	Register("ai_system", &EUAIACTRuleSet{})
}

// EUAIACTRuleSet implements RuleSet for EU AI Act Annex III classification.
type EUAIACTRuleSet struct{}

// Classify determines the risk tier based on EU AI Act criteria.
func (r *EUAIACTRuleSet) Classify(asset domain.Asset, details any) (domain.RiskTier, []domain.RiskFactor) {
	aiDetails, ok := details.(domain.AISystemDetails)
	if !ok {
		return domain.RiskTierMinimal, nil
	}

	var factors []domain.RiskFactor
	var tier domain.RiskTier

	purpose := strings.ToLower(aiDetails.IntendedPurpose)

	if isProhibited(purpose) {
		return domain.RiskTierUnacceptable, []domain.RiskFactor{
			{Code: "PROHIBITED", Description: "Use case is prohibited under EU AI Act Article 5", Weight: 100},
		}
	}

	if isHighRisk(purpose, aiDetails) {
		tier = domain.RiskTierHigh
		factors = append(factors, domain.RiskFactor{
			Code: "HIGH_RISK_USE_CASE",
			Description: "Intended purpose falls under Annex III high-risk category",
			Weight: 60,
		})
	}

	if aiDetails.EUMarketExposure {
		factors = append(factors, domain.RiskFactor{
			Code: "EU_MARKET_EXPOSURE",
			Description: "System is deployed or marketed in the EU",
			Weight: 20,
		})
	}

	if aiDetails.IsAgentic {
		factors = append(factors, domain.RiskFactor{
			Code: "AGENTIC_BEHAVIOR",
			Description: "System exhibits agentic or autonomous behavior",
			Weight: 15,
		})
	}

	if len(aiDetails.AffectedPopulations) > 0 {
		factors = append(factors, domain.RiskFactor{
			Code: "AFFECTED_POPULATIONS",
			Description: "System affects identifiable population groups",
			Weight: 10,
		})
	}

	if tier == "" {
		if len(factors) > 0 {
			tier = domain.RiskTierLimited
		} else {
			tier = domain.RiskTierMinimal
		}
	}

	return tier, factors
}

// Version returns the ruleset version.
func (r *EUAIACTRuleSet) Version() string {
	return euaiactVersion
}

func isProhibited(purpose string) bool {
	prohibited := []string{
		"social scoring",
		"real-time remote biometric",
		"subliminal manipulation",
		"exploitation of vulnerabilities",
	}
	for _, p := range prohibited {
		if strings.Contains(purpose, p) {
			return true
		}
	}
	return false
}

func isHighRisk(purpose string, d domain.AISystemDetails) bool {
	highRisk := []string{
		"biometric identification",
		"critical infrastructure",
		"education",
		"employment",
		"law enforcement",
		"migration",
		"credit scoring",
		"medical",
		"healthcare",
	}
	for _, h := range highRisk {
		if strings.Contains(purpose, h) {
			return true
		}
	}
	return false
}
