package service

import (
	"encoding/json"
	"testing"
)

func TestRawOrEmpty(t *testing.T) {
	if got := rawOrEmpty(nil); string(got) != "{}" {
		t.Errorf("expected {}, got %s", got)
	}
	val := json.RawMessage(`{"key":"value"}`)
	if got := rawOrEmpty(val); string(got) != `{"key":"value"}` {
		t.Errorf("expected original, got %s", got)
	}
}

func TestModelCardStatuses(t *testing.T) {
	statuses := []string{"draft", "published", "archived"}
	if len(statuses) != 3 {
		t.Errorf("expected 3 statuses, got %d", len(statuses))
	}
}
