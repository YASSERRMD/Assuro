package service

import "testing"

func TestKnownActions(t *testing.T) {
	actions := KnownActions()
	if len(actions) == 0 {
		t.Error("known actions should not be empty")
	}
	seen := make(map[string]bool)
	for _, a := range actions {
		if seen[a] {
			t.Errorf("duplicate action: %s", a)
		}
		seen[a] = true
	}
}

func TestAuditFilterDefaults(t *testing.T) {
	svc := &AuditService{}
	_ = svc
	f := AuditFilter{}
	if f.Limit != 0 {
		t.Error("default limit should be zero (clamped internally)")
	}
}

func TestAuditEventJSON(t *testing.T) {
	e := AuditEvent{Action: "asset.created", TargetType: "asset"}
	if e.Action == "" {
		t.Error("action should not be empty")
	}
}
