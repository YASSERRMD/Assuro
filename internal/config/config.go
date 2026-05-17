package config

import (
	"fmt"
	"os"
	"time"
)

// Config holds all application configuration.
type Config struct {
	HTTPPort     string
	DatabaseURL  string
	JWTSecret    string
	JWTAccessTTL time.Duration
	JWTRefreshTTL time.Duration
	Environment  string
	LogLevel     string
}

// Load reads configuration from environment variables with defaults.
func Load() (*Config, error) {
	var missing []string

	httpPort := getEnv("ASSURO_HTTP_PORT", "8080")
	databaseURL := getEnv("ASSURO_DATABASE_URL", "")
	if databaseURL == "" {
		missing = append(missing, "ASSURO_DATABASE_URL")
	}

	jwtSecret := getEnv("ASSURO_JWT_SECRET", "")
	if jwtSecret == "" {
		missing = append(missing, "ASSURO_JWT_SECRET")
	}

	jwtAccessTTL := getEnv("ASSURO_JWT_ACCESS_TTL", "15m")
	jwtRefreshTTL := getEnv("ASSURO_JWT_REFRESH_TTL", "168h")
	environment := getEnv("ASSURO_ENVIRONMENT", "dev")
	logLevel := getEnv("ASSURO_LOG_LEVEL", "info")

	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required environment variables: %v", missing)
	}

	accessTTL, err := time.ParseDuration(jwtAccessTTL)
	if err != nil {
		return nil, fmt.Errorf("invalid ASSURO_JWT_ACCESS_TTL: %w", err)
	}

	refreshTTL, err := time.ParseDuration(jwtRefreshTTL)
	if err != nil {
		return nil, fmt.Errorf("invalid ASSURO_JWT_REFRESH_TTL: %w", err)
	}

	return &Config{
		HTTPPort:      httpPort,
		DatabaseURL:   databaseURL,
		JWTSecret:     jwtSecret,
		JWTAccessTTL:  accessTTL,
		JWTRefreshTTL: refreshTTL,
		Environment:   environment,
		LogLevel:      logLevel,
	}, nil
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultVal
}
