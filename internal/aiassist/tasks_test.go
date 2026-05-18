package aiassist

import (
	"context"
	"testing"
)

func TestNullProviderComplete(t *testing.T) {
	p := &NullProvider{}
	resp, err := p.Complete(context.Background(), CompleteRequest{
		Messages: []Message{{Role: RoleUser, Content: "hello"}},
	})
	if err != nil {
		t.Fatalf("null provider must not error: %v", err)
	}
	if !resp.UsedFallback {
		t.Error("null provider should set UsedFallback=true")
	}
	if resp.Content == "" {
		t.Error("null provider must return non-empty content")
	}
}

func TestNullProviderCapabilities(t *testing.T) {
	p := &NullProvider{}
	caps := p.Capabilities()
	if !caps.Configured {
		t.Error("null provider should report Configured=true")
	}
	if caps.Provider != "null" {
		t.Errorf("expected provider=null, got %s", caps.Provider)
	}
}

func TestSummarizeRiskFallback(t *testing.T) {
	result := SummarizeRisk(context.Background(), &NullProvider{}, []string{"bias", "opacity"})
	if !result.Fallback {
		t.Error("expected fallback=true with null provider")
	}
	if result.Content == "" {
		t.Error("fallback must return non-empty content")
	}
}

func TestDraftControlJustificationFallback(t *testing.T) {
	result := DraftControlJustification(context.Background(), &NullProvider{}, "ISO-6.1", "governance context")
	if !result.Fallback {
		t.Error("expected fallback with null provider")
	}
}

func TestInterpretRequirementFallback(t *testing.T) {
	result := InterpretRequirement(context.Background(), &NullProvider{}, "Article 9: risk management system")
	if !result.Fallback {
		t.Error("expected fallback with null provider")
	}
	if result.Content == "" {
		t.Error("fallback must return non-empty content")
	}
}

func TestTriageTestResultFallbackCritical(t *testing.T) {
	result := TriageTestResult(context.Background(), &NullProvider{}, "model outputs PII", "critical")
	if !result.Fallback {
		t.Error("expected fallback")
	}
	if result.Content == "" {
		t.Error("fallback must return non-empty content")
	}
}

func TestBuildNullProvider(t *testing.T) {
	p, err := Build(Config{Provider: ProviderNull})
	if err != nil {
		t.Fatalf("build null: %v", err)
	}
	if _, ok := p.(*NullProvider); !ok {
		t.Error("expected NullProvider")
	}
}

func TestBuildForceNull(t *testing.T) {
	p, err := Build(Config{Provider: ProviderOpenAI, ForceNull: true})
	if err != nil {
		t.Fatalf("build force null: %v", err)
	}
	if _, ok := p.(*NullProvider); !ok {
		t.Error("ForceNull should return NullProvider even when provider=openai")
	}
}

func TestBuildUnknownProvider(t *testing.T) {
	_, err := Build(Config{Provider: "unknown"})
	if err == nil {
		t.Error("expected error for unknown provider")
	}
}
