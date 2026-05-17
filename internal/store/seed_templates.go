package store

import (
	"context"
	"fmt"
)

// SeedAssessmentTemplates inserts built-in assessment templates.
func SeedAssessmentTemplates(ctx context.Context, db *DB) error {
	var exists bool
	err := db.Pool().QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM assessment_templates LIMIT 1)").Scan(&exists)
	if err != nil {
		return fmt.Errorf("check templates: %w", err)
	}
	if exists {
		return nil
	}

	tx, err := db.Pool().Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var templateID string
	err = tx.QueryRow(ctx,
		"INSERT INTO assessment_templates (key, title, description, domain) VALUES ($1, $2, $3, 'ai_governance') RETURNING id",
		"eu_ai_act_high_risk", "EU AI Act High-Risk Readiness",
		"Assessment for EU AI Act Annex III high-risk AI systems",
	).Scan(&templateID)
	if err != nil {
		return fmt.Errorf("insert template: %w", err)
	}

	questions := []struct {
		order      int
		prompt     string
		help       string
		answerType string
		controlKey string
	}{
		{1, "Has a risk management system been established?", "Document your risk management approach", "yesno", "CTL-RISK-01"},
		{2, "Are training data sources documented and validated?", "Include data provenance and quality checks", "yesno", "CTL-DATA-01"},
		{3, "Is technical documentation maintained and up to date?", "Reference your documentation system", "yesno", "CTL-DOC-01"},
		{4, "Are system events and decisions automatically logged?", "Describe your logging infrastructure", "yesno", "CTL-LOG-01"},
		{5, "Do users receive clear information about the AI system?", "Include transparency measures", "yesno", "CTL-TRANS-01"},
		{6, "Is human oversight implemented for critical decisions?", "Describe the human-in-the-loop process", "yesno", "CTL-HUMAN-01"},
		{7, "Has a governance framework been established?", "Include roles, responsibilities, and escalation", "yesno", "CTL-GOV-01"},
		{8, "Are adequate resources allocated for AI governance?", "Include budget, staffing, and tools", "yesno", "CTL-RES-01"},
		{9, "What is the intended purpose of this AI system?", "Describe the primary use case", "text", ""},
		{10, "Which population groups are affected by this system?", "List all affected groups", "multi", ""},
		{11, "Rate the autonomy level of this system (1-5)", "1=fully manual, 5=fully autonomous", "number", ""},
		{12, "Is this system deployed in the EU market?", "Include any EU member state exposure", "yesno", ""},
	}

	for _, q := range questions {
		controlID := "NULL"
		if q.controlKey != "" {
			var cid string
			err := tx.QueryRow(ctx, "SELECT id FROM controls WHERE key = $1", q.controlKey).Scan(&cid)
			if err == nil {
				controlID = "'" + cid + "'"
			}
		}

		_, err := tx.Exec(ctx,
			`INSERT INTO template_questions (template_id, order_index, prompt, help_text, answer_type, control_id)
			 VALUES ($1, $2, $3, $4, $5, `+controlID+`)`,
			templateID, q.order, q.prompt, q.help, q.answerType,
		)
		if err != nil {
			return fmt.Errorf("insert question %d: %w", q.order, err)
		}
	}

	return tx.Commit(ctx)
}
