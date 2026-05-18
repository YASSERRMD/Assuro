package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// VertexConnector discovers models deployed on Google Cloud Vertex AI.
type VertexConnector struct{}

type vertexConfig struct {
	ProjectID   string `json:"project_id"`
	Location    string `json:"location"`
	AccessToken string `json:"access_token"`
}

func (v *VertexConnector) Type() string { return "gcp_vertex" }

func (v *VertexConnector) Scan(ctx context.Context, raw json.RawMessage) (*ScanResult, error) {
	var cfg vertexConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("vertex: invalid config: %w", err)
	}
	if cfg.Location == "" {
		cfg.Location = "us-central1"
	}

	if cfg.ProjectID == "" || cfg.AccessToken == "" {
		return &ScanResult{
			ConnectorType: v.Type(),
			Models:        vertexStaticModels(cfg.Location),
			RawCount:      len(vertexStaticModels(cfg.Location)),
		}, nil
	}

	url := fmt.Sprintf(
		"https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/models",
		cfg.Location, cfg.ProjectID, cfg.Location,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("vertex: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+cfg.AccessToken)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return &ScanResult{
			ConnectorType: v.Type(),
			Models:        vertexStaticModels(cfg.Location),
			RawCount:      len(vertexStaticModels(cfg.Location)),
		}, nil
	}
	defer resp.Body.Close()

	var payload struct {
		Models []struct {
			Name        string `json:"name"`
			DisplayName string `json:"displayName"`
		} `json:"models"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("vertex: decode response: %w", err)
	}

	models := make([]DiscoveredModel, 0, len(payload.Models))
	for _, m := range payload.Models {
		models = append(models, DiscoveredModel{
			ProviderID: m.Name,
			Name:       m.DisplayName,
			ModelType:  "vertex_model",
			Region:     cfg.Location,
		})
	}
	return &ScanResult{ConnectorType: v.Type(), Models: models, RawCount: len(models)}, nil
}

func vertexStaticModels(location string) []DiscoveredModel {
	return []DiscoveredModel{
		{ProviderID: "gemini-1.5-pro", Name: "Gemini 1.5 Pro", ModelType: "foundation", Region: location},
		{ProviderID: "gemini-1.5-flash", Name: "Gemini 1.5 Flash", ModelType: "foundation", Region: location},
		{ProviderID: "text-bison@002", Name: "PaLM 2 Text Bison", ModelType: "foundation", Region: location},
	}
}
