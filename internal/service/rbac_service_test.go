package service

import "testing"

func TestKnownPermissions(t *testing.T) {
	perms := KnownPermissions()
	if len(perms) == 0 {
		t.Error("known permissions should not be empty")
	}
	seen := make(map[string]bool)
	for _, p := range perms {
		if seen[p] {
			t.Errorf("duplicate permission: %s", p)
		}
		seen[p] = true
	}
}

func TestKnownPermissionsFormat(t *testing.T) {
	for _, p := range KnownPermissions() {
		hasColon := false
		for _, c := range p {
			if c == ':' {
				hasColon = true
				break
			}
		}
		if !hasColon {
			t.Errorf("permission %q missing colon separator", p)
		}
	}
}
