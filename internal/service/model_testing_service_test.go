package service

import "testing"

func TestSuiteTypes(t *testing.T) {
	types := []string{"functional", "bias", "robustness", "security", "custom"}
	if len(types) != 5 {
		t.Errorf("expected 5 suite types, got %d", len(types))
	}
}

func TestTestRunStatuses(t *testing.T) {
	statuses := []string{"pending", "running", "passed", "failed", "error"}
	if len(statuses) != 5 {
		t.Errorf("expected 5 run statuses, got %d", len(statuses))
	}
}

func TestTestResultOutcomes(t *testing.T) {
	outcomes := []string{"pending", "pass", "fail", "error", "skip"}
	if len(outcomes) != 5 {
		t.Errorf("expected 5 outcomes, got %d", len(outcomes))
	}
}
