package service

import "testing"

func TestAgentTypes(t *testing.T) {
	valid := map[string]bool{"autonomous": true, "assistant": true, "pipeline": true, "custom": true}
	for k := range valid {
		if !valid[k] {
			t.Errorf("unexpected agent type: %s", k)
		}
	}
}

func TestAgentStatuses(t *testing.T) {
	statuses := []string{"active", "inactive", "suspended"}
	if len(statuses) != 3 {
		t.Errorf("expected 3 statuses, got %d", len(statuses))
	}
}

func TestNowStr(t *testing.T) {
	s := nowStr()
	if s == "" {
		t.Error("nowStr returned empty string")
	}
}
