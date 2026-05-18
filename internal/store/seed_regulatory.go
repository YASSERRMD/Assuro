package store

import (
	"context"
	"fmt"
)

// regulatoryFramework holds metadata for a compliance framework.
type regulatoryFramework struct {
	key, name, version, description, region string
}

// regulatoryRequirement is a single article/clause/control reference.
type regulatoryRequirement struct {
	fwKey, refCode, title, desc, articleRef, obligationLevel string
	tags                                                      []string
}

// regulatoryControl is a platform control with domain and guidance.
type regulatoryControl struct {
	key, title, desc, domain, guidance string
	tags                               []string
	reqs                               []string
}

var regulatoryFrameworks = []regulatoryFramework{
	{
		"eu_ai_act", "EU AI Act", "2024",
		"Regulation (EU) 2024/1689 on artificial intelligence - risk-based classification and obligations for AI systems",
		"EU",
	},
	{
		"nist_ai_rmf", "NIST AI RMF", "1.0",
		"NIST AI Risk Management Framework - voluntary guidance to manage AI risks across the AI lifecycle",
		"US",
	},
	{
		"iso_42001", "ISO/IEC 42001", "2023",
		"International standard specifying requirements for an AI management system (AIMS)",
		"International",
	},
}

var regulatoryRequirements = []regulatoryRequirement{
	// EU AI Act - Chapter III obligations
	{"eu_ai_act", "AIA-9", "Risk Management System", "Establish and maintain a risk management system for high-risk AI systems throughout the lifecycle.", "Article 9", "mandatory", []string{"risk", "governance"}},
	{"eu_ai_act", "AIA-10", "Data and Data Governance", "Ensure training, validation and testing datasets meet quality criteria relevant to the intended purpose.", "Article 10", "mandatory", []string{"data", "quality"}},
	{"eu_ai_act", "AIA-11", "Technical Documentation", "Draw up and maintain technical documentation demonstrating compliance before market placement.", "Article 11", "mandatory", []string{"documentation", "transparency"}},
	{"eu_ai_act", "AIA-12", "Record Keeping", "Design high-risk AI with automatic logging capabilities enabling traceability throughout the lifecycle.", "Article 12", "mandatory", []string{"logging", "traceability"}},
	{"eu_ai_act", "AIA-13", "Transparency and Information", "Ensure high-risk AI systems are transparent and users receive adequate information.", "Article 13", "mandatory", []string{"transparency", "users"}},
	{"eu_ai_act", "AIA-14", "Human Oversight", "Design AI systems to allow effective human oversight, including ability to intervene or halt.", "Article 14", "mandatory", []string{"human-oversight", "control"}},
	{"eu_ai_act", "AIA-15", "Accuracy, Robustness, Cybersecurity", "Achieve appropriate levels of accuracy, robustness and cybersecurity throughout the lifecycle.", "Article 15", "mandatory", []string{"accuracy", "security", "robustness"}},
	{"eu_ai_act", "AIA-16", "Obligations of Providers", "Providers must register systems, affix CE marking, comply with post-market monitoring.", "Article 16", "mandatory", []string{"registration", "compliance"}},
	{"eu_ai_act", "AIA-26", "Obligations of Deployers", "Deployers must use AI systems according to instructions, monitor operation, inform affected people.", "Article 26", "mandatory", []string{"deployer", "monitoring"}},
	{"eu_ai_act", "AIA-62", "Post-Market Monitoring", "Providers must implement a post-market monitoring system proportionate to risk.", "Article 62", "mandatory", []string{"monitoring", "post-market"}},

	// NIST AI RMF - GOVERN
	{"nist_ai_rmf", "GOV-1.1", "AI Risk Management Policy", "Policies, processes and procedures for AI risk management are established and maintained.", "GOVERN 1.1", "mandatory", []string{"governance", "policy"}},
	{"nist_ai_rmf", "GOV-1.2", "Risk Tolerance", "The risk tolerance for AI systems is defined and communicated across the organization.", "GOVERN 1.2", "mandatory", []string{"governance", "risk-tolerance"}},
	{"nist_ai_rmf", "GOV-1.3", "Organizational Culture", "Organizational teams are committed to a culture of AI risk management.", "GOVERN 1.3", "recommended", []string{"governance", "culture"}},
	{"nist_ai_rmf", "GOV-2.1", "AI Roles and Responsibilities", "Roles and responsibilities for AI risk management are established and documented.", "GOVERN 2.1", "mandatory", []string{"governance", "roles"}},
	{"nist_ai_rmf", "GOV-3.1", "Legal and Compliance", "AI risk management is informed by applicable laws, regulations, standards and best practices.", "GOVERN 3.1", "mandatory", []string{"compliance", "legal"}},
	{"nist_ai_rmf", "GOV-4.1", "Organizational Teams", "Organizational teams are committed to a responsible and trustworthy approach to AI.", "GOVERN 4.1", "recommended", []string{"governance", "teams"}},
	// NIST AI RMF - MAP
	{"nist_ai_rmf", "MAP-1.1", "Context Establishment", "Context is established for the AI lifecycle including mission, goals, objectives and constraints.", "MAP 1.1", "mandatory", []string{"context", "planning"}},
	{"nist_ai_rmf", "MAP-1.5", "Organizational Risk Priorities", "Organizational risk priorities are established and communicated.", "MAP 1.5", "mandatory", []string{"risk", "priorities"}},
	{"nist_ai_rmf", "MAP-2.1", "Scientific Validity", "The scientific validity of AI systems is assessed and documented.", "MAP 2.1", "recommended", []string{"validity", "science"}},
	{"nist_ai_rmf", "MAP-3.1", "Impact Assessment", "Potential benefits and costs of AI systems are identified and assessed.", "MAP 3.1", "mandatory", []string{"impact", "assessment"}},
	{"nist_ai_rmf", "MAP-5.1", "Likelihood and Impact", "Likelihood and magnitude of each identified AI risk is estimated.", "MAP 5.1", "mandatory", []string{"risk", "likelihood"}},
	// NIST AI RMF - MEASURE
	{"nist_ai_rmf", "MEA-1.1", "Testing Approach", "Testing of the AI system is conducted using established methods and metrics.", "MEASURE 1.1", "mandatory", []string{"testing", "metrics"}},
	{"nist_ai_rmf", "MEA-2.1", "Bias and Fairness", "AI system metrics are evaluated for bias, fairness and equity.", "MEASURE 2.1", "mandatory", []string{"fairness", "bias"}},
	{"nist_ai_rmf", "MEA-2.5", "Explainability", "AI system explainability and interpretability objectives are defined.", "MEASURE 2.5", "recommended", []string{"explainability", "transparency"}},
	{"nist_ai_rmf", "MEA-3.1", "Performance Monitoring", "Identified AI risks are monitored over the lifecycle.", "MEASURE 3.1", "mandatory", []string{"monitoring", "performance"}},
	// NIST AI RMF - MANAGE
	{"nist_ai_rmf", "MAN-1.1", "Risk Responses", "A plan for responding to risks is established and maintained.", "MANAGE 1.1", "mandatory", []string{"risk-response", "planning"}},
	{"nist_ai_rmf", "MAN-2.2", "Risk Treatment", "Mechanisms for AI risk treatment are established and implemented.", "MANAGE 2.2", "mandatory", []string{"risk-treatment", "controls"}},
	{"nist_ai_rmf", "MAN-3.1", "Risk Responses Activated", "Risk responses are activated and documented when AI risk exceeds tolerance.", "MANAGE 3.1", "mandatory", []string{"incident", "response"}},
	{"nist_ai_rmf", "MAN-4.1", "Residual Risk", "Post-response residual risks are documented and tracked.", "MANAGE 4.1", "recommended", []string{"residual-risk", "tracking"}},

	// ISO 42001 - AI Management System
	{"iso_42001", "ISO-4.1", "Understanding the Organization", "Determine external and internal issues relevant to AI management system.", "Clause 4.1", "mandatory", []string{"context", "governance"}},
	{"iso_42001", "ISO-4.2", "Interested Parties", "Identify interested parties and their requirements relevant to AI management.", "Clause 4.2", "mandatory", []string{"stakeholders", "requirements"}},
	{"iso_42001", "ISO-4.3", "AIMS Scope", "Determine the scope of the AI management system.", "Clause 4.3", "mandatory", []string{"scope", "governance"}},
	{"iso_42001", "ISO-5.1", "Leadership Commitment", "Top management demonstrates leadership and commitment to the AIMS.", "Clause 5.1", "mandatory", []string{"leadership", "governance"}},
	{"iso_42001", "ISO-5.2", "AI Policy", "Establish, implement and maintain an AI policy.", "Clause 5.2", "mandatory", []string{"policy", "governance"}},
	{"iso_42001", "ISO-5.3", "Roles and Responsibilities", "Assign and communicate AI management roles and responsibilities.", "Clause 5.3", "mandatory", []string{"roles", "governance"}},
	{"iso_42001", "ISO-6.1", "Risk and Opportunity Actions", "Plan actions to address risks and opportunities in AI development and use.", "Clause 6.1", "mandatory", []string{"risk", "planning"}},
	{"iso_42001", "ISO-6.2", "AI Objectives", "Establish measurable AI objectives and plans to achieve them.", "Clause 6.2", "mandatory", []string{"objectives", "planning"}},
	{"iso_42001", "ISO-7.1", "Resources", "Provide necessary resources for the AIMS.", "Clause 7.1", "mandatory", []string{"resources", "operations"}},
	{"iso_42001", "ISO-7.2", "Competence", "Ensure persons affecting AI performance are competent.", "Clause 7.2", "mandatory", []string{"competence", "training"}},
	{"iso_42001", "ISO-7.3", "Awareness", "Ensure awareness of the AI policy and their contribution.", "Clause 7.3", "mandatory", []string{"awareness", "training"}},
	{"iso_42001", "ISO-7.4", "Communication", "Determine internal and external communications relevant to the AIMS.", "Clause 7.4", "recommended", []string{"communication", "transparency"}},
	{"iso_42001", "ISO-8.1", "Operational Planning and Control", "Plan, implement, control and maintain processes needed to meet requirements.", "Clause 8.1", "mandatory", []string{"operations", "control"}},
	{"iso_42001", "ISO-8.2", "AI Risk Assessment", "Conduct AI risk assessments at planned intervals.", "Clause 8.2", "mandatory", []string{"risk-assessment", "operations"}},
	{"iso_42001", "ISO-8.3", "AI Risk Treatment", "Implement AI risk treatment plans and retain documented information.", "Clause 8.3", "mandatory", []string{"risk-treatment", "operations"}},
	{"iso_42001", "ISO-9.1", "Monitoring and Measurement", "Monitor, measure, analyze and evaluate AI management performance.", "Clause 9.1", "mandatory", []string{"monitoring", "measurement"}},
	{"iso_42001", "ISO-9.2", "Internal Audit", "Conduct internal audits at planned intervals.", "Clause 9.2", "mandatory", []string{"audit", "compliance"}},
	{"iso_42001", "ISO-9.3", "Management Review", "Top management reviews the AIMS at planned intervals.", "Clause 9.3", "mandatory", []string{"review", "governance"}},
	{"iso_42001", "ISO-10.1", "Nonconformity and Corrective Action", "React to nonconformities and take corrective actions.", "Clause 10.1", "mandatory", []string{"corrective-action", "compliance"}},
	{"iso_42001", "ISO-10.2", "Continual Improvement", "Continually improve the suitability, adequacy and effectiveness of the AIMS.", "Clause 10.2", "mandatory", []string{"improvement", "governance"}},
}

