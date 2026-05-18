package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// Connector represents an integration connector (cloud provider, SaaS, code repo, etc.).
type Connector struct {
	ID            string          `json:"id"`
	OrgID         string          `json:"org_id"`
	Name          string          `json:"name"`
	ConnectorType string          `json:"connector_type"`
	Status        string          `json:"status"`
	Config        json.RawMessage `json:"config"`
	CredentialRef string          `json:"credential_ref,omitempty"`
	LastSyncedAt  *string         `json:"last_synced_at,omitempty"`
	LastError     string          `json:"last_error,omitempty"`
	CreatedBy     *string         `json:"created_by,omitempty"`
	CreatedAt     string          `json:"created_at"`
	UpdatedAt     string          `json:"updated_at"`
}

// ConnectorSyncRun is a single sync execution record.
type ConnectorSyncRun struct {
	ID            string  `json:"id"`
	ConnectorID   string  `json:"connector_id"`
	OrgID         string  `json:"org_id"`
	Status        string  `json:"status"`
	RecordsSynced int     `json:"records_synced"`
	ErrorMessage  string  `json:"error_message,omitempty"`
	StartedAt     string  `json:"started_at"`
	FinishedAt    *string `json:"finished_at,omitempty"`
}

// ConnectorService manages integration connectors and sync jobs.
type ConnectorService struct {
	db *store.DB
}

// NewConnectorService creates a ConnectorService.
func NewConnectorService(db *store.DB) *ConnectorService {
	return &ConnectorService{db: db}
}

// CreateConnector registers a new connector.
func (s *ConnectorService) CreateConnector(ctx context.Context, c Connector) (*Connector, error) {
	if c.Config == nil {
		c.Config = json.RawMessage("{}")
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO connectors
		   (org_id, name, connector_type, config, credential_ref, created_by)
		 VALUES ($1,$2,$3,$4,NULLIF($5,''),NULLIF($6,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		c.OrgID, c.Name, c.ConnectorType, c.Config, c.CredentialRef, derefStr(c.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create connector: %w", err)
	}
	c.ID = id
	c.Status = "active"
	c.CreatedAt = createdAt
	c.UpdatedAt = updatedAt
	return &c, nil
}

// ListConnectors returns connectors for an org.
func (s *ConnectorService) ListConnectors(ctx context.Context, orgID, connectorType string) ([]Connector, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, name, connector_type, status, config,
		        COALESCE(credential_ref,''), last_synced_at::text,
		        COALESCE(last_error,''), created_by::text, created_at::text, updated_at::text
		 FROM connectors
		 WHERE org_id=$1 AND ($2='' OR connector_type=$2)
		 ORDER BY created_at DESC`,
		orgID, connectorType,
	)
	if err != nil {
		return nil, fmt.Errorf("list connectors: %w", err)
	}
	defer rows.Close()

	var out []Connector
	for rows.Next() {
		var c Connector
		if err := rows.Scan(&c.ID, &c.OrgID, &c.Name, &c.ConnectorType, &c.Status,
			&c.Config, &c.CredentialRef, &c.LastSyncedAt, &c.LastError,
			&c.CreatedBy, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// UpdateConnectorStatus changes a connector's status and optionally records the last error.
func (s *ConnectorService) UpdateConnectorStatus(ctx context.Context, id, orgID, status, lastError string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE connectors
		 SET status=$1, last_error=NULLIF($2,''), updated_at=now()
		 WHERE id=$3 AND org_id=$4`,
		status, lastError, id, orgID,
	)
	return err
}

// DeleteConnector removes a connector.
func (s *ConnectorService) DeleteConnector(ctx context.Context, id, orgID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`DELETE FROM connectors WHERE id=$1 AND org_id=$2`,
		id, orgID,
	)
	return err
}

// StartSyncRun creates a sync run record in 'running' state and returns it.
func (s *ConnectorService) StartSyncRun(ctx context.Context, connectorID, orgID string) (*ConnectorSyncRun, error) {
	var id, startedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO connector_sync_runs (connector_id, org_id, status)
		 VALUES ($1,$2,'running')
		 RETURNING id, started_at::text`,
		connectorID, orgID,
	).Scan(&id, &startedAt)
	if err != nil {
		return nil, fmt.Errorf("start sync run: %w", err)
	}
	return &ConnectorSyncRun{
		ID:          id,
		ConnectorID: connectorID,
		OrgID:       orgID,
		Status:      "running",
		StartedAt:   startedAt,
	}, nil
}

// FinishSyncRun marks a sync run complete or failed.
func (s *ConnectorService) FinishSyncRun(ctx context.Context, runID, orgID, status string, records int, errMsg string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE connector_sync_runs
		 SET status=$1, records_synced=$2, error_message=NULLIF($3,''), finished_at=now()
		 WHERE id=$4 AND org_id=$5`,
		status, records, errMsg, runID, orgID,
	)
	if err != nil {
		return err
	}
	// Update last_synced_at on the connector
	_, err = s.db.Pool().Exec(ctx,
		`UPDATE connectors SET last_synced_at=now(), updated_at=now()
		 WHERE id=(SELECT connector_id FROM connector_sync_runs WHERE id=$1)`,
		runID,
	)
	return err
}

// ListSyncRuns returns recent sync runs for a connector.
func (s *ConnectorService) ListSyncRuns(ctx context.Context, connectorID, orgID string) ([]ConnectorSyncRun, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, connector_id, org_id, status, records_synced,
		        COALESCE(error_message,''), started_at::text, finished_at::text
		 FROM connector_sync_runs
		 WHERE connector_id=$1 AND org_id=$2
		 ORDER BY started_at DESC
		 LIMIT 50`,
		connectorID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list sync runs: %w", err)
	}
	defer rows.Close()

	var out []ConnectorSyncRun
	for rows.Next() {
		var r ConnectorSyncRun
		if err := rows.Scan(&r.ID, &r.ConnectorID, &r.OrgID, &r.Status,
			&r.RecordsSynced, &r.ErrorMessage, &r.StartedAt, &r.FinishedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
