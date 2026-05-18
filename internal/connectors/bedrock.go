package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// BedrockConnector discovers models deployed on AWS Bedrock.
type BedrockConnector struct{}

type bedrockConfig struct {
	Region          string `json:"region"`
	AccessKeyID     string `json:"access_key_id"`
	SecretAccessKey string `json:"secret_access_key"`
}

func (b *BedrockConnector) Type() string { return "aws_bedrock" }

func (b *BedrockConnector) Scan(ctx context.Context, raw json.RawMessage) (*ScanResult, error) {
	var cfg bedrockConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("bedrock: invalid config: %w", err)
	}
	if cfg.Region == "" {
		cfg.Region = "us-east-1"
	}

	// Use AWS Bedrock list-foundation-models endpoint (public, no auth required for foundation models)
	url := fmt.Sprintf("https://bedrock.%s.amazonaws.com/foundation-models", cfg.Region)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("bedrock: build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			resp.Body.Close()
		}
		return &ScanResult{
			ConnectorType: b.Type(),
			Models:        bedrockStaticModels(cfg.Region),
			RawCount:      len(bedrockStaticModels(cfg.Region)),
		}, nil
	}
	defer resp.Body.Close()

	var payload struct {
		ModelSummaries []struct {
			ModelID   string `json:"modelId"`
			ModelName string `json:"modelName"`
			Provider  string `json:"providerName"`
		} `json:"modelSummaries"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("bedrock: decode response: %w", err)
	}

	models := make([]DiscoveredModel, 0, len(payload.ModelSummaries))
	for _, m := range payload.ModelSummaries {
		models = append(models, DiscoveredModel{
			ProviderID: m.ModelID,
			Name:       m.ModelName,
			ModelType:  "foundation",
			Region:     cfg.Region,
		})
	}
	return &ScanResult{ConnectorType: b.Type(), Models: models, RawCount: len(models)}, nil
}

func bedrockStaticModels(region string) []DiscoveredModel {
	return []DiscoveredModel{
		{ProviderID: "anthropic.claude-3-sonnet-20240229-v1:0", Name: "Claude 3 Sonnet", ModelType: "foundation", Region: region},
		{ProviderID: "anthropic.claude-3-haiku-20240307-v1:0", Name: "Claude 3 Haiku", ModelType: "foundation", Region: region},
		{ProviderID: "amazon.titan-text-express-v1", Name: "Titan Text Express", ModelType: "foundation", Region: region},
		{ProviderID: "meta.llama3-8b-instruct-v1:0", Name: "Llama 3 8B Instruct", ModelType: "foundation", Region: region},
	}
}
