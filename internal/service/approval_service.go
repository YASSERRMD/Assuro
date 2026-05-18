package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// ApprovalWorkflow defines rules for how a resource type must be approved.
type ApprovalWorkflow struct {
	ID           string  `json:"id"`
	OrgID        string  `json:"org_id"`
	Name         string  `json:"name"`
	Description  string  `json:"description,omitempty"`
	ResourceType string  `json:"resource_type"`
	MinApprovals int     `json:"min_approvals"`
	Enabled      bool    `json:"enabled"`
	CreatedBy    *string `json:"created_by,omitempty"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

// ApprovalRequest is a pending change waiting for approval.
type ApprovalRequest struct {
	ID            string          `json:"id"`
	WorkflowID    string          `json:"workflow_id"`
	OrgID         string          `json:"org_id"`
	ResourceType  string          `json:"resource_type"`
	ResourceID    string          `json:"resource_id"`
	Title         string          `json:"title"`
	Description   string          `json:"description,omitempty"`
	Payload       json.RawMessage `json:"payload"`
	Status        string          `json:"status"`
	RequiredCount int             `json:"required_count"`
	ApprovedCount int             `json:"approved_count"`
	RequestedBy   string          `json:"requested_by"`
	DecidedAt     *string         `json:"decided_at,omitempty"`
	CreatedAt     string          `json:"created_at"`
	UpdatedAt     string          `json:"updated_at"`
}

// ApprovalDecision is a single approver's vote on a request.
type ApprovalDecision struct {
	ID        string `json:"id"`
	RequestID string `json:"request_id"`
	OrgID     string `json:"org_id"`
	UserID    string `json:"user_id"`
	Decision  string `json:"decision"`
	Comment   string `json:"comment,omitempty"`
	DecidedAt string `json:"decided_at"`
}

// ApprovalService manages approval workflows and requests.
type ApprovalService struct {
	db *store.DB
}

// NewApprovalService creates an ApprovalService.
func NewApprovalService(db *store.DB) *ApprovalService {
	return &ApprovalService{db: db}
}

// CreateWorkflow creates a new approval workflow definition.
func (s *ApprovalService) CreateWorkflow(ctx context.Context, wf ApprovalWorkflow) (*ApprovalWorkflow, error) {
	if wf.MinApprovals < 1 {
		wf.MinApprovals = 1
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO approval_workflows (org_id, name, description, resource_type, min_approvals, enabled, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		wf.OrgID, wf.Name, wf.Description, wf.ResourceType, wf.MinApprovals, wf.Enabled, derefStr(wf.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create approval workflow: %w", err)
	}
	wf.ID = id
	wf.CreatedAt = createdAt
	wf.UpdatedAt = updatedAt
	return &wf, nil
}

// ListWorkflows returns approval workflows for an org.
func (s *ApprovalService) ListWorkflows(ctx context.Context, orgID, resourceType string) ([]ApprovalWorkflow, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, name, COALESCE(description,''), resource_type,
		        min_approvals, enabled, created_by::text, created_at::text, updated_at::text
		 FROM approval_workflows
		 WHERE org_id=$1 AND ($2='' OR resource_type=$2)
		 ORDER BY created_at DESC`,
		orgID, resourceType,
	)
	if err != nil {
		return nil, fmt.Errorf("list approval workflows: %w", err)
	}
	defer rows.Close()

	var out []ApprovalWorkflow
	for rows.Next() {
		var wf ApprovalWorkflow
		if err := rows.Scan(&wf.ID, &wf.OrgID, &wf.Name, &wf.Description, &wf.ResourceType,
			&wf.MinApprovals, &wf.Enabled, &wf.CreatedBy, &wf.CreatedAt, &wf.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, wf)
	}
	return out, rows.Err()
}

