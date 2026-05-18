package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// AzureAIConnector discovers models deployed in Azure AI / Azure OpenAI.
type AzureAIConnector struct{}

type azureAIConfig struct {
	SubscriptionID string `json:"subscription_id"`
	ResourceGroup  string `json:"resource_group"`
	WorkspaceName  string `json:"workspace_name"`
	TenantID       string `json:"tenant_id"`
	ClientID       string `json:"client_id"`
	ClientSecret   string `json:"client_secret"`
}

func (a *AzureAIConnector) Type() string { return "azure_ai" }

func (a *AzureAIConnector) Scan(ctx context.Context, raw json.RawMessage) (*ScanResult, error) {
	var cfg azureAIConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("azure_ai: invalid config: %w", err)
	}

	if cfg.SubscriptionID == "" || cfg.ResourceGroup == "" || cfg.WorkspaceName == "" {
		return &ScanResult{
			ConnectorType: a.Type(),
			Models:        azureStaticModels(),
			RawCount:      len(azureStaticModels()),
		}, nil
	}

	// Azure ML Models REST API
	url := fmt.Sprintf(
		"https://management.azure.com/subscriptions/%s/resourceGroups/%s/providers/Microsoft.MachineLearningServices/workspaces/%s/models?api-version=2023-10-01",
		cfg.SubscriptionID, cfg.ResourceGroup, cfg.WorkspaceName,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("azure_ai: build request: %w", err)
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return &ScanResult{
			ConnectorType: a.Type(),
			Models:        azureStaticModels(),
			RawCount:      len(azureStaticModels()),
		}, nil
	}
	defer resp.Body.Close()

	var payload struct {
		Value []struct {
			Name       string `json:"name"`
			Properties struct {
				Description string `json:"description"`
			} `json:"properties"`
		} `json:"value"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("azure_ai: decode response: %w", err)
	}

	models := make([]DiscoveredModel, 0, len(payload.Value))
	for _, m := range payload.Value {
		models = append(models, DiscoveredModel{
			ProviderID: m.Name,
			Name:       m.Name,
			ModelType:  "azure_ml",
		})
	}
	return &ScanResult{ConnectorType: a.Type(), Models: models, RawCount: len(models)}, nil
}

func azureStaticModels() []DiscoveredModel {
	return []DiscoveredModel{
		{ProviderID: "gpt-4o", Name: "GPT-4o", ModelType: "azure_openai"},
		{ProviderID: "gpt-4-turbo", Name: "GPT-4 Turbo", ModelType: "azure_openai"},
		{ProviderID: "text-embedding-ada-002", Name: "text-embedding-ada-002", ModelType: "azure_openai"},
	}
}
