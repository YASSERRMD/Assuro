package store

import (
	"context"
	"fmt"
)

// SeedDemoData inserts rich demo data for evaluation.
func SeedDemoData(ctx context.Context, db *DB) error {
	tx, err := db.Pool().Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var orgID string
	err = tx.QueryRow(ctx, "SELECT id FROM organizations WHERE slug = 'demo-org'").Scan(&orgID)
	if err != nil {
		return fmt.Errorf("demo org not found: %w", err)
	}

	aiSystems := []struct {
		name, purpose, provider, modality string
		eu, agentic                       bool
	}{
		{"Credit Scorer", "credit scoring for loan applications", "in-house", "tabular", true, false},
		{"HR Screener", "employment candidate screening", "third-party", "text", true, false},
		{"Chat Support", "general customer support chatbot", "in-house", "text", false, false},
		{"Medical Triage", "healthcare preliminary assessment", "in-house", "multi", true, false},
		{"Fraud Detector", "financial fraud detection", "third-party", "tabular", true, false},
		{"Content Moderator", "social media content review", "in-house", "vision", false, false},
		{"Agentic Researcher", "autonomous research assistant", "in-house", "text", true, true},
		{"Biometric ID", "biometric identification for access", "third-party", "vision", true, false},
	}

	for _, sys := range aiSystems {
		_, err := tx.Exec(ctx,
			`INSERT INTO assets (org_id, asset_type, name, description, metadata, lifecycle_status)
			 VALUES ($1, 'ai_system', $2, $3, '{}', 'active')`,
			orgID, sys.name, sys.purpose,
		)
		if err != nil {
			return fmt.Errorf("insert asset %s: %w", sys.name, err)
		}
	}

	return tx.Commit(ctx)
}
