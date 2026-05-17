package observability

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// NewLogger creates a zap logger based on the environment and level.
func NewLogger(environment, level string) (*zap.Logger, error) {
	cfg := zap.NewProductionConfig()
	if environment == "dev" {
		cfg.Encoding = "console"
		cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	lvl, err := zapcore.ParseLevel(level)
	if err != nil {
		return nil, err
	}
	cfg.Level.SetLevel(lvl)

	return cfg.Build()
}
