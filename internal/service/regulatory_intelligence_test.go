package service

import "testing"

func TestChangeKindValues(t *testing.T) {
	valid := map[string]bool{"added": true, "amended": true, "removed": true, "clarified": true}
	for k := range valid {
		if !valid[k] {
			t.Errorf("unexpected kind: %s", k)
		}
	}
}

func TestImpactLevelValues(t *testing.T) {
	levels := []string{"none", "low", "medium", "high", "critical"}
	if len(levels) != 5 {
		t.Errorf("expected 5 impact levels, got %d", len(levels))
	}
}

func TestImpactStatusValues(t *testing.T) {
	statuses := []string{"open", "in_review", "actioned", "dismissed"}
	if len(statuses) != 4 {
		t.Errorf("expected 4 statuses, got %d", len(statuses))
	}
}
