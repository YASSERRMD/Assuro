package aiassist

import "context"

// Role constants for chat messages.
const (
	RoleSystem    = "system"
	RoleUser      = "user"
	RoleAssistant = "assistant"
)

// Message is a single turn in a chat conversation.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// CompleteRequest is the input to a chat completion.
type CompleteRequest struct {
	Messages    []Message `json:"messages"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Temperature float32   `json:"temperature,omitempty"`
}

// CompleteResponse is the output of a chat completion.
type CompleteResponse struct {
	Content    string `json:"content"`
	TokensIn   int    `json:"tokens_in"`
	TokensOut  int    `json:"tokens_out"`
	Provider   string `json:"provider"`
	Model      string `json:"model"`
	UsedFallback bool `json:"used_fallback"`
}

// Capabilities describes what a provider supports.
type Capabilities struct {
	Provider    string `json:"provider"`
	Model       string `json:"model"`
	Configured  bool   `json:"configured"`
	MaxTokens   int    `json:"max_tokens"`
}

// Provider is the interface all LLM providers must implement.
type Provider interface {
	Complete(ctx context.Context, req CompleteRequest) (CompleteResponse, error)
	Capabilities() Capabilities
}
