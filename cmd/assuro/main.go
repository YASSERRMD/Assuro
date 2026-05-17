package main

import (
	"context"
	"fmt"
	"os"

	"github.com/YASSERRMD/Assuro/internal/api"
	"github.com/YASSERRMD/Assuro/internal/config"
	"github.com/YASSERRMD/Assuro/internal/observability"
	"github.com/YASSERRMD/Assuro/internal/store"
	"go.uber.org/zap"
)

const appVersion = "v0.1.0"

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "config error: %v\n", err)
		os.Exit(1)
	}

	logger, err := observability.NewLogger(cfg.Environment, cfg.LogLevel)
	if err != nil {
		fmt.Fprintf(os.Stderr, "logger error: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("Assuro "+appVersion+" starting",
		zap.String("port", cfg.HTTPPort),
		zap.String("env", cfg.Environment),
	)

	ctx := context.Background()

	db, err := store.NewDB(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("database connection failed", zap.Error(err))
	}
	defer db.Close()

	if cfg.Environment == "dev" {
		logger.Info("seeding demo data")
		if err := store.SeedAll(ctx, db); err != nil {
			logger.Error("seed failed", zap.Error(err))
		}
	}

	srv := api.NewServer(":"+cfg.HTTPPort, logger,
		api.WithDB(db),
		api.WithJWTSecret(cfg.JWTSecret),
	)

	if err := srv.Start(); err != nil {
		logger.Fatal("server error", zap.Error(err))
	}
}
