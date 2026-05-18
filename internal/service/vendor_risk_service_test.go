package service

import "testing"

func TestVendorTypes(t *testing.T) {
	types := []string{"ai_provider", "data_provider", "platform", "tools", "custom"}
	if len(types) != 5 {
		t.Errorf("expected 5 vendor types, got %d", len(types))
	}
}

func TestVendorRiskTiers(t *testing.T) {
	tiers := []string{"unknown", "low", "medium", "high", "critical"}
	if len(tiers) != 5 {
		t.Errorf("expected 5 risk tiers, got %d", len(tiers))
	}
}
