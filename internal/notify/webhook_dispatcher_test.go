package notify

import (
	"encoding/json"
	"testing"
)

func TestWebhookEventSerialization(t *testing.T) {
	e := WebhookEvent{
		EventType:  "asset.created",
		OccurredAt: "2024-01-01T00:00:00Z",
		OrgID:      "org-1",
		Data:       map[string]any{"id": "asset-1"},
	}
	b, err := json.Marshal(e)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	var out WebhookEvent
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if out.EventType != e.EventType {
		t.Errorf("event type mismatch: %s != %s", out.EventType, e.EventType)
	}
}

func TestDeliveryLogNilSafety(t *testing.T) {
	l := DeliveryLog{
		ID:         "dl-1",
		EndpointID: "ep-1",
		EventType:  "asset.created",
	}
	if l.HTTPStatus != nil {
		t.Error("http status should be nil by default")
	}
	if l.Error != nil {
		t.Error("error should be nil by default")
	}
}
