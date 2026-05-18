package api

import (
	"net/http"
	"strconv"

	"github.com/YASSERRMD/Assuro/internal/aiassist"
	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// AIAssistHandler exposes AI-assist status and usage endpoints.
type AIAssistHandler struct {
	provider aiassist.Provider
	pool     *pgxpool.Pool
	logger   *zap.Logger
}

// NewAIAssistHandler creates an AIAssistHandler.
func NewAIAssistHandler(p aiassist.Provider, pool *pgxpool.Pool, logger *zap.Logger) *AIAssistHandler {
	return &AIAssistHandler{provider: p, pool: pool, logger: logger}
}

// Status handles GET /v1/ai-assist/status.
func (h *AIAssistHandler) Status(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.provider.Capabilities())
}

// Usage handles GET /v1/ai-assist/usage (admin only).
func (h *AIAssistHandler) Usage(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 100
	}

	rows, err := h.pool.Query(r.Context(),
		`SELECT id, task, provider, model, tokens_in, tokens_out,
		        latency_ms, used_fallback, created_at
		 FROM ai_usage_log WHERE org_id = $1
		 ORDER BY created_at DESC LIMIT $2`,
		p.OrgID, limit,
	)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to query usage")
		return
	}
	defer rows.Close()

	type row struct {
		ID           string `json:"id"`
		Task         string `json:"task"`
		Provider     string `json:"provider"`
		Model        string `json:"model"`
		TokensIn     int    `json:"tokens_in"`
		TokensOut    int    `json:"tokens_out"`
		LatencyMs    int    `json:"latency_ms"`
		UsedFallback bool   `json:"used_fallback"`
		CreatedAt    string `json:"created_at"`
	}
	var out []row
	for rows.Next() {
		var rec row
		if err := rows.Scan(&rec.ID, &rec.Task, &rec.Provider, &rec.Model,
			&rec.TokensIn, &rec.TokensOut, &rec.LatencyMs, &rec.UsedFallback, &rec.CreatedAt); err == nil {
			out = append(out, rec)
		}
	}
	if out == nil {
		out = []row{}
	}
	writeJSON(w, http.StatusOK, out)
}
