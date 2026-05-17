package domain

import (
	"testing"
)

func TestAISystemValidateValid(t *testing.T) {
	ai := &AISystem{
		Asset: Asset{
			Name:      "Test AI",
			AssetType: AssetTypeAISystem,
		},
	}
	if err := ai.Validate(); err != nil {
		t.Fatalf("expected valid, got: %v", err)
	}
}

func TestAISystemValidateWrongType(t *testing.T) {
	ai := &AISystem{
		Asset: Asset{
			Name:      "Test",
			AssetType: "workplace_site",
		},
	}
	if err := ai.Validate(); err == nil {
		t.Fatal("expected error for wrong asset type")
	}
}

func TestValidationError(t *testing.T) {
	err := &ValidationError{Field: "name", Message: "required"}
	expected := "name: required"
	if err.Error() != expected {
		t.Errorf("expected %q, got %q", expected, err.Error())
	}
}
