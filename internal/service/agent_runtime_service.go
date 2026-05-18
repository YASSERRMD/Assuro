package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// BehaviorLog records a single agent action.
type BehaviorLog struct {
	ID         string          `json:"id"`
	AgentID    string          `json:"agent_id"`
	OrgID      string          `json:"org_id"`
	Action     string          `json:"action"`
	Input      json.RawMessage `json:"input"`
	Output     json.RawMessage `json:"output"`
	LatencyMs  *int            `json:"latency_ms,omitempty"`
	Status     string          `json:"status"`
	Metadata   json.RawMessage `json:"metadata"`
	OccurredAt string          `json:"occurred_at"`
}

// GuardrailPolicy defines conditions under which agent actions are blocked, warned, or logged.
type GuardrailPolicy struct {
	ID          string          `json:"id"`
	OrgID       string          `json:"org_id"`
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	PolicyType  string          `json:"policy_type"`
	Conditions  json.RawMessage `json:"conditions"`
	Enabled     bool            `json:"enabled"`
	CreatedBy   *string         `json:"created_by,omitempty"`
	CreatedAt   string          `json:"created_at"`
	UpdatedAt   string          `json:"updated_at"`
}

// AgentAnomaly represents a detected anomalous behavior for an agent.
type AgentAnomaly struct {
	ID          string  `json:"id"`
	AgentID     string  `json:"agent_id"`
	OrgID       string  `json:"org_id"`
	AnomalyType string  `json:"anomaly_type"`
	Severity    string  `json:"severity"`
	Description string  `json:"description,omitempty"`
	LogID       *string `json:"log_id,omitempty"`
	Resolved    bool    `json:"resolved"`
	DetectedAt  string  `json:"detected_at"`
	ResolvedAt  *string `json:"resolved_at,omitempty"`
}

// AgentRuntimeService manages behavior logs, guardrail policies, kill-switch and anomalies.
type AgentRuntimeService struct {
	db *store.DB
}

// NewAgentRuntimeService creates an AgentRuntimeService.
func NewAgentRuntimeService(db *store.DB) *AgentRuntimeService {
	return &AgentRuntimeService{db: db}
}

// RecordBehavior logs an agent action. Returns the log ID and, if a guardrail blocks it, an error.
func (s *AgentRuntimeService) RecordBehavior(ctx context.Context, l BehaviorLog) (*BehaviorLog, error) {
	if l.Input == nil {
		l.Input = json.RawMessage("{}")
	}
	if l.Output == nil {
		l.Output = json.RawMessage("{}")
	}
	if l.Metadata == nil {
		l.Metadata = json.RawMessage("{}")
	}
	if l.Status == "" {
		l.Status = "ok"
	}
	var id, occurredAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO agent_behavior_logs
		   (agent_id, org_id, action, input, output, latency_ms, status, metadata)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		 RETURNING id, occurred_at::text`,
		l.AgentID, l.OrgID, l.Action, l.Input, l.Output, l.LatencyMs, l.Status, l.Metadata,
	).Scan(&id, &occurredAt)
	if err != nil {
		return nil, fmt.Errorf("record behavior: %w", err)
	}
	l.ID = id
	l.OccurredAt = occurredAt
	return &l, nil
}

// ListBehaviorLogs returns behavior logs for an agent.
func (s *AgentRuntimeService) ListBehaviorLogs(ctx context.Context, agentID, orgID, status string, limit int) ([]BehaviorLog, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, agent_id, org_id, action, input, output,
		        latency_ms, status, metadata, occurred_at::text
		 FROM agent_behavior_logs
		 WHERE agent_id=$1 AND org_id=$2
		   AND ($3='' OR status=$3)
		 ORDER BY occurred_at DESC
		 LIMIT $4`,
		agentID, orgID, status, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("list behavior logs: %w", err)
	}
	defer rows.Close()

	var out []BehaviorLog
	for rows.Next() {
		var l BehaviorLog
		if err := rows.Scan(&l.ID, &l.AgentID, &l.OrgID, &l.Action,
			&l.Input, &l.Output, &l.LatencyMs, &l.Status, &l.Metadata, &l.OccurredAt); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

// KillSwitch suspends an agent immediately.
func (s *AgentRuntimeService) KillSwitch(ctx context.Context, agentID, orgID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE agents SET status='suspended', updated_at=now() WHERE id=$1 AND org_id=$2`,
		agentID, orgID,
	)
	return err
}

// CreateGuardrailPolicy creates a new policy.
func (s *AgentRuntimeService) CreateGuardrailPolicy(ctx context.Context, pol GuardrailPolicy) (*GuardrailPolicy, error) {
	if pol.Conditions == nil {
		pol.Conditions = json.RawMessage("{}")
	}
	if pol.PolicyType == "" {
		pol.PolicyType = "block"
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO guardrail_policies
		   (org_id, name, description, policy_type, conditions, enabled, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		pol.OrgID, pol.Name, pol.Description, pol.PolicyType, pol.Conditions, pol.Enabled, derefStr(pol.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create guardrail policy: %w", err)
	}
	pol.ID = id
	pol.CreatedAt = createdAt
	pol.UpdatedAt = updatedAt
	return &pol, nil
}

// ListGuardrailPolicies returns policies for an org.
func (s *AgentRuntimeService) ListGuardrailPolicies(ctx context.Context, orgID string, enabledOnly bool) ([]GuardrailPolicy, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, name, COALESCE(description,''), policy_type, conditions,
		        enabled, created_by::text, created_at::text, updated_at::text
		 FROM guardrail_policies
		 WHERE org_id=$1 AND (NOT $2 OR enabled)
		 ORDER BY created_at DESC`,
		orgID, enabledOnly,
	)
	if err != nil {
		return nil, fmt.Errorf("list guardrail policies: %w", err)
	}
	defer rows.Close()

	var out []GuardrailPolicy
	for rows.Next() {
		var pol GuardrailPolicy
		if err := rows.Scan(&pol.ID, &pol.OrgID, &pol.Name, &pol.Description,
			&pol.PolicyType, &pol.Conditions, &pol.Enabled, &pol.CreatedBy,
			&pol.CreatedAt, &pol.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, pol)
	}
	return out, rows.Err()
}

