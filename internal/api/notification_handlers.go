package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/notify"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// NotificationHandler handles notification and webhook endpoints.
type NotificationHandler struct {
	svc    *notify.Service
	logger *zap.Logger
}

// NewNotificationHandler creates a NotificationHandler.
func NewNotificationHandler(svc *notify.Service, logger *zap.Logger) *NotificationHandler {
	return &NotificationHandler{svc: svc, logger: logger}
}

// ListNotifications handles GET /v1/notifications.
func (h *NotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	items, err := h.svc.ListForUser(r.Context(), p.UserID, 0)
	if err != nil {
		h.logger.Error("list notifications", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list notifications")
		return
	}
	if items == nil {
		items = []notify.Notification{}
	}
	writeJSON(w, http.StatusOK, items)
}

// MarkRead handles POST /v1/notifications/{id}/read.
func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.MarkRead(r.Context(), id, p.UserID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to mark read")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// CreateWebhook handles POST /v1/webhooks.
func (h *NotificationHandler) CreateWebhook(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var req struct {
		URL    string   `json:"url"`
		Events []string `json:"events"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.URL == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "url is required")
		return
	}
	// Use org_id from principal; secret_ref is the webhook id (set after insert)
	var id string
	err := h.svc.Pool().QueryRow(r.Context(),
		`INSERT INTO webhook_endpoints (org_id, url, secret_ref, events)
		 VALUES ($1, $2, '', $3) RETURNING id`,
		p.OrgID, req.URL, req.Events,
	).Scan(&id)
	if err != nil {
		h.logger.Error("create webhook", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create webhook")
		return
	}
	// Update secret_ref to the id itself
	_, _ = h.svc.Pool().Exec(r.Context(),
		`UPDATE webhook_endpoints SET secret_ref = $1 WHERE id = $1`, id)
	writeJSON(w, http.StatusCreated, map[string]string{"id": id, "url": req.URL})
}

// ListWebhooks handles GET /v1/webhooks.
func (h *NotificationHandler) ListWebhooks(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	rows, err := h.svc.Pool().Query(r.Context(),
		`SELECT id, url, events, enabled, last_status, created_at
		 FROM webhook_endpoints WHERE org_id = $1 ORDER BY created_at DESC`,
		p.OrgID,
	)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list webhooks")
		return
	}
	defer rows.Close()
	type row struct {
		ID         string   `json:"id"`
		URL        string   `json:"url"`
		Events     []string `json:"events"`
		Enabled    bool     `json:"enabled"`
		LastStatus *string  `json:"last_status,omitempty"`
		CreatedAt  string   `json:"created_at"`
	}
	var out []row
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.ID, &r.URL, &r.Events, &r.Enabled, &r.LastStatus, &r.CreatedAt); err == nil {
			out = append(out, r)
		}
	}
	if out == nil {
		out = []row{}
	}
	writeJSON(w, http.StatusOK, out)
}

// DeleteWebhook handles DELETE /v1/webhooks/{id}.
func (h *NotificationHandler) DeleteWebhook(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	id := chi.URLParam(r, "id")
	_, err := h.svc.Pool().Exec(r.Context(),
		`DELETE FROM webhook_endpoints WHERE id = $1 AND org_id = $2`, id, p.OrgID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to delete webhook")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// WebhookDeliveryLogs handles GET /v1/webhooks/{id}/deliveries.
func (h *NotificationHandler) WebhookDeliveryLogs(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	d := notify.NewWebhookDispatcher(h.svc.Pool())
	logs, err := d.ListDeliveryLogs(r.Context(), chi.URLParam(r, "id"), p.OrgID, intQuery(r, "limit", 50))
	if err != nil {
		h.logger.Error("webhook delivery logs", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list delivery logs")
		return
	}
	writeJSON(w, http.StatusOK, logs)
}

// MarkAllRead handles POST /v1/notifications/read-all.
func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	_, err := h.svc.Pool().Exec(r.Context(),
		`UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL`,
		p.UserID,
	)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to mark all read")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UnreadCount handles GET /v1/notifications/unread-count.
func (h *NotificationHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var count int
	_ = h.svc.Pool().QueryRow(r.Context(),
		`SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read_at IS NULL`,
		p.UserID,
	).Scan(&count)
	writeJSON(w, http.StatusOK, map[string]int{"unread": count})
}

// GetPreferences handles GET /v1/notifications/preferences.
func (h *NotificationHandler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	rows, err := h.svc.Pool().Query(r.Context(),
		`SELECT category, in_app, email FROM notification_prefs WHERE user_id=$1 ORDER BY category`,
		p.UserID,
	)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to get preferences")
		return
	}
	defer rows.Close()
	type pref struct {
		Category string `json:"category"`
		InApp    bool   `json:"in_app"`
		Email    bool   `json:"email"`
	}
	var out []pref
	for rows.Next() {
		var pr pref
		if err := rows.Scan(&pr.Category, &pr.InApp, &pr.Email); err == nil {
			out = append(out, pr)
		}
	}
	if out == nil {
		out = []pref{}
	}
	writeJSON(w, http.StatusOK, out)
}

// SetPreferences handles PUT /v1/notifications/preferences.
func (h *NotificationHandler) SetPreferences(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	var prefs []struct {
		Category string `json:"category"`
		InApp    bool   `json:"in_app"`
		Email    bool   `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&prefs); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid preferences payload")
		return
	}
	for _, pr := range prefs {
		_, err := h.svc.Pool().Exec(r.Context(),
			`INSERT INTO notification_prefs (user_id, category, in_app, email)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (user_id, category) DO UPDATE SET in_app=$3, email=$4`,
			p.UserID, pr.Category, pr.InApp, pr.Email,
		)
		if err != nil {
			WriteError(w, http.StatusInternalServerError, "internal_error", "failed to save preferences")
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}
