package domain

import "time"

// RiskTier represents the EU AI Act risk classification.
type RiskTier string

const (
	RiskTierUnacceptable RiskTier = "unacceptable"
	RiskTierHigh         RiskTier = "high"
	RiskTierLimited      RiskTier = "limited"
	RiskTierMinimal      RiskTier = "minimal"
)

// RiskFactor explains a single reason contributing to a risk score.
type RiskFactor struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Weight      int    `json:"weight"`
}

// RiskScore is the numeric 0-100 risk score.
type RiskScore int

// RiskAssessment is the persisted result of a risk computation.
type RiskAssessment struct {
	ID            string       `json:"id"`
	AssetID       string       `json:"asset_id"`
	Tier          RiskTier     `json:"tier"`
	Score         RiskScore    `json:"score"`
	Factors       []RiskFactor `json:"factors"`
	RulesetVersion string     `json:"ruleset_version"`
	ComputedAt    time.Time    `json:"computed_at"`
	ComputedBy    string       `json:"computed_by"`
}
