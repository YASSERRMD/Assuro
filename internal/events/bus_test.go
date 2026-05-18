package events

import (
	"context"
	"testing"
)

func TestBusPublishDelivers(t *testing.T) {
	b := NewBus()
	var received []Event

	b.Subscribe("risk.computed", func(_ context.Context, e Event) {
		received = append(received, e)
	})

	b.Publish(context.Background(), Event{Kind: "risk.computed", OrgID: "org1"})
	b.Publish(context.Background(), Event{Kind: "risk.computed", OrgID: "org2"})

	if len(received) != 2 {
		t.Fatalf("expected 2 events, got %d", len(received))
	}
}

func TestBusPublishNoHandlerIsNoop(t *testing.T) {
	b := NewBus()
	b.Publish(context.Background(), Event{Kind: "no.handler"})
}

func TestBusMultipleSubscribers(t *testing.T) {
	b := NewBus()
	count := 0
	b.Subscribe("ev", func(_ context.Context, _ Event) { count++ })
	b.Subscribe("ev", func(_ context.Context, _ Event) { count++ })
	b.Publish(context.Background(), Event{Kind: "ev"})
	if count != 2 {
		t.Errorf("expected 2 calls, got %d", count)
	}
}
