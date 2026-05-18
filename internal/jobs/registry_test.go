package jobs

import (
	"context"
	"encoding/json"
	"testing"
)

func TestRegistry_RegisterAndGet(t *testing.T) {
	r := NewRegistry()

	called := false
	r.Register("test.ping", func(ctx context.Context, payload json.RawMessage) error {
		called = true
		return nil
	})

	h, ok := r.Get("test.ping")
	if !ok {
		t.Fatal("expected handler to be registered")
	}
	if err := h(context.Background(), json.RawMessage(`{}`)); err != nil {
		t.Fatalf("handler returned error: %v", err)
	}
	if !called {
		t.Error("handler was not called")
	}
}

func TestRegistry_GetMissing(t *testing.T) {
	r := NewRegistry()
	_, ok := r.Get("nonexistent.kind")
	if ok {
		t.Error("expected false for unregistered kind")
	}
}

func TestRegistry_DuplicatePanics(t *testing.T) {
	r := NewRegistry()
	r.Register("kind.a", func(_ context.Context, _ json.RawMessage) error { return nil })

	defer func() {
		if rec := recover(); rec == nil {
			t.Error("expected panic on duplicate registration")
		}
	}()
	r.Register("kind.a", func(_ context.Context, _ json.RawMessage) error { return nil })
}

func TestRegistry_Kinds(t *testing.T) {
	r := NewRegistry()
	r.Register("k1", func(_ context.Context, _ json.RawMessage) error { return nil })
	r.Register("k2", func(_ context.Context, _ json.RawMessage) error { return nil })

	kinds := r.Kinds()
	if len(kinds) != 2 {
		t.Fatalf("expected 2 kinds, got %d", len(kinds))
	}
}
