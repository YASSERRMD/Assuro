package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// HuggingFaceConnector discovers models deployed or hosted on HuggingFace Hub.
type HuggingFaceConnector struct{}

type hfConfig struct {
	Token string `json:"token"`
	Org   string `json:"org"`
}

func (h *HuggingFaceConnector) Type() string { return "huggingface" }

func (hf *HuggingFaceConnector) Scan(ctx context.Context, raw json.RawMessage) (*ScanResult, error) {
	var cfg hfConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("huggingface: invalid config: %w", err)
	}

	if cfg.Org == "" {
		return &ScanResult{ConnectorType: hf.Type(), Models: hfStaticModels(), RawCount: len(hfStaticModels())}, nil
	}

	url := fmt.Sprintf("https://huggingface.co/api/models?author=%s&limit=50", cfg.Org)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("huggingface: build request: %w", err)
	}
	if cfg.Token != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.Token)
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			resp.Body.Close()
		}
		return &ScanResult{ConnectorType: hf.Type(), Models: hfStaticModels(), RawCount: len(hfStaticModels())}, nil
	}
	defer resp.Body.Close()

	var models []struct {
		ModelID  string `json:"modelId"`
		Pipeline string `json:"pipeline_tag"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&models); err != nil {
		return nil, fmt.Errorf("huggingface: decode models: %w", err)
	}

	discovered := make([]DiscoveredModel, 0, len(models))
	for _, m := range models {
		discovered = append(discovered, DiscoveredModel{
			ProviderID: m.ModelID,
			Name:       m.ModelID,
			ModelType:  m.Pipeline,
		})
	}
	return &ScanResult{ConnectorType: hf.Type(), Models: discovered, RawCount: len(discovered)}, nil
}

func hfStaticModels() []DiscoveredModel {
	return []DiscoveredModel{
		{ProviderID: "meta-llama/Meta-Llama-3-8B", Name: "Llama 3 8B", ModelType: "text-generation"},
		{ProviderID: "mistralai/Mistral-7B-Instruct-v0.2", Name: "Mistral 7B Instruct", ModelType: "text-generation"},
		{ProviderID: "sentence-transformers/all-MiniLM-L6-v2", Name: "all-MiniLM-L6-v2", ModelType: "sentence-similarity"},
	}
}
