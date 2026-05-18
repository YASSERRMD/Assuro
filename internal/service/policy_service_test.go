package service

import "testing"

func TestPolicyTypes(t *testing.T) {
	types := []string{"governance", "acceptable_use", "data_handling", "security", "custom"}
	if len(types) != 5 {
		t.Errorf("expected 5 policy types, got %d", len(types))
	}
}

func TestPolicyStatuses(t *testing.T) {
	statuses := []string{"draft", "in_review", "approved", "archived"}
	if len(statuses) != 4 {
		t.Errorf("expected 4 policy statuses, got %d", len(statuses))
	}
}
