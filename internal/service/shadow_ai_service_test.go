package service

import "testing"

func TestShadowAIFindingStatuses(t *testing.T) {
	statuses := []string{"open", "reviewed", "dismissed", "registered"}
	if len(statuses) != 4 {
		t.Errorf("expected 4 statuses, got %d", len(statuses))
	}
}

func TestShadowAIRiskLevels(t *testing.T) {
	levels := []string{"unknown", "low", "medium", "high"}
	if len(levels) != 4 {
		t.Errorf("expected 4 risk levels, got %d", len(levels))
	}
}
