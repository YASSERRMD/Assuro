package aiassist

import (
	"context"
	"fmt"
	"strings"
)

// TaskResult wraps the output of an assist task, noting the path used.
type TaskResult struct {
	Content  string `json:"content"`
	Provider string `json:"provider"`
	Fallback bool   `json:"fallback"`
}

// SummarizeRisk produces a plain-language summary of risk factors.
// Falls back to a template join if the provider is Null or the call fails.
func SummarizeRisk(ctx context.Context, p Provider, factors []string) TaskResult {
	if _, isNull := p.(*NullProvider); isNull {
		return fallbackSummarizeRisk(factors)
	}
	prompt := "Summarize the following AI risk factors in 2-3 plain-language sentences:\n" +
		strings.Join(factors, "\n")
	resp, err := p.Complete(ctx, CompleteRequest{
		Messages:  []Message{{Role: RoleUser, Content: prompt}},
		MaxTokens: 256,
	})
	if err != nil {
		return fallbackSummarizeRisk(factors)
	}
	return TaskResult{Content: resp.Content, Provider: resp.Provider}
}

func fallbackSummarizeRisk(factors []string) TaskResult {
	return TaskResult{
		Content:  fmt.Sprintf("Risk factors identified: %s.", strings.Join(factors, "; ")),
		Provider: ProviderNull,
		Fallback: true,
	}
}

// DraftControlJustification drafts a justification for implementing a compliance control.
func DraftControlJustification(ctx context.Context, p Provider, control, context_ string) TaskResult {
	if _, isNull := p.(*NullProvider); isNull {
		return fallbackControlJustification(control)
	}
	prompt := fmt.Sprintf(
		"Draft a concise implementation justification for compliance control '%s'. Context: %s",
		control, context_,
	)
	resp, err := p.Complete(ctx, CompleteRequest{
		Messages:  []Message{{Role: RoleUser, Content: prompt}},
		MaxTokens: 300,
	})
	if err != nil {
		return fallbackControlJustification(control)
	}
	return TaskResult{Content: resp.Content, Provider: resp.Provider}
}

func fallbackControlJustification(control string) TaskResult {
	return TaskResult{
		Content:  fmt.Sprintf("This control (%s) has been implemented in accordance with organizational policy.", control),
		Provider: ProviderNull,
		Fallback: true,
	}
}

// InterpretRequirement explains a regulatory requirement in plain language.
func InterpretRequirement(ctx context.Context, p Provider, requirementText string) TaskResult {
	if _, isNull := p.(*NullProvider); isNull {
		return fallbackInterpretRequirement(requirementText)
	}
	prompt := "Explain this regulatory requirement in plain language for a compliance team:\n" + requirementText
	resp, err := p.Complete(ctx, CompleteRequest{
		Messages:  []Message{{Role: RoleUser, Content: prompt}},
		MaxTokens: 400,
	})
	if err != nil {
		return fallbackInterpretRequirement(requirementText)
	}
	return TaskResult{Content: resp.Content, Provider: resp.Provider}
}

func fallbackInterpretRequirement(text string) TaskResult {
	return TaskResult{
		Content:  text + "\n\n[AI interpretation not available - configure an LLM provider for enhanced guidance.]",
		Provider: ProviderNull,
		Fallback: true,
	}
}

// TriageTestResult suggests a severity and action for a test result.
func TriageTestResult(ctx context.Context, p Provider, result, resultSeverity string) TaskResult {
	if _, isNull := p.(*NullProvider); isNull {
		return fallbackTriageTestResult(resultSeverity)
	}
	prompt := fmt.Sprintf(
		"Given this AI model test result (severity: %s):\n%s\n\nProvide: 1) Confirmed severity 2) Recommended action in 2 sentences.",
		resultSeverity, result,
	)
	resp, err := p.Complete(ctx, CompleteRequest{
		Messages:  []Message{{Role: RoleUser, Content: prompt}},
		MaxTokens: 200,
	})
	if err != nil {
		return fallbackTriageTestResult(resultSeverity)
	}
	return TaskResult{Content: resp.Content, Provider: resp.Provider}
}

func fallbackTriageTestResult(severity string) TaskResult {
	action := "Review the result manually."
	if severity == "critical" || severity == "high" {
		action = "Escalate immediately and block deployment."
	}
	return TaskResult{
		Content:  fmt.Sprintf("Severity: %s. %s", severity, action),
		Provider: ProviderNull,
		Fallback: true,
	}
}
