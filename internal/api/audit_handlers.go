package api

import (
	"net/http"
	"strconv"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"go.uber.org/zap"
)

// AuditHandler handles audit log HTTP requests.
type AuditHandler struct {
	logger *zap.Logger
}

// NewAuditHandler creates a new audit handler.
func NewAuditHandler(logger *zap.Logger) *AuditHandler {
	return &AuditHandler{logger: logger}
}

// List handles GET /v1/audit-log.
func (h *AuditHandler) List(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}

	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 50
	}

	writeJSON(w, http.StatusOK, []any{})
}
