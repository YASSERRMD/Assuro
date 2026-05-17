package api

import (
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/store"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// StatsHandler handles dashboard statistics requests.
type StatsHandler struct {
	db     *store.DB
	logger *zap.Logger
}

// NewStatsHandler creates a new stats handler.
func NewStatsHandler(db *store.DB, logger *zap.Logger) *StatsHandler {
	return &StatsHandler{db: db, logger: logger}
}

// DashboardStats holds aggregated counts for the dashboard.
type DashboardStats struct {
	TotalAISystems       int64            `json:"total_ai_systems"`
	ByRiskTier           map[string]int64 `json:"by_risk_tier"`
	OpenIncidents        int64            `json:"open_incidents"`
	CompletedAssessments int64            `json:"completed_assessments"`
	FrameworkCoverage    []CoverageItem   `json:"framework_coverage"`
}

// CoverageItem holds coverage percentage for one framework.
type CoverageItem struct {
	FrameworkKey string  `json:"framework_key"`
	CoveragePct  float64 `json:"coverage_pct"`
}

// Get handles GET /v1/stats.
func (h *StatsHandler) Get(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	orgID, err := uuid.Parse(p.OrgID)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid org id")
		return
	}

	ctx := r.Context()
	pool := h.db.Pool()

	stats := DashboardStats{
		ByRiskTier: make(map[string]int64),
	}

	// Count AI systems
	pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM assets WHERE org_id = $1 AND asset_type = 'ai_system' AND lifecycle_status != 'archived'`,
		orgID,
	).Scan(&stats.TotalAISystems)

	// Count by risk tier from latest risk assessments
	rows, err := pool.Query(ctx, `
		SELECT ra.tier, COUNT(*) as cnt
		FROM risk_assessments ra
		JOIN assets a ON a.id = ra.asset_id
		WHERE a.org_id = $1 AND a.lifecycle_status != 'archived'
		  AND ra.computed_at = (
		      SELECT MAX(ra2.computed_at) FROM risk_assessments ra2
		      WHERE ra2.asset_id = ra.asset_id
		  )
		GROUP BY ra.tier
	`, orgID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var tier string
			var cnt int64
			rows.Scan(&tier, &cnt)
			stats.ByRiskTier[tier] = cnt
		}
	}

	// Count open incidents
	pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM incidents WHERE org_id = $1 AND status NOT IN ('closed', 'mitigated')`,
		orgID,
	).Scan(&stats.OpenIncidents)

	// Count completed assessments
	pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM assessments WHERE org_id = $1 AND status = 'completed'`,
		orgID,
	).Scan(&stats.CompletedAssessments)

	// Framework coverage: percent of controls that are 'implemented' per framework
	coverageRows, err := pool.Query(ctx, `
		SELECT f.key,
		       ROUND(100.0 * SUM(CASE WHEN acs.status = 'implemented' THEN 1 ELSE 0 END) /
		             NULLIF(COUNT(*), 0), 1) AS coverage_pct
		FROM frameworks f
		JOIN framework_requirements fr ON fr.framework_id = f.id
		JOIN control_requirement_map crm ON crm.requirement_id = fr.id
		JOIN controls c ON c.id = crm.control_id
		LEFT JOIN asset_control_status acs
		       ON acs.control_id = c.id
		      AND acs.asset_id IN (
		          SELECT id FROM assets
		          WHERE org_id = $1 AND asset_type = 'ai_system' AND lifecycle_status != 'archived'
		      )
		GROUP BY f.key
		ORDER BY f.key
	`, orgID)
	if err == nil {
		defer coverageRows.Close()
		for coverageRows.Next() {
			var key string
			var pct float64
			coverageRows.Scan(&key, &pct)
			stats.FrameworkCoverage = append(stats.FrameworkCoverage, CoverageItem{
				FrameworkKey: key,
				CoveragePct:  pct,
			})
		}
	}

	if stats.FrameworkCoverage == nil {
		stats.FrameworkCoverage = []CoverageItem{}
	}

	writeJSON(w, http.StatusOK, stats)
}
