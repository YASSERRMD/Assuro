package store

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

// SeedAll runs all seeders in order.
func SeedAll(ctx context.Context, db *DB) error {
	if err := SeedFrameworks(ctx, db); err != nil {
		return fmt.Errorf("seed frameworks: %w", err)
	}
	if err := SeedAssessmentTemplates(ctx, db); err != nil {
		return fmt.Errorf("seed templates: %w", err)
	}
	if err := SeedDemoOrg(ctx, db); err != nil {
		return fmt.Errorf("seed org: %w", err)
	}
	if err := SeedDemoData(ctx, db); err != nil {
		return fmt.Errorf("seed demo data: %w", err)
	}
	return nil
}

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

// SeedDemoData inserts rich demo data for evaluation.
func SeedDemoData(ctx context.Context, db *DB) error {
	var orgID pgtype.UUID
	err := db.Pool().QueryRow(ctx, "SELECT id FROM organizations WHERE slug = 'demo-org'").Scan(&orgID)
	if err != nil {
		return fmt.Errorf("demo org not found: %w", err)
	}

	var exists bool
	err = db.Pool().QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM assets WHERE org_id = $1)", orgID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("check assets: %w", err)
	}
	if exists {
		return nil
	}

	tx, err := db.Pool().Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	aiSystems := []struct {
		name, purpose, provider, modality, stage string
		eu, agentic                              bool
		sources, populations                     []string
	}{
		{
			name: "Credit Scorer v2", purpose: "credit scoring for loan applications",
			provider: "in-house", modality: "tabular", stage: "production",
			eu: true, agentic: false,
			sources:     []string{"bank_transactions", "credit_bureau"},
			populations: []string{"loan_applicants"},
		},
		{
			name: "HR Resume Screener", purpose: "employment candidate screening",
			provider: "third-party", modality: "text", stage: "production",
			eu: true, agentic: false,
			sources:     []string{"resume_database", "job_postings"},
			populations: []string{"job_seekers"},
		},
		{
			name: "Customer Support Chatbot", purpose: "general customer support chatbot",
			provider: "in-house", modality: "text", stage: "production",
			eu: false, agentic: false,
			sources:     []string{"knowledge_base", "ticket_history"},
			populations: []string{"customers"},
		},
		{
			name: "Medical Triage Assistant", purpose: "healthcare preliminary assessment",
			provider: "in-house", modality: "multi", stage: "testing",
			eu: true, agentic: false,
			sources:     []string{"patient_records", "medical_literature"},
			populations: []string{"patients", "healthcare_workers"},
		},
		{
			name: "Fraud Detection Engine", purpose: "financial fraud detection",
			provider: "third-party", modality: "tabular", stage: "production",
			eu: true, agentic: false,
			sources:     []string{"transaction_logs", "user_behavior"},
			populations: []string{"account_holders"},
		},
		{
			name: "Content Moderation AI", purpose: "social media content review",
			provider: "in-house", modality: "vision", stage: "production",
			eu: false, agentic: false,
			sources:     []string{"user_uploads", "community_reports"},
			populations: []string{"social_media_users"},
		},
		{
			name: "Agentic Research Assistant", purpose: "autonomous research and analysis",
			provider: "in-house", modality: "text", stage: "design",
			eu: true, agentic: true,
			sources:     []string{"web_crawl", "academic_papers"},
			populations: []string{"researchers", "analysts"},
		},
		{
			name: "Biometric Access Control", purpose: "biometric identification for secure access",
			provider: "third-party", modality: "vision", stage: "production",
			eu: true, agentic: false,
			sources:     []string{"facial_scan", "fingerprint_db"},
			populations: []string{"employees", "visitors"},
		},
	}

	assetIDs := make([]pgtype.UUID, len(aiSystems))
	for i, sys := range aiSystems {
		var assetID pgtype.UUID
		sourcesJSON, _ := json.Marshal(sys.sources)
		populationsJSON, _ := json.Marshal(sys.populations)

		err := tx.QueryRow(ctx,
			`INSERT INTO assets (org_id, asset_type, name, description, metadata, lifecycle_status)
			 VALUES ($1, 'ai_system', $2, $3, $4, 'active')
			 RETURNING id`,
			orgID, sys.name, sys.purpose,
			[]byte(`{"auto": true}`),
		).Scan(&assetID)
		if err != nil {
			return fmt.Errorf("insert asset %s: %w", sys.name, err)
		}
		assetIDs[i] = assetID

		_, err = tx.Exec(ctx,
			`INSERT INTO ai_system_details (asset_id, provider, model_family, modality, deployment_context,
			 data_sources, intended_purpose, affected_populations, eu_market_exposure, is_agentic,
			 autonomy_level, lifecycle_stage)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			assetID, sys.provider, "custom-model", sys.modality, "cloud",
			sourcesJSON, sys.purpose, populationsJSON,
			sys.eu, sys.agentic, int32(2), sys.stage,
		)
		if err != nil {
			return fmt.Errorf("insert details %s: %w", sys.name, err)
		}
	}

	var controlIDs []pgtype.UUID
	rows, err := tx.Query(ctx, "SELECT id FROM controls ORDER BY key")
	if err != nil {
		return fmt.Errorf("list controls: %w", err)
	}
	for rows.Next() {
		var cid pgtype.UUID
		if err := rows.Scan(&cid); err != nil {
			return fmt.Errorf("scan control: %w", err)
		}
		controlIDs = append(controlIDs, cid)
	}
	rows.Close()

	statuses := []string{"implemented", "in_progress", "not_started"}
	for i, aid := range assetIDs {
		for j, cid := range controlIDs {
			status := statuses[(i+j)%len(statuses)]
			_, err := tx.Exec(ctx,
				`INSERT INTO asset_control_status (asset_id, control_id, status, justification)
				 VALUES ($1, $2, $3, $4)`,
				aid, cid, status, "Demo justification",
			)
			if err != nil {
				return fmt.Errorf("insert control status: %w", err)
			}
		}
	}

	var templateID pgtype.UUID
	err = tx.QueryRow(ctx, "SELECT id FROM assessment_templates WHERE key = 'eu_ai_act_high_risk'").Scan(&templateID)
	if err != nil {
		return fmt.Errorf("find template: %w", err)
	}

	for i := 0; i < 3; i++ {
		status := "completed"
		if i == 2 {
			status = "draft"
		}
		var assessID pgtype.UUID
		err := tx.QueryRow(ctx,
			`INSERT INTO assessments (org_id, asset_id, template_id, status)
			 VALUES ($1, $2, $3, $4) RETURNING id`,
			orgID, assetIDs[i], templateID, status,
		).Scan(&assessID)
		if err != nil {
			return fmt.Errorf("insert assessment: %w", err)
		}

		if status == "completed" {
			var qID pgtype.UUID
			err := tx.QueryRow(ctx, "SELECT id FROM template_questions WHERE template_id = $1 LIMIT 1", templateID).Scan(&qID)
			if err == nil {
				_, _ = tx.Exec(ctx,
					`INSERT INTO assessment_responses (assessment_id, question_id, answer)
					 VALUES ($1, $2, $3)`,
					assessID, qID, []byte(`"yes"`),
				)
			}
		}
	}

	for i := 0; i < 4; i++ {
		sev := []string{"low", "medium", "high", "critical"}[i]
		stat := []string{"closed", "mitigated", "investigating", "open"}[i]
		_, err := tx.Exec(ctx,
			`INSERT INTO incidents (org_id, asset_id, title, description, severity, status)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			orgID, assetIDs[i],
			fmt.Sprintf("Demo incident %d", i+1),
			fmt.Sprintf("Description for incident %d", i+1),
			sev, stat,
		)
		if err != nil {
			return fmt.Errorf("insert incident: %w", err)
		}
	}

	return tx.Commit(ctx)
}
