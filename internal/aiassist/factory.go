package aiassist

import (
	"fmt"
	"os"
	"time"
)

// ProviderName constants.
const (
	ProviderNull      = "null"
	ProviderOpenAI    = "openai"
	ProviderAnthropic = "anthropic"
)

// Config holds all aiassist configuration.
type Config struct {
	Provider string
	// OpenAI-compatible settings
	OpenAIBaseURL      string
	OpenAIAPIKey       string
	OpenAIModel        string
	OpenAIOrganization string
	// Anthropic settings
	AnthropicBaseURL string
	AnthropicAPIKey  string
	AnthropicModel   string
	// Shared
	Timeout time.Duration
	// ForceNull disables LLM calls org-wide and forces the NullProvider.
	ForceNull bool
}

// FromEnv populates Config from environment variables.
func ConfigFromEnv() Config {
	return Config{
		Provider:         getEnv("AIASSIST_PROVIDER", ProviderNull),
		OpenAIBaseURL:    os.Getenv("AIASSIST_OPENAI_BASE_URL"),
		OpenAIAPIKey:     os.Getenv("AIASSIST_OPENAI_API_KEY"),
		OpenAIModel:      getEnv("AIASSIST_OPENAI_MODEL", "gpt-4o-mini"),
		OpenAIOrganization: os.Getenv("AIASSIST_OPENAI_ORG"),
		AnthropicBaseURL: os.Getenv("AIASSIST_ANTHROPIC_BASE_URL"),
		AnthropicAPIKey:  os.Getenv("AIASSIST_ANTHROPIC_API_KEY"),
		AnthropicModel:   getEnv("AIASSIST_ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
		ForceNull:        os.Getenv("AIASSIST_FORCE_NULL") == "true",
	}
}

// Build constructs the active Provider from config.
func Build(cfg Config) (Provider, error) {
	if cfg.ForceNull {
		return &NullProvider{}, nil
	}
	switch cfg.Provider {
	case ProviderNull, "":
		return &NullProvider{}, nil
	case ProviderOpenAI:
		return NewOpenAIProvider(OpenAIConfig{
			BaseURL:      cfg.OpenAIBaseURL,
			APIKey:       cfg.OpenAIAPIKey,
			Model:        cfg.OpenAIModel,
			Organization: cfg.OpenAIOrganization,
			Timeout:      cfg.Timeout,
		}), nil
	case ProviderAnthropic:
		return NewAnthropicProvider(AnthropicConfig{
			BaseURL: cfg.AnthropicBaseURL,
			APIKey:  cfg.AnthropicAPIKey,
			Model:   cfg.AnthropicModel,
			Timeout: cfg.Timeout,
		}), nil
	default:
		return nil, fmt.Errorf("aiassist: unknown provider %q", cfg.Provider)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
