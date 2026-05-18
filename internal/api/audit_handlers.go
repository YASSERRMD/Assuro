package api

import (
	"net/http"
	"time"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// AuditHandler handles audit log HTTP requests.
type AuditHandler struct {
	svc    *service.AuditService
	logger *zap.Logger
}

// NewAuditHandler creates a new audit handler.
func NewAuditHandler(svc *service.AuditService, logger *zap.Logger) *AuditHandler {
	return &AuditHandler{svc: svc, logger: logger}
}

// List handles GET /v1/audit-log with optional filters:
//
//	?action=asset.created&target_type=asset&target_id=<uuid>
//	&actor_id=<uuid>&since=2006-01-02&until=2006-01-02&limit=50&offset=0
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

	f := service.AuditFilter{
		Action:     r.URL.Query().Get("action"),
		TargetType: r.URL.Query().Get("target_type"),
		TargetID:   r.URL.Query().Get("target_id"),
		ActorID:    r.URL.Query().Get("actor_id"),
		Limit:      intQuery(r, "limit", 50),
		Offset:     intQuery(r, "offset", 0),
	}
	if s := r.URL.Query().Get("since"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			f.Since = &t
		}
	}
	if u := r.URL.Query().Get("until"); u != "" {
		if t, err := time.Parse("2006-01-02", u); err == nil {
			end := t.Add(24*time.Hour - time.Second)
			f.Until = &end
		}
	}

	entries, err := h.svc.List(r.Context(), p.OrgID, f)
	if err != nil {
		h.logger.Error("list audit log", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list audit log")
		return
	}
	writeJSON(w, http.StatusOK, entries)
}

// Export handles GET /v1/audit-log/export — streams CSV.
func (h *AuditHandler) Export(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}

	f := service.AuditFilter{
		Action:     r.URL.Query().Get("action"),
		TargetType: r.URL.Query().Get("target_type"),
		TargetID:   r.URL.Query().Get("target_id"),
		ActorID:    r.URL.Query().Get("actor_id"),
	}
	if s := r.URL.Query().Get("since"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			f.Since = &t
		}
	}
	if u := r.URL.Query().Get("until"); u != "" {
		if t, err := time.Parse("2006-01-02", u); err == nil {
			end := t.Add(24*time.Hour - time.Second)
			f.Until = &end
		}
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="audit-log.csv"`)
	if err := h.svc.ExportCSV(r.Context(), p.OrgID, f, w); err != nil {
		h.logger.Error("export audit log", zap.Error(err))
	}
}

// Actions handles GET /v1/audit-log/actions — returns the list of known event actions.
func (h *AuditHandler) Actions(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, service.KnownActions())
}