// SubmitRequest creates a new approval request.
func (s *ApprovalService) SubmitRequest(ctx context.Context, req ApprovalRequest) (*ApprovalRequest, error) {
	if req.Payload == nil {
		req.Payload = json.RawMessage("{}")
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO approval_requests
		   (workflow_id, org_id, resource_type, resource_id, title, description,
		    payload, required_count, requested_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		 RETURNING id, created_at::text, updated_at::text`,
		req.WorkflowID, req.OrgID, req.ResourceType, req.ResourceID, req.Title, req.Description,
		req.Payload, req.RequiredCount, req.RequestedBy,
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("submit approval request: %w", err)
	}
	req.ID = id
	req.Status = "pending"
	req.ApprovedCount = 0
	req.CreatedAt = createdAt
	req.UpdatedAt = updatedAt
	return &req, nil
}

// ListRequests returns approval requests for an org.
func (s *ApprovalService) ListRequests(ctx context.Context, orgID, status, resourceType string) ([]ApprovalRequest, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, workflow_id, org_id, resource_type, resource_id, title,
		        COALESCE(description,''), payload, status, required_count, approved_count,
		        requested_by, decided_at::text, created_at::text, updated_at::text
		 FROM approval_requests
		 WHERE org_id=$1 AND ($2='' OR status=$2) AND ($3='' OR resource_type=$3)
		 ORDER BY created_at DESC`,
		orgID, status, resourceType,
	)
	if err != nil {
		return nil, fmt.Errorf("list approval requests: %w", err)
	}
	defer rows.Close()

	var out []ApprovalRequest
	for rows.Next() {
		var req ApprovalRequest
		if err := rows.Scan(&req.ID, &req.WorkflowID, &req.OrgID, &req.ResourceType, &req.ResourceID,
			&req.Title, &req.Description, &req.Payload, &req.Status, &req.RequiredCount,
			&req.ApprovedCount, &req.RequestedBy, &req.DecidedAt, &req.CreatedAt, &req.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, req)
	}
	return out, rows.Err()
}

// Decide records an approve/reject vote and updates the request status if threshold is met.
func (s *ApprovalService) Decide(ctx context.Context, d ApprovalDecision) (*ApprovalDecision, error) {
	var id, decidedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO approval_decisions (request_id, org_id, user_id, decision, comment)
		 VALUES ($1,$2,$3,$4,$5)
		 ON CONFLICT (request_id, user_id) DO UPDATE
		   SET decision=EXCLUDED.decision, comment=EXCLUDED.comment, decided_at=now()
		 RETURNING id, decided_at::text`,
		d.RequestID, d.OrgID, d.UserID, d.Decision, d.Comment,
	).Scan(&id, &decidedAt)
	if err != nil {
		return nil, fmt.Errorf("record decision: %w", err)
	}
	d.ID = id
	d.DecidedAt = decidedAt

	// Recalculate request status
	if d.Decision == "reject" {
		_, _ = s.db.Pool().Exec(ctx,
			`UPDATE approval_requests SET status='rejected', decided_at=now() WHERE id=$1 AND org_id=$2`,
			d.RequestID, d.OrgID,
		)
	} else {
		_, _ = s.db.Pool().Exec(ctx,
			`UPDATE approval_requests
			 SET approved_count = (SELECT COUNT(*) FROM approval_decisions WHERE request_id=$1 AND decision='approve'),
			     status = CASE
			                WHEN (SELECT COUNT(*) FROM approval_decisions WHERE request_id=$1 AND decision='approve') >= required_count
			                THEN 'approved'
			                ELSE status
			              END,
			     decided_at = CASE
			                    WHEN (SELECT COUNT(*) FROM approval_decisions WHERE request_id=$1 AND decision='approve') >= required_count
			                    THEN now()
			                    ELSE decided_at
			                  END
			 WHERE id=$1 AND org_id=$2 AND status='pending'`,
			d.RequestID, d.OrgID,
		)
	}
	return &d, nil
}

// ListDecisions returns decisions for a request.
func (s *ApprovalService) ListDecisions(ctx context.Context, requestID, orgID string) ([]ApprovalDecision, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT ad.id, ad.request_id, ad.org_id, ad.user_id, ad.decision,
		        COALESCE(ad.comment,''), ad.decided_at::text
		 FROM approval_decisions ad
		 JOIN approval_requests ar ON ar.id=ad.request_id
		 WHERE ad.request_id=$1 AND ar.org_id=$2
		 ORDER BY ad.decided_at`,
		requestID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list decisions: %w", err)
	}
	defer rows.Close()

	var out []ApprovalDecision
	for rows.Next() {
		var dec ApprovalDecision
		if err := rows.Scan(&dec.ID, &dec.RequestID, &dec.OrgID, &dec.UserID,
			&dec.Decision, &dec.Comment, &dec.DecidedAt); err != nil {
			return nil, err
		}
		out = append(out, dec)
	}
	return out, rows.Err()
}
