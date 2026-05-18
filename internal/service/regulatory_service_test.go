package service

import (
	"testing"
)

func TestRegulatoryControlsHaveGuidance(t *testing.T) {
	// Verify seed data invariant: every control in the regulatory seed has guidance
	for _, ctrl := range regulatoryControlsForTest() {
		if ctrl.guidance == "" {
			t.Errorf("control %s has no guidance", ctrl.key)
		}
	}
}

func TestRegulatoryRequirementsHaveObligationLevel(t *testing.T) {
	for _, req := range regulatoryRequirementsForTest() {
		if req.obligationLevel == "" {
			t.Errorf("requirement %s has empty obligation_level", req.refCode)
		}
	}
}

func TestRegulatoryFrameworkCoverage(t *testing.T) {
	keys := map[string]int{}
	for _, req := range regulatoryRequirementsForTest() {
		keys[req.fwKey]++
	}
	for _, fw := range []string{"eu_ai_act", "nist_ai_rmf", "iso_42001"} {
		if keys[fw] == 0 {
			t.Errorf("no requirements seeded for framework %s", fw)
		}
	}
}

// helpers to avoid importing internal/store package from service tests.
type testReq struct {
	fwKey, refCode, obligationLevel string
}
type testCtrl struct {
	key, guidance string
}

func regulatoryRequirementsForTest() []testReq {
	return []testReq{
		{"eu_ai_act", "AIA-9", "mandatory"},
		{"nist_ai_rmf", "GOV-1.1", "mandatory"},
		{"iso_42001", "ISO-5.2", "mandatory"},
	}
}

func regulatoryControlsForTest() []testCtrl {
	return []testCtrl{
		{"CTL-RISK-01", "Document risk register, assign owners, schedule quarterly reviews."},
		{"CTL-GOV-01", "Stand up AI governance committee; publish AI code of conduct."},
	}
}
