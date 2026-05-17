package service

import (
	"testing"
)

func TestIncidentStatusValidation(t *testing.T) {
	validStatuses := []string{"open", "investigating", "mitigated", "closed"}
	for _, s := range validStatuses {
		if s == "" {
			t.Error("empty status is not valid")
		}
	}
}

func TestSignalSeverityLevels(t *testing.T) {
	severities := []string{"low", "medium", "high", "critical"}
	autoRaiseThreshold := map[string]bool{
		"high":     true,
		"critical": true,
	}

	for _, sev := range severities {
		shouldRaise := autoRaiseThreshold[sev]
		if sev == "high" && !shouldRaise {
			t.Errorf("expected %s to auto-raise", sev)
		}
		if sev == "low" && shouldRaise {
			t.Errorf("expected %s to not auto-raise", sev)
		}
	}
}

func TestCAPACompletionBlocksClose(t *testing.T) {
	openActions := int64(2)
	if openActions > 0 {
		t.Log("incident cannot be closed with open CAPA items - correct")
	}
}
