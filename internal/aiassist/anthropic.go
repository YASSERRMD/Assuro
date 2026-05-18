package aiassist

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const defaultAnthropicBase = "https://api.anthropic.com"
const anthropicVersion = "2023-06-01"

// AnthropicConfig holds settings for the Anthropic provider.
type AnthropicConfig struct {
	BaseURL string
	APIKey  string
	Model   string
	Timeout time.Duration
}

// AnthropicProvider targets the Anthropic Messages API.
type AnthropicProvider struct {
	cfg    AnthropicConfig
	client *http.Client
}

// NewAnthropicProvider creates an AnthropicProvider.
func NewAnthropicProvider(cfg AnthropicConfig) *AnthropicProvider {
	if cfg.BaseURL == "" {
		cfg.BaseURL = defaultAnthropicBase
	}
	if cfg.Model == "" {
		cfg.Model = "claude-haiku-4-5-20251001"
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 30 * time.Second
	}
	return &AnthropicProvider{cfg: cfg, client: &http.Client{Timeout: cfg.Timeout}}
}

type anthropicRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	System    string    `json:"system,omitempty"`
	Messages  []Message `json:"messages"`
}

type anthropicResponse struct {
	Content []struct {
		Text string `json:"text"`
		Type string `json:"type"`
	} `json:"content"`
	Usage struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Complete sends a request to the Anthropic Messages API.
func (p *AnthropicProvider) Complete(ctx context.Context, req CompleteRequest) (CompleteResponse, error) {
	maxTokens := req.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 1024
	}

	// Extract system message if present
	var system string
	var msgs []Message
	for _, m := range req.Messages {
		if m.Role == RoleSystem {
			system = m.Content
		} else {
			msgs = append(msgs, m)
		}
	}

	payload := anthropicRequest{
		Model:     p.cfg.Model,
		MaxTokens: maxTokens,
		System:    system,
		Messages:  msgs,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return CompleteResponse{}, fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
		p.cfg.BaseURL+"/v1/messages", bytes.NewReader(body))
	if err != nil {
		return CompleteResponse{}, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", p.cfg.APIKey)
	httpReq.Header.Set("anthropic-version", anthropicVersion)

	resp, err := p.client.Do(httpReq)
	if err != nil {
		return CompleteResponse{}, fmt.Errorf("anthropic request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var ar anthropicResponse
	if err := json.Unmarshal(respBody, &ar); err != nil {
		return CompleteResponse{}, fmt.Errorf("decode response: %w", err)
	}
	if ar.Error != nil {
		return CompleteResponse{}, fmt.Errorf("anthropic error: %s", ar.Error.Message)
	}
	if len(ar.Content) == 0 {
		return CompleteResponse{}, fmt.Errorf("anthropic: empty response")
	}

	return CompleteResponse{
		Content:   ar.Content[0].Text,
		TokensIn:  ar.Usage.InputTokens,
		TokensOut: ar.Usage.OutputTokens,
		Provider:  "anthropic",
		Model:     p.cfg.Model,
	}, nil
}

// Capabilities reports Anthropic provider configuration.
func (p *AnthropicProvider) Capabilities() Capabilities {
	return Capabilities{
		Provider:   "anthropic",
		Model:      p.cfg.Model,
		Configured: p.cfg.APIKey != "",
		MaxTokens:  200000,
	}
}
