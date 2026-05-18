package service

import "testing"

func TestConformityAssessmentKinds(t *testing.T) {
	valid := map[string]bool{"eu_ai_act": true, "fria": true, "dpia": true, "custom": true}
	for k := range valid {
		if !valid[k] {
			t.Errorf("unexpected kind: %s", k)
		}
	}
}

func TestConformityAssessmentStatuses(t *testing.T) {
	statuses := []string{"draft", "in_progress", "complete", "archived"}
	if len(statuses) != 4 {
		t.Errorf("expected 4 statuses, got %d", len(statuses))
	}
}

func TestDerefStr(t *testing.T) {
	s := "hello"
	if got := derefStr(&s); got != "hello" {
		t.Errorf("expected hello, got %s", got)
	}
	if got := derefStr(nil); got != "" {
		t.Errorf("expected empty string for nil, got %s", got)
	}
}
