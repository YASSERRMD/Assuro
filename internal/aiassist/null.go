package aiassist

import "context"

// NullProvider returns deterministic placeholder output and never errors.
// It is the default when no LLM provider is configured.
type NullProvider struct{}

// Complete returns a clearly-labelled placeholder response.
func (n *NullProvider) Complete(_ context.Context, _ CompleteRequest) (CompleteResponse, error) {
	return CompleteResponse{
		Content:      "AI assistance not configured. Please configure an LLM provider.",
		Provider:     "null",
		Model:        "null",
		UsedFallback: true,
	}, nil
}

// Capabilities reports that this provider is always available but limited.
func (n *NullProvider) Capabilities() Capabilities {
	return Capabilities{
		Provider:   "null",
		Model:      "null",
		Configured: true,
		MaxTokens:  0,
	}
}
