package store

import (
	"context"
	"fmt"
)

// SeedFrameworks inserts built-in frameworks, requirements, controls and crosswalk.
func SeedFrameworks(ctx context.Context, db *DB) error {
	var exists bool
	err := db.Pool().QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM frameworks LIMIT 1)").Scan(&exists)
	if err != nil {
		return fmt.Errorf("check frameworks: %w", err)
	}
	if exists {
		return nil
	}

	tx, err := db.Pool().Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	frameworks := []struct{ key, name, version string }{
		{"eu_ai_act", "EU AI Act", "2024"},
		{"nist_ai_rmf", "NIST AI RMF", "1.0"},
		{"iso_42001", "ISO/IEC 42001", "2023"},
	}

	fwIDs := make(map[string]string)
	for _, fw := range frameworks {
		var id string
		err := tx.QueryRow(ctx,
			"INSERT INTO frameworks (key, name, version) VALUES ($1, $2, $3) RETURNING id",
			fw.key, fw.name, fw.version,
		).Scan(&id)
		if err != nil {
			return fmt.Errorf("insert framework %s: %w", fw.key, err)
		}
		fwIDs[fw.key] = id
	}

	requirements := []struct {
		fwKey, refCode, title, desc string
	}{
		{"eu_ai_act", "AIII-1", "Risk Management System", "Implement risk management for high-risk AI"},
		{"eu_ai_act", "AIII-2", "Data Governance", "Ensure training data quality and relevance"},
		{"eu_ai_act", "AIII-3", "Technical Documentation", "Maintain comprehensive technical docs"},
		{"eu_ai_act", "AIII-4", "Record Keeping", "Automated logging of AI system events"},
		{"eu_ai_act", "AIII-5", "Transparency", "Provide clear information to users"},
		{"eu_ai_act", "AIII-6", "Human Oversight", "Enable effective human oversight"},
		{"nist_ai_rmf", "GOV-1", "AI Governance Policy", "Establish organizational AI governance"},
		{"nist_ai_rmf", "GOV-2", "Risk Tolerance", "Define and communicate risk tolerance"},
		{"nist_ai_rmf", "MAP-1", "Context Establishment", "Establish operational context"},
		{"nist_ai_rmf", "MAP-2", "Impact Assessment", "Assess potential impacts"},
		{"nist_ai_rmf", "GOV-3", "Legal Compliance", "Ensure compliance with laws"},
		{"iso_42001", "C-5.1", "AIMS Policy", "Establish AI management system policy"},
		{"iso_42001", "C-6.1", "Risk Actions Planning", "Plan actions to address risks"},
		{"iso_42001", "C-7.1", "Resource Provision", "Provide necessary resources"},
		{"iso_42001", "C-8.1", "Operational Control", "Implement operational controls"},
	}

	reqIDs := make(map[string]string)
	for _, req := range requirements {
		var id string
		err := tx.QueryRow(ctx,
			"INSERT INTO framework_requirements (framework_id, ref_code, title, description) VALUES ($1, $2, $3, $4) RETURNING id",
			fwIDs[req.fwKey], req.refCode, req.title, req.desc,
		).Scan(&id)
		if err != nil {
			return fmt.Errorf("insert requirement %s: %w", req.refCode, err)
		}
		reqIDs[req.refCode] = id
	}

	controls := []struct {
		key, title, desc string
		reqs             []string
	}{
		{"CTL-RISK-01", "Risk Management Process", "Establish and maintain risk management", []string{"AIII-1", "MAP-2", "C-6.1"}},
		{"CTL-DATA-01", "Data Quality Controls", "Validate and monitor data quality", []string{"AIII-2", "MAP-1"}},
		{"CTL-DOC-01", "Technical Documentation", "Maintain system documentation", []string{"AIII-3", "GOV-1"}},
		{"CTL-LOG-01", "Activity Logging", "Log system events and decisions", []string{"AIII-4", "C-8.1"}},
		{"CTL-TRANS-01", "User Transparency", "Provide clear user information", []string{"AIII-5", "GOV-3"}},
		{"CTL-HUMAN-01", "Human Oversight", "Implement human review mechanisms", []string{"AIII-6", "C-8.1"}},
		{"CTL-GOV-01", "Governance Framework", "Establish governance structures", []string{"GOV-1", "GOV-2", "C-5.1"}},
		{"CTL-RES-01", "Resource Management", "Ensure adequate resource allocation", []string{"GOV-3", "C-7.1"}},
	}

	for _, ctrl := range controls {
		var id string
		err := tx.QueryRow(ctx,
			"INSERT INTO controls (key, title, description, domain) VALUES ($1, $2, $3, 'ai_governance') RETURNING id",
			ctrl.key, ctrl.title, ctrl.desc,
		).Scan(&id)
		if err != nil {
			return fmt.Errorf("insert control %s: %w", ctrl.key, err)
		}

		for _, rc := range ctrl.reqs {
			rid, ok := reqIDs[rc]
			if !ok {
				continue
			}
			_, err := tx.Exec(ctx,
				"INSERT INTO control_requirement_map (control_id, requirement_id) VALUES ($1, $2)",
				id, rid,
			)
			if err != nil {
				return fmt.Errorf("map control %s to %s: %w", ctrl.key, rc, err)
			}
		}
	}

	return tx.Commit(ctx)
}
