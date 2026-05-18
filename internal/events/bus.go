package events

import (
	"context"
	"sync"
)

// Event carries a domain event across the in-process bus.
type Event struct {
	Kind    string
	OrgID   string
	Payload any
}

// Handler is a function that receives an Event.
type Handler func(ctx context.Context, e Event)

// Bus is a synchronous, in-process domain event bus.
type Bus struct {
	mu       sync.RWMutex
	handlers map[string][]Handler
}

// NewBus creates an empty Bus.
func NewBus() *Bus {
	return &Bus{handlers: make(map[string][]Handler)}
}

// Subscribe registers a handler for a specific event kind.
func (b *Bus) Subscribe(kind string, h Handler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.handlers[kind] = append(b.handlers[kind], h)
}

// Publish delivers an event to all handlers subscribed for its kind.
// Handlers are called synchronously in registration order.
func (b *Bus) Publish(ctx context.Context, e Event) {
	b.mu.RLock()
	hs := b.handlers[e.Kind]
	b.mu.RUnlock()
	for _, h := range hs {
		h(ctx, e)
	}
}
