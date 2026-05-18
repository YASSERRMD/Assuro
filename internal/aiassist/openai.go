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

const defaultOpenAIBase = "https://api.openai.com"

// OpenAIConfig holds settings for the OpenAI-compatible provider.
type OpenAIConfig struct {
	BaseURL      string
	APIKey       string
	Model        string
	Organization string
	Timeout      time.Duration
}

// OpenAIProvider targets the OpenAI chat-completions API shape.
// It also works with Azure OpenAI, vLLM, Ollama and any OpenAI-compatible endpoint.
type OpenAIProvider struct {
	cfg    OpenAIConfig
	client *http.Client
}

// NewOpenAIProvider creates an OpenAIProvider.
func NewOpenAIProvider(cfg OpenAIConfig) *OpenAIProvider {
	if cfg.BaseURL == "" {
		cfg.BaseURL = defaultOpenAIBase
	}
	if cfg.Model == "" {
		cfg.Model = "gpt-4o-mini"
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 30 * time.Second
	}
	return &OpenAIProvider{cfg: cfg, client: &http.Client{Timeout: cfg.Timeout}}
}

type openAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	MaxTokens int      `json:"max_tokens,omitempty"`
}

type openAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Complete sends a chat completion request to the OpenAI-compatible endpoint.
func (p *OpenAIProvider) Complete(ctx context.Context, req CompleteRequest) (CompleteResponse, error) {
	payload := openAIRequest{
		Model:     p.cfg.Model,
		Messages:  req.Messages,
		MaxTokens: req.MaxTokens,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return CompleteResponse{}, fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
		p.cfg.BaseURL+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return CompleteResponse{}, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.cfg.APIKey)
	if p.cfg.Organization != "" {
		httpReq.Header.Set("OpenAI-Organization", p.cfg.Organization)
	}

	resp, err := p.client.Do(httpReq)
	if err != nil {
		return CompleteResponse{}, fmt.Errorf("openai request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var oir openAIResponse
	if err := json.Unmarshal(respBody, &oir); err != nil {
		return CompleteResponse{}, fmt.Errorf("decode response: %w", err)
	}
	if oir.Error != nil {
		return CompleteResponse{}, fmt.Errorf("openai error: %s", oir.Error.Message)
	}
	if len(oir.Choices) == 0 {
		return CompleteResponse{}, fmt.Errorf("openai: no choices in response")
	}

	return CompleteResponse{
		Content:   oir.Choices[0].Message.Content,
		TokensIn:  oir.Usage.PromptTokens,
		TokensOut: oir.Usage.CompletionTokens,
		Provider:  "openai",
		Model:     p.cfg.Model,
	}, nil
}

// Capabilities reports OpenAI provider configuration.
func (p *OpenAIProvider) Capabilities() Capabilities {
	return Capabilities{
		Provider:   "openai",
		Model:      p.cfg.Model,
		Configured: p.cfg.APIKey != "",
		MaxTokens:  128000,
	}
}
