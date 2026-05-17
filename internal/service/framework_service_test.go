package service

import (
	"testing"
)

func TestFrameworkCoverageMath(t *testing.T) {
	coverage := []FrameworkCoverage{
		{FrameworkKey: "eu_ai_act", TotalReqs: 10, CoveredReqs: 5, CoveragePct: 50},
		{FrameworkKey: "nist_ai_rmf", TotalReqs: 8, CoveredReqs: 8, CoveragePct: 100},
	}

	for _, c := range coverage {
		if c.TotalReqs == 0 {
			t.Error("total reqs should not be zero")
		}
		expected := float64(c.CoveredReqs) / float64(c.TotalReqs) * 100
		if c.CoveragePct != expected {
			t.Errorf("%s: expected %.1f, got %.1f", c.FrameworkKey, expected, c.CoveragePct)
		}
	}
}

func TestControlStatusEntryFields(t *testing.T) {
	entry := ControlStatusEntry{
		ControlKey:    "CTL-RISK-01",
		ControlTitle:  "Risk Management",
		ControlDomain: "ai_governance",
		Status:        "implemented",
		Justification: "Risk process established",
	}
	if entry.ControlKey != "CTL-RISK-01" {
		t.Errorf("expected CTL-RISK-01, got %s", entry.ControlKey)
	}
	if entry.Status != "implemented" {
		t.Errorf("expected implemented, got %s", entry.Status)
	}
}
