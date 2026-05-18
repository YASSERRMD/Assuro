package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// AuditEvent is a structured audit log entry.
type AuditEvent struct {
	ID          string          `json:"id"`
	OrgID       string          `json:"org_id"`
	ActorUserID string          `json:"actor_user_id"`
	Action      string          `json:"action"`
	TargetType  string          `json:"target_type"`
	TargetID    string          `json:"target_id"`
	Payload     json.RawMessage `json:"payload,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
}

// AuditFilter holds optional filter parameters for listing audit events.
type AuditFilter struct {
	Action     string
	TargetType string
	TargetID   string
	ActorID    string
	Since      *time.Time
	Until      *time.Time
	Limit      int
	Offset     int
}

// AuditService provides audit log query capabilities.
type AuditService struct {
	db *store.DB
}

// NewAuditService creates an AuditService.
func NewAuditService(db *store.DB) *AuditService {
	return &AuditService{db: db}
}

// List returns audit events matching the filter for an org.
func (s *AuditService) List(ctx context.Context, orgID string, f AuditFilter) ([]AuditEvent, error) {
	if f.Limit <= 0 || f.Limit > 500 {
		f.Limit = 50
	}

	args := []any{orgID}
	where := "WHERE org_id=$1"
	n := 2

	if f.Action != "" {
		where += fmt.Sprintf(" AND action=$%d", n)
		args = append(args, f.Action)
		n++
	}
	if f.TargetType != "" {
		where += fmt.Sprintf(" AND target_type=$%d", n)
		args = append(args, f.TargetType)
		n++
	}
	if f.TargetID != "" {
		where += fmt.Sprintf(" AND target_id=$%d::uuid", n)
		args = append(args, f.TargetID)
		n++
	}
	if f.ActorID != "" {
		where += fmt.Sprintf(" AND actor_user_id=$%d::uuid", n)
		args = append(args, f.ActorID)
		n++
	}
	if f.Since != nil {
		where += fmt.Sprintf(" AND created_at>=$%d", n)
		args = append(args, *f.Since)
		n++
	}
	if f.Until != nil {
		where += fmt.Sprintf(" AND created_at<=$%d", n)
		args = append(args, *f.Until)
		n++
	}

	query := fmt.Sprintf(
		`SELECT id::text, org_id::text, actor_user_id::text, action, target_type,
		        target_id::text, payload, created_at
		 FROM audit_log %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		where, n, n+1,
	)
	args = append(args, f.Limit, f.Offset)

	rows, err := s.db.Pool().Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list audit: %w", err)
	}
	defer rows.Close()

	var out []AuditEvent
	for rows.Next() {
		var e AuditEvent
		var payload []byte
		if err := rows.Scan(&e.ID, &e.OrgID, &e.ActorUserID, &e.Action,
			&e.TargetType, &e.TargetID, &payload, &e.CreatedAt); err != nil {
			return nil, err
		}
		if len(payload) > 0 {
			e.Payload = json.RawMessage(payload)
		}
		out = append(out, e)
	}
	if out == nil {
		out = []AuditEvent{}
	}
	return out, rows.Err()
}

// ExportCSV writes audit events as CSV to w.
func (s *AuditService) ExportCSV(ctx context.Context, orgID string, f AuditFilter, w io.Writer) error {
	f.Limit = 500
	f.Offset = 0
	events, err := s.List(ctx, orgID, f)
	if err != nil {
		return err
	}

	cw := csv.NewWriter(w)
	_ = cw.Write([]string{"id", "created_at", "actor_user_id", "action", "target_type", "target_id"})
	for _, e := range events {
		_ = cw.Write([]string{
			e.ID,
			e.CreatedAt.UTC().Format(time.RFC3339),
			e.ActorUserID,
			e.Action,
			e.TargetType,
			e.TargetID,
		})
	}
	cw.Flush()
	return cw.Error()
}

// KnownActions returns the canonical action strings used throughout the system.
func KnownActions() []string {
	return []string{
		"asset.created", "asset.updated", "asset.deleted",
		"risk.computed", "risk.accepted",
		"incident.created", "incident.updated", "incident.resolved",
		"policy.created", "policy.approved", "policy.archived",
		"vendor.created", "vendor.assessed",
		"agent.registered", "agent.suspended",
		"approval.requested", "approval.decided",
		"task.created", "task.status_changed", "task.assigned",
		"user.invited", "user.role_changed",
	}
}
