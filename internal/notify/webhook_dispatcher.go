package notify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// WebhookDispatcher delivers event payloads to registered webhook endpoints.
type WebhookDispatcher struct {
	pool   *pgxpool.Pool
	client *http.Client
}

// NewWebhookDispatcher creates a WebhookDispatcher.
func NewWebhookDispatcher(pool *pgxpool.Pool) *WebhookDispatcher {
	return &WebhookDispatcher{
		pool:   pool,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// WebhookEvent is the payload posted to a webhook endpoint.
type WebhookEvent struct {
	EventType string         `json:"event_type"`
	OccurredAt string        `json:"occurred_at"`
	OrgID     string         `json:"org_id"`
	Data      map[string]any `json:"data"`
}

// Dispatch sends an event to all matching enabled webhook endpoints for an org.
func (d *WebhookDispatcher) Dispatch(ctx context.Context, orgID, eventType string, data map[string]any) {
	rows, err := d.pool.Query(ctx,
		`SELECT id::text, url FROM webhook_endpoints
		 WHERE org_id=$1::uuid AND enabled=true
		   AND (events='{}' OR $2=ANY(events))`,
		orgID, eventType,
	)
	if err != nil {
		return
	}
	defer rows.Close()

	event := WebhookEvent{
		EventType:  eventType,
		OccurredAt: time.Now().UTC().Format(time.RFC3339),
		OrgID:      orgID,
		Data:       data,
	}
	payload, _ := json.Marshal(event)

	for rows.Next() {
		var endpointID, url string
		if err := rows.Scan(&endpointID, &url); err != nil {
			continue
		}
		go d.deliver(orgID, endpointID, url, eventType, payload)
	}
}

func (d *WebhookDispatcher) deliver(orgID, endpointID, url, eventType string, payload []byte) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		d.logDelivery(ctx, endpointID, eventType, payload, 0, err.Error())
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Assuro-Event", eventType)

	resp, err := d.client.Do(req)
	if err != nil {
		d.logDelivery(ctx, endpointID, eventType, payload, 0, err.Error())
		d.updateStatus(ctx, endpointID, "error")
		return
	}
	resp.Body.Close()

	status := fmt.Sprintf("%d", resp.StatusCode)
	errMsg := ""
	if resp.StatusCode >= 400 {
		errMsg = fmt.Sprintf("HTTP %d", resp.StatusCode)
	}
	d.logDelivery(ctx, endpointID, eventType, payload, resp.StatusCode, errMsg)
	d.updateStatus(ctx, endpointID, status)
}

func (d *WebhookDispatcher) logDelivery(ctx context.Context, endpointID, eventType string, payload []byte, status int, errMsg string) {
	var statusPtr *int
	if status > 0 {
		statusPtr = &status
	}
	var errPtr *string
	if errMsg != "" {
		errPtr = &errMsg
	}
	_, _ = d.pool.Exec(ctx,
		`INSERT INTO webhook_delivery_logs (endpoint_id, event_type, payload, http_status, error)
		 VALUES ($1::uuid, $2, $3, $4, $5)`,
		endpointID, eventType, payload, statusPtr, errPtr,
	)
}

func (d *WebhookDispatcher) updateStatus(ctx context.Context, endpointID, status string) {
	_, _ = d.pool.Exec(ctx,
		`UPDATE webhook_endpoints SET last_status=$1 WHERE id=$2::uuid`,
		status, endpointID,
	)
}

// DeliveryLog is a record of a webhook delivery attempt.
type DeliveryLog struct {
	ID          string  `json:"id"`
	EndpointID  string  `json:"endpoint_id"`
	EventType   string  `json:"event_type"`
	HTTPStatus  *int    `json:"http_status,omitempty"`
	Error       *string `json:"error,omitempty"`
	DeliveredAt string  `json:"delivered_at"`
}

// ListDeliveryLogs returns recent delivery logs for a webhook endpoint.
func (d *WebhookDispatcher) ListDeliveryLogs(ctx context.Context, endpointID, orgID string, limit int) ([]DeliveryLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := d.pool.Query(ctx,
		`SELECT wdl.id::text, wdl.endpoint_id::text, wdl.event_type,
		        wdl.http_status, wdl.error, wdl.delivered_at::text
		 FROM webhook_delivery_logs wdl
		 JOIN webhook_endpoints we ON we.id=wdl.endpoint_id
		 WHERE wdl.endpoint_id=$1::uuid AND we.org_id=$2::uuid
		 ORDER BY wdl.delivered_at DESC LIMIT $3`,
		endpointID, orgID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("list delivery logs: %w", err)
	}
	defer rows.Close()
	var out []DeliveryLog
	for rows.Next() {
		var l DeliveryLog
		if err := rows.Scan(&l.ID, &l.EndpointID, &l.EventType, &l.HTTPStatus, &l.Error, &l.DeliveredAt); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	if out == nil {
		out = []DeliveryLog{}
	}
	return out, rows.Err()
}