var regulatoryControls = []regulatoryControl{
	{
		"CTL-RISK-01", "Risk Management Process",
		"Establish and maintain a documented risk management process covering identification, assessment, treatment and review.",
		"risk_management", "Document risk register, assign owners, schedule quarterly reviews.",
		[]string{"risk", "governance"},
		[]string{"AIA-9", "GOV-1.1", "MAP-5.1", "ISO-6.1", "ISO-8.2"},
	},
	{
		"CTL-RISK-02", "Risk Tolerance Statement",
		"Define and document organizational risk tolerance for AI systems with board-level approval.",
		"risk_management", "Publish risk appetite statement, link to AI system classification criteria.",
		[]string{"risk", "governance"},
		[]string{"GOV-1.2", "MAP-1.5"},
	},
	{
		"CTL-DATA-01", "Data Quality Controls",
		"Validate and monitor data quality for training, validation and testing datasets.",
		"data_governance", "Implement data profiling, lineage tracking and quality gates in pipelines.",
		[]string{"data", "quality"},
		[]string{"AIA-10"},
	},
	{
		"CTL-DATA-02", "Data Governance Policy",
		"Establish data governance policies covering collection, use, retention and deletion of AI training data.",
		"data_governance", "Document data sources, retention periods and consent mechanisms.",
		[]string{"data", "policy"},
		[]string{"AIA-10", "ISO-4.2"},
	},
	{
		"CTL-DOC-01", "Technical Documentation",
		"Maintain technical documentation describing AI system purpose, architecture, training, testing and limitations.",
		"documentation", "Use a documentation template covering all Article 11 annexes; review on each major release.",
		[]string{"documentation", "transparency"},
		[]string{"AIA-11", "GOV-1.1"},
	},
	{
		"CTL-LOG-01", "Activity Logging",
		"Log AI system events, predictions and decisions with timestamps sufficient for audit and investigation.",
		"monitoring", "Configure structured logging with correlation IDs; retain logs for minimum 3 years.",
		[]string{"logging", "traceability"},
		[]string{"AIA-12", "ISO-8.1"},
	},
	{
		"CTL-TRANS-01", "User Transparency",
		"Provide clear, accessible information to users about AI capabilities, limitations and decision logic.",
		"transparency", "Publish user-facing disclosures; include in onboarding flows.",
		[]string{"transparency", "users"},
		[]string{"AIA-13", "MEA-2.5"},
	},
	{
		"CTL-TRANS-02", "AI System Disclosure",
		"Disclose to affected individuals when a decision is made by or with material AI input.",
		"transparency", "Implement disclosure notices in automated decision workflows.",
		[]string{"transparency", "disclosure"},
		[]string{"AIA-13", "AIA-26"},
	},
	{
		"CTL-HUMAN-01", "Human Oversight Mechanism",
		"Implement controls allowing humans to monitor, override or halt AI system outputs.",
		"human_oversight", "Build override interfaces, escalation paths and kill-switch procedures.",
		[]string{"human-oversight", "control"},
		[]string{"AIA-14", "MAN-3.1"},
	},
	{
		"CTL-HUMAN-02", "Human Review of High-Risk Outputs",
		"Require human review for outputs above defined risk thresholds before action is taken.",
		"human_oversight", "Define risk thresholds per use case; configure mandatory review queues.",
		[]string{"human-oversight", "review"},
		[]string{"AIA-14", "MAN-1.1"},
	},
	{
		"CTL-SEC-01", "AI System Security Controls",
		"Implement cybersecurity controls protecting AI systems from adversarial attacks and unauthorized access.",
		"security", "Apply OWASP AI controls; conduct adversarial testing quarterly.",
		[]string{"security", "robustness"},
		[]string{"AIA-15", "MEA-1.1"},
	},
	{
		"CTL-ACC-01", "Accuracy Benchmarking",
		"Define, measure and report accuracy metrics against agreed benchmarks for each deployed AI system.",
		"performance", "Set per-model KPIs; monitor drift with automated alerts.",
		[]string{"accuracy", "performance"},
		[]string{"AIA-15", "MEA-1.1", "MEA-3.1"},
	},
	{
		"CTL-FAIR-01", "Bias and Fairness Assessment",
		"Assess AI systems for demographic bias and document findings before deployment and annually thereafter.",
		"fairness", "Run fairness audit on test cohorts; document protected attribute analysis.",
		[]string{"fairness", "bias"},
		[]string{"MEA-2.1"},
	},
	{
		"CTL-EXPL-01", "Explainability Framework",
		"Define explainability requirements per use case and implement appropriate explanation techniques.",
		"transparency", "Select XAI method (SHAP, LIME, attention) appropriate to risk level.",
		[]string{"explainability", "transparency"},
		[]string{"MEA-2.5", "AIA-13"},
	},
	{
		"CTL-MON-01", "Post-Deployment Monitoring",
		"Monitor AI system performance, behavior and outcomes in production with automated alerting.",
		"monitoring", "Deploy observability stack with drift detection and incident alerting.",
		[]string{"monitoring", "operations"},
		[]string{"AIA-62", "MEA-3.1", "ISO-9.1"},
	},
	{
		"CTL-GOV-01", "AI Governance Framework",
		"Establish AI governance structures including policies, standards, roles and accountability.",
		"governance", "Stand up AI governance committee; publish AI code of conduct.",
		[]string{"governance", "policy"},
		[]string{"GOV-1.1", "GOV-2.1", "ISO-5.1", "ISO-5.2", "ISO-5.3"},
	},
	{
		"CTL-GOV-02", "AI Roles and Responsibilities",
		"Assign clear roles for AI system owners, developers, deployers and risk managers.",
		"governance", "Document RACI matrix; include in job descriptions.",
		[]string{"governance", "roles"},
		[]string{"GOV-2.1", "ISO-5.3"},
	},
	{
		"CTL-COMP-01", "Legal and Regulatory Compliance Review",
		"Review AI systems against applicable laws and regulations before deployment and when regulations change.",
		"compliance", "Maintain regulatory inventory; assign compliance owner to each AI system.",
		[]string{"compliance", "legal"},
		[]string{"GOV-3.1", "ISO-4.1", "ISO-4.2"},
	},
	{
		"CTL-TRAIN-01", "AI Competence and Training",
		"Ensure all personnel involved in AI development and deployment receive appropriate training.",
		"training", "Mandatory annual AI ethics and governance training for all AI practitioners.",
		[]string{"training", "competence"},
		[]string{"ISO-7.2", "ISO-7.3"},
	},
	{
		"CTL-AUDIT-01", "Internal AI Audit Program",
		"Conduct planned internal audits of AI systems and the AI management system.",
		"audit", "Annual AI audits by independent internal team; findings tracked to closure.",
		[]string{"audit", "compliance"},
		[]string{"ISO-9.2", "MAN-4.1"},
	},
	{
		"CTL-IMP-01", "Continual Improvement Process",
		"Establish a process for continual improvement of AI governance based on audit findings and incidents.",
		"governance", "Quarterly improvement reviews; board-level reporting on AIMS maturity.",
		[]string{"improvement", "governance"},
		[]string{"ISO-10.2", "MAN-4.1"},
	},
}

