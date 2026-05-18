package service

import "testing"

func TestTaskStatuses(t *testing.T) {
	statuses := []string{"open", "in_progress", "blocked", "done", "cancelled"}
	if len(statuses) != 5 {
		t.Errorf("expected 5 statuses, got %d", len(statuses))
	}
}

func TestTaskPriorities(t *testing.T) {
	priorities := []string{"low", "medium", "high", "critical"}
	if len(priorities) != 4 {
		t.Errorf("expected 4 priorities, got %d", len(priorities))
	}
}

func TestTaskTypes(t *testing.T) {
	types := []string{"remediation", "review", "investigation", "training", "custom"}
	if len(types) != 5 {
		t.Errorf("expected 5 task types, got %d", len(types))
	}
}
