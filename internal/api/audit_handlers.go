package api

import (
	"net/http"
	"strconv"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"
)

// AuditHandler handles audit log HTTP requests.
type AuditHandler struct {
	db     *store.DB
	logger *zap.Logger
}

// NewAuditHandler creates a new audit handler.
func NewAuditHandler(db *store.DB, logger *zap.Logger) *AuditHandler {
	return &AuditHandler{db: db, logger: logger}
}

// List handles GET /v1/audit-log (owner/admin only).
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
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	queries := qgen.New(h.db.Pool())
	entries, err := queries.ListAuditLogsByOrg(r.Context(), qgen.ListAuditLogsByOrgParams{
		OrgID:  auditParseUUID(p.OrgID),
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		h.logger.Error("list audit log failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list audit log")
		return
	}

	writeJSON(w, http.StatusOK, entries)
}

// auditParseUUID converts a string UUID to pgtype.UUID.
func auditParseUUID(s string) pgtype.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}
	}
	var bytes [16]byte
	copy(bytes[:], id[:])
	return pgtype.UUID{Bytes: bytes, Valid: true}
}
