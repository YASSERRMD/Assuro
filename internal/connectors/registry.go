package connectors

import (
	"context"
	"encoding/json"
	"fmt"
)

// Registry holds all registered cloud connectors by type.
type Registry struct {
	connectors map[string]CloudConnector
}

// NewRegistry creates a Registry with all built-in connectors.
func NewRegistry() *Registry {
	r := &Registry{connectors: make(map[string]CloudConnector)}
	r.Register(&BedrockConnector{})
	r.Register(&AzureAIConnector{})
	r.Register(&VertexConnector{})
	r.Register(&GitHubConnector{})
	r.Register(&HuggingFaceConnector{})
	return r
}

// Register adds a connector to the registry.
func (r *Registry) Register(c CloudConnector) {
	r.connectors[c.Type()] = c
}

// Scan runs a scan for the given connector type.
func (r *Registry) Scan(ctx context.Context, connType string, cfg json.RawMessage) (*ScanResult, error) {
	c, ok := r.connectors[connType]
	if !ok {
		return nil, fmt.Errorf("unknown connector type: %s", connType)
	}
	return c.Scan(ctx, cfg)
}

// Types returns all registered connector type names.
func (r *Registry) Types() []string {
	out := make([]string, 0, len(r.connectors))
	for t := range r.connectors {
		out = append(out, t)
	}
	return out
}
