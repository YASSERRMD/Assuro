package service

import "testing"

func TestDedupKey(t *testing.T) {
	k1 := dedupKey("org1", "github", "acme/ml-repo")
	k2 := dedupKey("org1", "github", "acme/ml-repo")
	k3 := dedupKey("org1", "github", "acme/other-repo")

	if k1 != k2 {
		t.Error("same inputs should produce same dedup key")
	}
	if k1 == k3 {
		t.Error("different inputs should produce different dedup key")
	}
	if len(k1) != 16 {
		t.Errorf("expected 16 hex chars, got %d", len(k1))
	}
}

func TestDiscoveryItemStates(t *testing.T) {
	states := []string{"new", "reviewed", "merged", "dismissed"}
	if len(states) != 4 {
		t.Errorf("expected 4 states, got %d", len(states))
	}
}
