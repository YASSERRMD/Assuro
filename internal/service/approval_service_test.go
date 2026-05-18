package service

import "testing"

func TestApprovalRequestStatuses(t *testing.T) {
	statuses := []string{"pending", "approved", "rejected", "cancelled"}
	if len(statuses) != 4 {
		t.Errorf("expected 4 statuses, got %d", len(statuses))
	}
}

func TestApprovalDecisionValues(t *testing.T) {
	decisions := []string{"approve", "reject"}
	if len(decisions) != 2 {
		t.Errorf("expected 2 decision values, got %d", len(decisions))
	}
}
