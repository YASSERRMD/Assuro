package store

import (
	"context"
	"fmt"
)

// SeedDemoOrg inserts a demo organization for development.
func SeedDemoOrg(ctx context.Context, db *DB) error {
	var exists bool
	err := db.Pool().QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = $1)",
		"demo-org",
	).Scan(&exists)
	if err != nil {
		return fmt.Errorf("check existing org: %w", err)
	}
	if exists {
		return nil
	}

	_, err = db.Pool().Exec(ctx,
		"INSERT INTO organizations (name, slug) VALUES ($1, $2)",
		"Demo Organization", "demo-org",
	)
	if err != nil {
		return fmt.Errorf("insert demo org: %w", err)
	}

	return nil
}
