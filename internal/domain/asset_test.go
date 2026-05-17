package domain

import (
	"testing"
)

func TestAssetValidateValid(t *testing.T) {
	a := &Asset{
		Name:      "Test System",
		AssetType: AssetTypeAISystem,
	}
	if err := a.Validate(); err != nil {
		t.Fatalf("expected valid, got: %v", err)
	}
}

func TestAssetValidateMissingName(t *testing.T) {
	a := &Asset{
		AssetType: AssetTypeAISystem,
	}
	if err := a.Validate(); err == nil {
		t.Fatal("expected error for missing name")
	}
}

func TestAssetValidateMissingType(t *testing.T) {
	a := &Asset{
		Name: "Test",
	}
	if err := a.Validate(); err == nil {
		t.Fatal("expected error for missing type")
	}
}

func TestAssetValidateNameTooLong(t *testing.T) {
	a := &Asset{
		Name:      string(make([]byte, 256)),
		AssetType: AssetTypeAISystem,
	}
	if err := a.Validate(); err == nil {
		t.Fatal("expected error for name too long")
	}
}

func TestAssetDefaultStatus(t *testing.T) {
	a := &Asset{
		Name:      "Test",
		AssetType: AssetTypeAISystem,
	}
	if err := a.Validate(); err != nil {
		t.Fatal(err)
	}
	if a.LifecycleStatus != LifecycleStatusActive {
		t.Errorf("expected active, got %s", a.LifecycleStatus)
	}
}
