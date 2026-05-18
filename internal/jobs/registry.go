package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
)

// Handler is a function that processes a single job payload.
type Handler func(ctx context.Context, payload json.RawMessage) error

// Registry maps job kinds to their handlers.
type Registry struct {
	mu       sync.RWMutex
	handlers map[string]Handler
}

// NewRegistry creates an empty Registry.
func NewRegistry() *Registry {
	return &Registry{handlers: make(map[string]Handler)}
}

// Register associates a kind with a handler. Panics on duplicate registration.
func (r *Registry) Register(kind string, h Handler) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.handlers[kind]; exists {
		panic(fmt.Sprintf("jobs: handler already registered for kind %q", kind))
	}
	r.handlers[kind] = h
}

// Get returns the handler for a kind.
func (r *Registry) Get(kind string) (Handler, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	h, ok := r.handlers[kind]
	return h, ok
}

// Kinds returns all registered job kinds.
func (r *Registry) Kinds() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	kinds := make([]string, 0, len(r.handlers))
	for k := range r.handlers {
		kinds = append(kinds, k)
	}
	return kinds
}
