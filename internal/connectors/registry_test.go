package connectors

import (
	"context"
	"encoding/json"
	"testing"
)

func TestRegistryTypes(t *testing.T) {
	r := NewRegistry()
	types := r.Types()
	want := map[string]bool{"aws_bedrock": true, "azure_ai": true, "gcp_vertex": true}
	for _, tp := range types {
		if !want[tp] {
			t.Errorf("unexpected type: %s", tp)
		}
		delete(want, tp)
	}
	for missing := range want {
		t.Errorf("missing connector type: %s", missing)
	}
}

func TestBedrockFallback(t *testing.T) {
	c := &BedrockConnector{}
	result, err := c.Scan(context.Background(), json.RawMessage(`{"region":"us-east-1"}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.ConnectorType != "aws_bedrock" {
		t.Errorf("wrong type: %s", result.ConnectorType)
	}
	if len(result.Models) == 0 {
		t.Error("expected at least one model in fallback")
	}
}

func TestAzureFallback(t *testing.T) {
	c := &AzureAIConnector{}
	result, err := c.Scan(context.Background(), json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Models) == 0 {
		t.Error("expected at least one model in fallback")
	}
}

func TestVertexFallback(t *testing.T) {
	c := &VertexConnector{}
	result, err := c.Scan(context.Background(), json.RawMessage(`{"location":"us-central1"}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Models) == 0 {
		t.Error("expected at least one model in fallback")
	}
}

func TestScanUnknownType(t *testing.T) {
	r := NewRegistry()
	_, err := r.Scan(context.Background(), "unknown_type", json.RawMessage(`{}`))
	if err == nil {
		t.Error("expected error for unknown type")
	}
}
