package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// GitHubConnector scans GitHub/GitLab repositories for AI model usage.
type GitHubConnector struct{}

type githubConfig struct {
	Token   string `json:"token"`
	Org     string `json:"org"`
	BaseURL string `json:"base_url"` // override for GitHub Enterprise or GitLab
}

func (g *GitHubConnector) Type() string { return "github" }

func (g *GitHubConnector) Scan(ctx context.Context, raw json.RawMessage) (*ScanResult, error) {
	var cfg githubConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("github: invalid config: %w", err)
	}
	if cfg.BaseURL == "" {
		cfg.BaseURL = "https://api.github.com"
	}

	if cfg.Token == "" || cfg.Org == "" {
		return githubFallback(), nil
	}

	url := fmt.Sprintf("%s/orgs/%s/repos?per_page=100&type=all", cfg.BaseURL, cfg.Org)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("github: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+cfg.Token)
	req.Header.Set("Accept", "application/vnd.github+json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			resp.Body.Close()
		}
		return githubFallback(), nil
	}
	defer resp.Body.Close()

	var repos []struct {
		FullName string `json:"full_name"`
		Language string `json:"language"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, fmt.Errorf("github: decode repos: %w", err)
	}

	// Heuristic: repos with AI-related names or Python/Jupyter are shadow-AI candidates
	models := make([]DiscoveredModel, 0)
	aiKeywords := []string{"ml", "ai", "model", "llm", "gpt", "bert", "embedding", "inference"}
	for _, repo := range repos {
		if isAIRelated(repo.FullName, repo.Language, aiKeywords) {
			models = append(models, DiscoveredModel{
				ProviderID: repo.FullName,
				Name:       repo.FullName,
				ModelType:  "code_repo",
				Metadata:   json.RawMessage(fmt.Sprintf(`{"language":%q,"source":"github"}`, repo.Language)),
			})
		}
	}
	return &ScanResult{ConnectorType: g.Type(), Models: models, RawCount: len(repos)}, nil
}

func githubFallback() *ScanResult {
	return &ScanResult{
		ConnectorType: "github",
		Models:        []DiscoveredModel{},
		RawCount:      0,
	}
}

func isAIRelated(name, lang string, keywords []string) bool {
	if lang == "Jupyter Notebook" || lang == "Python" {
		for _, kw := range keywords {
			if contains(name, kw) {
				return true
			}
		}
	}
	return false
}

func contains(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
