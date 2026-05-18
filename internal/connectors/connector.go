package connectors

import (
	"context"
	"encoding/json"
)

// DiscoveredModel is a model found by a connector scan.
type DiscoveredModel struct {
	ProviderID  string          `json:"provider_id"`
	Name        string          `json:"name"`
	ModelType   string          `json:"model_type"`
	Region      string          `json:"region,omitempty"`
	Metadata    json.RawMessage `json:"metadata,omitempty"`
}

// ScanResult holds the outcome of a connector scan.
type ScanResult struct {
	ConnectorType string            `json:"connector_type"`
	Models        []DiscoveredModel `json:"models"`
	RawCount      int               `json:"raw_count"`
	Error         string            `json:"error,omitempty"`
}

// CloudConnector scans a cloud AI platform for deployed models.
type CloudConnector interface {
	Type() string
	Scan(ctx context.Context, cfg json.RawMessage) (*ScanResult, error)
}