// SeedRegulatoryContent replaces the minimal seed with the full regulatory content library.
// It is idempotent - runs only if frameworks table is empty.
func SeedRegulatoryContent(ctx context.Context, db *DB) error {
	var exists bool
	if err := db.Pool().QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM frameworks LIMIT 1)").Scan(&exists); err != nil {
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

	fwIDs := make(map[string]string)
	for _, fw := range regulatoryFrameworks {
		var id string
		err := tx.QueryRow(ctx,
			`INSERT INTO frameworks (key, name, version, description, region)
			 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
			fw.key, fw.name, fw.version, fw.description, fw.region,
		).Scan(&id)
		if err != nil {
			return fmt.Errorf("insert framework %s: %w", fw.key, err)
		}
		fwIDs[fw.key] = id
	}

	reqIDs := make(map[string]string)
	for _, req := range regulatoryRequirements {
		fwID, ok := fwIDs[req.fwKey]
		if !ok {
			continue
		}
		if req.obligationLevel == "" {
			req.obligationLevel = "mandatory"
		}
		var id string
		err := tx.QueryRow(ctx,
			`INSERT INTO framework_requirements
			   (framework_id, ref_code, title, description, article_ref, obligation_level, tags)
			 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
			fwID, req.refCode, req.title, req.desc, req.articleRef, req.obligationLevel, req.tags,
		).Scan(&id)
		if err != nil {
			return fmt.Errorf("insert requirement %s: %w", req.refCode, err)
		}
		reqIDs[req.refCode] = id
	}

	for _, ctrl := range regulatoryControls {
		var id string
		err := tx.QueryRow(ctx,
			`INSERT INTO controls (key, title, description, domain, guidance, tags)
			 VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
			ctrl.key, ctrl.title, ctrl.desc, ctrl.domain, ctrl.guidance, ctrl.tags,
		).Scan(&id)
		if err != nil {
			return fmt.Errorf("insert control %s: %w", ctrl.key, err)
		}
		for _, rc := range ctrl.reqs {
			rid, ok := reqIDs[rc]
			if !ok {
				continue
			}
			_, _ = tx.Exec(ctx,
				`INSERT INTO control_requirement_map (control_id, requirement_id) VALUES ($1,$2)
				 ON CONFLICT DO NOTHING`,
				id, rid,
			)
		}
	}

	return tx.Commit(ctx)
}
