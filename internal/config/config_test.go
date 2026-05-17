package config

import (
	"os"
	"testing"
)

func TestLoadMissingVars(t *testing.T) {
	os.Unsetenv("ASSURO_DATABASE_URL")
	os.Unsetenv("ASSURO_JWT_SECRET")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing vars")
	}
}

func TestLoadDefaults(t *testing.T) {
	os.Setenv("ASSURO_DATABASE_URL", "postgresql://localhost/test")
	os.Setenv("ASSURO_JWT_SECRET", "test-secret")
	os.Unsetenv("ASSURO_HTTP_PORT")
	os.Unsetenv("ASSURO_ENVIRONMENT")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.HTTPPort != "8080" {
		t.Errorf("expected port 8080, got %s", cfg.HTTPPort)
	}
	if cfg.Environment != "dev" {
		t.Errorf("expected dev, got %s", cfg.Environment)
	}
}
