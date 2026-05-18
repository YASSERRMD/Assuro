package notify

import (
	"context"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/jobs"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NotifyInput carries the parameters for a notification.
type NotifyInput struct {
	OrgID    string
	UserIDs  []string
	Category string
	Title    string
	Body     string
	Severity string
	LinkURL  string
}

// Service writes in-app notifications and enqueues email/webhook jobs.
type Service struct {
	pool  *pgxpool.Pool
	queue jobs.Queue
}

// NewService creates a notification Service.
func NewService(pool *pgxpool.Pool, queue jobs.Queue) *Service {
	return &Service{pool: pool, queue: queue}
}

// Notify creates in-app notifications for all userIDs and enqueues email jobs
// for users who have opted in to email for the given category.
func (s *Service) Notify(ctx context.Context, in NotifyInput) error {
	if in.Severity == "" {
		in.Severity = "info"
	}

	for _, uid := range in.UserIDs {
		_, err := s.pool.Exec(ctx,
			`INSERT INTO notifications (org_id, user_id, category, title, body, severity, link_url)
			 VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7,''))`,
			in.OrgID, uid, in.Category, in.Title, in.Body, in.Severity, in.LinkURL,
		)
		if err != nil {
			return fmt.Errorf("insert notification: %w", err)
		}

		// Check email preference
		var wantsEmail bool
		_ = s.pool.QueryRow(ctx,
			`SELECT email FROM notification_prefs WHERE user_id = $1 AND category = $2`,
			uid, in.Category,
		).Scan(&wantsEmail)

		if wantsEmail {
			_, _ = s.queue.Enqueue(ctx, jobs.EnqueueParams{
				Kind: "notify.email",
				Payload: map[string]any{
					"user_id":  uid,
					"title":    in.Title,
					"body":     in.Body,
					"link_url": in.LinkURL,
				},
			})
		}
	}
	return nil
}

// Pool exposes the underlying pool for handler-level queries.
func (s *Service) Pool() *pgxpool.Pool { return s.pool }

// MarkRead marks a notification as read.
func (s *Service) MarkRead(ctx context.Context, notificationID, userID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2`,
		notificationID, userID,
	)
	return err
}

// ListForUser returns unread notifications for a user.
func (s *Service) ListForUser(ctx context.Context, userID string, limit int) ([]Notification, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := s.pool.Query(ctx,
		`SELECT id, org_id, user_id, category, title, body, severity,
		        COALESCE(link_url, ''), read_at::text, created_at::text
		 FROM notifications WHERE user_id = $1
		 ORDER BY created_at DESC LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.OrgID, &n.UserID, &n.Category,
			&n.Title, &n.Body, &n.Severity, &n.LinkURL, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

// Notification represents a stored in-app notification.
type Notification struct {
	ID        string  `json:"id"`
	OrgID     string  `json:"org_id"`
	UserID    string  `json:"user_id"`
	Category  string  `json:"category"`
	Title     string  `json:"title"`
	Body      string  `json:"body"`
	Severity  string  `json:"severity"`
	LinkURL   string  `json:"link_url,omitempty"`
	ReadAt    *string `json:"read_at,omitempty"`
	CreatedAt string  `json:"created_at"`
}
