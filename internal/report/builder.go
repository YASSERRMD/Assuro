package report

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/YASSERRMD/Assuro/internal/domain"
)

// ComplianceReport is an audit-ready compliance report.
type ComplianceReport struct {
	GeneratedAt    time.Time                 `json:"generated_at"`
	AssetID        string                    `json:"asset_id"`
	FrameworkKey   string                    `json:"framework_key"`
	RiskTier       domain.RiskTier           `json:"risk_tier"`
	RiskScore      domain.RiskScore          `json:"risk_score"`
	RiskFactors    []domain.RiskFactor       `json:"risk_factors"`
	ControlStatuses []ControlStatusEntry     `json:"control_statuses"`
	Coverage       []FrameworkCoverage       `json:"coverage"`
	ContentHash    string                    `json:"content_hash"`
}

// ControlStatusEntry holds a control status for reporting.
type ControlStatusEntry struct {
	Key    string `json:"key"`
	Title  string `json:"title"`
	Status string `json:"status"`
}

// FrameworkCoverage holds coverage data for reporting.
type FrameworkCoverage struct {
	Key       string  `json:"key"`
	CoveragePct float64 `json:"coverage_pct"`
}

// Builder constructs compliance reports.
type Builder struct{}

// NewBuilder creates a new report builder.
func NewBuilder() *Builder {
	return &Builder{}
}

// BuildJSON assembles a compliance report as JSON.
func (b *Builder) BuildJSON(assetID, frameworkKey string, risk *domain.RiskAssessment, controls []ControlStatusEntry, coverage []FrameworkCoverage) (*ComplianceReport, error) {
	report := &ComplianceReport{
		GeneratedAt:     time.Now().UTC(),
		AssetID:         assetID,
		FrameworkKey:    frameworkKey,
		ControlStatuses: controls,
		Coverage:        coverage,
	}

	if risk != nil {
		report.RiskTier = risk.Tier
		report.RiskScore = risk.Score
		report.RiskFactors = risk.Factors
	}

	bytes, err := json.Marshal(report)
	if err != nil {
		return nil, fmt.Errorf("marshal report: %w", err)
	}

	report.ContentHash = hex.EncodeToString(sha256.New().Sum(bytes))
	return report, nil
}

// BuildHTML renders the report as self-contained HTML.
func (b *Builder) BuildHTML(report *ComplianceReport) string {
	html := `<!DOCTYPE html><html><head><title>Assuro Compliance Report</title>`
	html += `<style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}h1{color:#1B2A4A}.badge{display:inline-block;padding:0.25rem 0.5rem;border-radius:4px;font-size:0.875rem}table{width:100%%;border-collapse:collapse}th,td{padding:0.5rem;text-align:left;border-bottom:1px solid #eee}.hash{font-family:monospace;font-size:0.75rem;color:#666}</style></head><body>`
	html += fmt.Sprintf("<h1>Compliance Report</h1>")
	html += fmt.Sprintf("<p>Asset: %s | Framework: %s | Generated: %s</p>", report.AssetID, report.FrameworkKey, report.GeneratedAt.Format(time.RFC3339))
	html += fmt.Sprintf("<p>Risk Tier: <strong>%s</strong> | Score: %d/100</p>", report.RiskTier, report.RiskScore)

	if len(report.RiskFactors) > 0 {
		html += "<h2>Risk Factors</h2><ul>"
		for _, f := range report.RiskFactors {
			html += fmt.Sprintf("<li><strong>%s</strong> (weight %d): %s</li>", f.Code, f.Weight, f.Description)
		}
		html += "</ul>"
	}

	if len(report.ControlStatuses) > 0 {
		html += "<h2>Controls</h2><table><tr><th>Key</th><th>Title</th><th>Status</th></tr>"
		for _, c := range report.ControlStatuses {
			html += fmt.Sprintf("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", c.Key, c.Title, c.Status)
		}
		html += "</table>"
	}

	html += fmt.Sprintf("<p class='hash'>Content Hash: %s</p>", report.ContentHash)
	html += "</body></html>"
	return html
}
