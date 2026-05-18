package notify

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// WebhookPayload is the envelope sent to webhook endpoints.
type WebhookPayload struct {
	Event     string `json:"event"`
	OrgID     string `json:"org_id"`
	Timestamp int64  `json:"timestamp"`
	Data      any    `json:"data"`
}

// WebhookDelivery delivers a signed webhook payload to an endpoint.
type WebhookDelivery struct {
	pool   *pgxpool.Pool
	client *http.Client
}

// NewWebhookDelivery creates a WebhookDelivery.
func NewWebhookDelivery(pool *pgxpool.Pool) *WebhookDelivery {
	return &WebhookDelivery{
		pool:   pool,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// DeliverToOrg sends payload to all enabled webhook endpoints for the org.
func (w *WebhookDelivery) DeliverToOrg(ctx context.Context, orgID, event string, data any) {
	rows, err := w.pool.Query(ctx,
		`SELECT id, url, secret_ref FROM webhook_endpoints
		 WHERE org_id = $1 AND enabled = true AND ($2 = ANY(events) OR events = '{}')`,
		orgID, event,
	)
	if err != nil {
		return
	}
	defer rows.Close()

	type endpoint struct {
		id        string
		url       string
		secretRef string
	}
	var eps []endpoint
	for rows.Next() {
		var ep endpoint
		if err := rows.Scan(&ep.id, &ep.url, &ep.secretRef); err == nil {
			eps = append(eps, ep)
		}
	}

	for _, ep := range eps {
		// Look up signing secret
		var secret []byte
		_ = w.pool.QueryRow(ctx,
			`SELECT ciphertext FROM secrets WHERE scope = 'webhook' AND ref = $1`,
			ep.secretRef,
		).Scan(&secret)

		payload := WebhookPayload{
			Event:     event,
			OrgID:     orgID,
			Timestamp: time.Now().Unix(),
			Data:      data,
		}
		body, err := json.Marshal(payload)
		if err != nil {
			continue
		}

		sig := signHMAC(secret, body)
		status := w.post(ctx, ep.url, body, sig)
		_, _ = w.pool.Exec(ctx,
			`UPDATE webhook_endpoints SET last_status = $1 WHERE id = $2`,
			status, ep.id,
		)
	}
}

func (w *WebhookDelivery) post(ctx context.Context, url string, body []byte, sig string) string {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Sprintf("error: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Assuro-Signature", "sha256="+sig)

	resp, err := w.client.Do(req)
	if err != nil {
		return fmt.Sprintf("error: %v", err)
	}
	defer resp.Body.Close()
	return fmt.Sprintf("%d", resp.StatusCode)
}

// signHMAC returns HMAC-SHA256 hex for the body using the given secret.
func signHMAC(secret, body []byte) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifySignature verifies a webhook signature header.
func VerifySignature(secret, body []byte, sigHeader string) bool {
	expected := "sha256=" + signHMAC(secret, body)
	return hmac.Equal([]byte(sigHeader), []byte(expected))
}
