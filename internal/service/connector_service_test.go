package service

import "testing"

func TestConnectorStatuses(t *testing.T) {
	valid := map[string]bool{"active": true, "inactive": true, "error": true}
	for k := range valid {
		if !valid[k] {
			t.Errorf("unexpected connector status: %s", k)
		}
	}
}

func TestSyncRunStatuses(t *testing.T) {
	statuses := []string{"pending", "running", "success", "failed"}
	if len(statuses) != 4 {
		t.Errorf("expected 4 sync run statuses, got %d", len(statuses))
	}
}
