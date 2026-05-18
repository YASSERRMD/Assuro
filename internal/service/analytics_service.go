package service

import (
	"context"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// RiskSummary is the risk tier distribution across assets.
type RiskSummary struct {
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
	Unknown  int `json:"unknown"`
	Total    int `json:"total"`
}

// ComplianceSummary is the SoA control status distribution.
type ComplianceSummary struct {
	Implemented    int     `json:"implemented"`
	PartiallyImpl  int     `json:"partially_implemented"`
	NotApplicable  int     `json:"not_applicable"`
	NotImplemented int     `json:"not_implemented"`
	Total          int     `json:"total"`
	Score          float64 `json:"score"`
}

// IncidentTrend holds incident counts by month.
type IncidentTrend struct {
	Month string `json:"month"`
	Count int    `json:"count"`
}

// TaskSummary aggregates open/done tasks.
type TaskSummary struct {
	Open       int `json:"open"`
	InProgress int `json:"in_progress"`
	Blocked    int `json:"blocked"`
	Done       int `json:"done"`
	Overdue    int `json:"overdue"`
}

// AnalyticsDashboard is the top-level analytics response.
type AnalyticsDashboard struct {
	Risk           RiskSummary       `json:"risk"`
	Compliance     ComplianceSummary `json:"compliance"`
	IncidentTrends []IncidentTrend   `json:"incident_trends"`
	Tasks          TaskSummary       `json:"tasks"`
	AgentCount     int               `json:"agent_count"`
	FindingCount   int               `json:"shadow_ai_findings"`
	VendorCount    int               `json:"vendor_count"`
	PolicyCount    int               `json:"policy_count"`
}

// AnalyticsService aggregates cross-domain metrics.
type AnalyticsService struct {
	db *store.DB
}

// NewAnalyticsService creates an AnalyticsService.
func NewAnalyticsService(db *store.DB) *AnalyticsService {
	return &AnalyticsService{db: db}
}

// GetDashboard returns a full analytics snapshot for an org.
func (s *AnalyticsService) GetDashboard(ctx context.Context, orgID string) (*AnalyticsDashboard, error) {
	dash := &AnalyticsDashboard{}

	// Risk distribution from latest risk scores per asset
	riskRows, err := s.db.Pool().Query(ctx,
		`SELECT COALESCE(tier,'unknown') AS tier, COUNT(*) AS cnt
		 FROM (
		   SELECT DISTINCT ON (asset_id) tier
		   FROM risk_scores
		   WHERE org_id=$1
		   ORDER BY asset_id, computed_at DESC
		 ) sub
		 GROUP BY tier`,
		orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("risk distribution: %w", err)
	}
	defer riskRows.Close()
	for riskRows.Next() {
		var tier string
		var cnt int
		if err := riskRows.Scan(&tier, &cnt); err != nil {
			return nil, err
		}
		switch tier {
		case "critical":
			dash.Risk.Critical = cnt
		case "high":
			dash.Risk.High = cnt
		case "medium":
			dash.Risk.Medium = cnt
		case "low":
			dash.Risk.Low = cnt
		default:
			dash.Risk.Unknown = cnt
		}
		dash.Risk.Total += cnt
	}
	if err := riskRows.Err(); err != nil {
		return nil, err
	}

	// Compliance score from SoA
	err = s.db.Pool().QueryRow(ctx,
		`SELECT
		   COUNT(*) FILTER (WHERE status='implemented') AS impl,
		   COUNT(*) FILTER (WHERE status='partially_implemented') AS partial,
		   COUNT(*) FILTER (WHERE status='not_applicable') AS na,
		   COUNT(*) FILTER (WHERE status='not_implemented' OR status IS NULL) AS not_impl,
		   COUNT(*) AS total
		 FROM asset_controls ac
		 JOIN assets a ON a.id=ac.asset_id
		 WHERE a.org_id=$1`,
		orgID,
	).Scan(&dash.Compliance.Implemented, &dash.Compliance.PartiallyImpl,
		&dash.Compliance.NotApplicable, &dash.Compliance.NotImplemented, &dash.Compliance.Total)
	if err != nil {
		// non-fatal - table may be empty
		dash.Compliance.Total = 0
	}
	if dash.Compliance.Total > 0 {
		dash.Compliance.Score = float64(dash.Compliance.Implemented+dash.Compliance.PartiallyImpl/2) / float64(dash.Compliance.Total) * 100
	}

	// Incident trends for last 6 months
	trendRows, err := s.db.Pool().Query(ctx,
		`SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month, COUNT(*) AS cnt
		 FROM incidents
		 WHERE org_id=$1 AND created_at >= NOW() - INTERVAL '6 months'
		 GROUP BY 1 ORDER BY 1`,
		orgID,
	)
	if err == nil {
		defer trendRows.Close()
		for trendRows.Next() {
			var tr IncidentTrend
			_ = trendRows.Scan(&tr.Month, &tr.Count)
			dash.IncidentTrends = append(dash.IncidentTrends, tr)
		}
	}
	if dash.IncidentTrends == nil {
		dash.IncidentTrends = []IncidentTrend{}
	}

	// Task summary
	err = s.db.Pool().QueryRow(ctx,
		`SELECT
		   COUNT(*) FILTER (WHERE status='open') AS open,
		   COUNT(*) FILTER (WHERE status='in_progress') AS in_progress,
		   COUNT(*) FILTER (WHERE status='blocked') AS blocked,
		   COUNT(*) FILTER (WHERE status='done') AS done,
		   COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled') AND due_date < CURRENT_DATE) AS overdue
		 FROM tasks WHERE org_id=$1`,
		orgID,
	).Scan(&dash.Tasks.Open, &dash.Tasks.InProgress, &dash.Tasks.Blocked, &dash.Tasks.Done, &dash.Tasks.Overdue)
	if err != nil {
		dash.Tasks = TaskSummary{}
	}

	// Scalar counts
	_ = s.db.Pool().QueryRow(ctx, `SELECT COUNT(*) FROM agents WHERE org_id=$1 AND status='active'`, orgID).Scan(&dash.AgentCount)
	_ = s.db.Pool().QueryRow(ctx, `SELECT COUNT(*) FROM shadow_ai_findings WHERE org_id=$1 AND status='open'`, orgID).Scan(&dash.FindingCount)
	_ = s.db.Pool().QueryRow(ctx, `SELECT COUNT(*) FROM vendors WHERE org_id=$1 AND status='active'`, orgID).Scan(&dash.VendorCount)
	_ = s.db.Pool().QueryRow(ctx, `SELECT COUNT(*) FROM policies WHERE org_id=$1 AND status='approved'`, orgID).Scan(&dash.PolicyCount)

	return dash, nil
}

// AssetRiskTrend returns the risk tier history for an asset over the last N scores.
type AssetRiskPoint struct {
	ComputedAt string  `json:"computed_at"`
	Tier       string  `json:"tier"`
	Score      float64 `json:"score"`
}

func (s *AnalyticsService) AssetRiskTrend(ctx context.Context, assetID, orgID string, limit int) ([]AssetRiskPoint, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := s.db.Pool().Query(ctx,
		`SELECT computed_at::text, COALESCE(tier,'unknown'), COALESCE(score,0)
		 FROM risk_scores
		 WHERE asset_id=$1 AND org_id=$2
		 ORDER BY computed_at DESC
		 LIMIT $3`,
		assetID, orgID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("asset risk trend: %w", err)
	}
	defer rows.Close()

	var out []AssetRiskPoint
	for rows.Next() {
		var p AssetRiskPoint
		if err := rows.Scan(&p.ComputedAt, &p.Tier, &p.Score); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	if out == nil {
		out = []AssetRiskPoint{}
	}
	return out, rows.Err()
}