// ToggleGuardrailPolicy enables or disables a policy.
func (s *AgentRuntimeService) ToggleGuardrailPolicy(ctx context.Context, id, orgID string, enabled bool) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE guardrail_policies SET enabled=$1, updated_at=now() WHERE id=$2 AND org_id=$3`,
		enabled, id, orgID,
	)
	return err
}

// RecordAnomaly stores a detected anomaly for an agent.
func (s *AgentRuntimeService) RecordAnomaly(ctx context.Context, a AgentAnomaly) (*AgentAnomaly, error) {
	if a.Severity == "" {
		a.Severity = "medium"
	}
	var id, detectedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO agent_anomalies
		   (agent_id, org_id, anomaly_type, severity, description, log_id)
		 VALUES ($1,$2,$3,$4,$5,NULLIF($6,'')::uuid)
		 RETURNING id, detected_at::text`,
		a.AgentID, a.OrgID, a.AnomalyType, a.Severity, a.Description, derefStr(a.LogID),
	).Scan(&id, &detectedAt)
	if err != nil {
		return nil, fmt.Errorf("record anomaly: %w", err)
	}
	a.ID = id
	a.DetectedAt = detectedAt
	return &a, nil
}

// ListAnomalies returns anomalies for an org or agent.
func (s *AgentRuntimeService) ListAnomalies(ctx context.Context, orgID, agentID string, resolvedOnly bool) ([]AgentAnomaly, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, agent_id, org_id, anomaly_type, severity,
		        COALESCE(description,''), log_id::text, resolved,
		        detected_at::text, resolved_at::text
		 FROM agent_anomalies
		 WHERE org_id=$1
		   AND ($2='' OR agent_id::text=$2)
		   AND (NOT $3 OR NOT resolved)
		 ORDER BY detected_at DESC`,
		orgID, agentID, !resolvedOnly,
	)
	if err != nil {
		return nil, fmt.Errorf("list anomalies: %w", err)
	}
	defer rows.Close()

	var out []AgentAnomaly
	for rows.Next() {
		var a AgentAnomaly
		if err := rows.Scan(&a.ID, &a.AgentID, &a.OrgID, &a.AnomalyType, &a.Severity,
			&a.Description, &a.LogID, &a.Resolved, &a.DetectedAt, &a.ResolvedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// ResolveAnomaly marks an anomaly as resolved.
func (s *AgentRuntimeService) ResolveAnomaly(ctx context.Context, id, orgID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE agent_anomalies SET resolved=true, resolved_at=now()
		 WHERE id=$1 AND org_id=$2`,
		id, orgID,
	)
	return err
}
