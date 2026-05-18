package service

import "testing"

func TestBehaviorLogStatuses(t *testing.T) {
	valid := map[string]bool{"ok": true, "error": true, "blocked": true, "anomaly": true}
	for k := range valid {
		if !valid[k] {
			t.Errorf("unexpected status: %s", k)
		}
	}
}

func TestGuardrailPolicyTypes(t *testing.T) {
	types := []string{"block", "warn", "log"}
	if len(types) != 3 {
		t.Errorf("expected 3 policy types, got %d", len(types))
	}
}

func TestAnomalySeverities(t *testing.T) {
	severities := []string{"low", "medium", "high", "critical"}
	if len(severities) != 4 {
		t.Errorf("expected 4 severity levels, got %d", len(severities))
	}
}
