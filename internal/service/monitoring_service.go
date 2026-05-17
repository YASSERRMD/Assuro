package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/jackc/pgx/v5/pgtype"
)

// MonitoringService handles monitoring signal operations.
type MonitoringService struct {
	db      *store.DB
	queries *qgen.Queries
}

// NewMonitoringService creates a new monitoring service.
func NewMonitoringService(db *store.DB) *MonitoringService {
	return &MonitoringService{
		db:      db,
		queries: qgen.New(db.Pool()),
	}
}

// RecordSignalInput contains signal recording fields.
type RecordSignalInput struct {
	OrgID      string
	AssetID    string
	SignalType string
	Severity   string
	Value      map[string]any
	Source     string
}

// RecordSignal records a monitoring signal and auto-raises incident if severe.
func (s *MonitoringService) RecordSignal(ctx context.Context, in RecordSignalInput) (*qgen.MonitoringSignal, error) {
	orgID := parseUUID(in.OrgID)
	assetID := parseUUID(in.AssetID)

	valueBytes, _ := json.Marshal(in.Value)

	signal, err := s.queries.CreateMonitoringSignal(ctx, qgen.CreateMonitoringSignalParams{
		OrgID:      orgID,
		AssetID:    assetID,
		SignalType: in.SignalType,
		Severity:   in.Severity,
		Value:      valueBytes,
		Source:     pgtype.Text{String: in.Source, Valid: in.Source != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("record signal: %w", err)
	}

	if in.Severity == "high" || in.Severity == "critical" {
		_, _ = s.queries.CreateIncident(ctx, qgen.CreateIncidentParams{
			OrgID:       orgID,
			AssetID:     assetID,
			Title:       "Auto-raised: " + in.SignalType + " signal",
			Description: pgtype.Text{String: "High severity " + in.SignalType + " signal detected", Valid: true},
			Severity:    in.Severity,
		})
	}

	return &signal, nil
}

// ListSignals returns signals for an asset.
func (s *MonitoringService) ListSignals(ctx context.Context, assetID string, limit, offset int32) ([]qgen.MonitoringSignal, error) {
	aID := parseUUID(assetID)

	signals, err := s.queries.ListSignalsByAsset(ctx, qgen.ListSignalsByAssetParams{
		AssetID: aID,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("list signals: %w", err)
	}

	return signals, nil
}

// IncidentService handles incident and CAPA operations.
type IncidentService struct {
	db      *store.DB
	queries *qgen.Queries
}

// NewIncidentService creates a new incident service.
func NewIncidentService(db *store.DB) *IncidentService {
	return &IncidentService{
		db:      db,
		queries: qgen.New(db.Pool()),
	}
}

// CreateIncidentInput contains incident creation fields.
type CreateIncidentInput struct {
	OrgID       string
	AssetID     string
	Title       string
	Description string
	Severity    string
	RaisedBy    string
}

// CreateIncident creates a new incident.
func (s *IncidentService) CreateIncident(ctx context.Context, in CreateIncidentInput) (*qgen.Incident, error) {
	orgID := parseUUID(in.OrgID)
	assetID := pgtype.UUID{}
	if in.AssetID != "" {
		assetID = parseUUID(in.AssetID)
	}
	raisedBy := parseUUID(in.RaisedBy)

	incident, err := s.queries.CreateIncident(ctx, qgen.CreateIncidentParams{
		OrgID:       orgID,
		AssetID:     assetID,
		Title:       in.Title,
		Description: pgtype.Text{String: in.Description, Valid: in.Description != ""},
		Severity:    in.Severity,
		RaisedBy:    raisedBy,
	})
	if err != nil {
		return nil, fmt.Errorf("create incident: %w", err)
	}

	return &incident, nil
}

// UpdateIncidentStatus updates an incident status with validation.
func (s *IncidentService) UpdateIncidentStatus(ctx context.Context, incidentID, status string) (*qgen.Incident, error) {
	iID := parseUUID(incidentID)

	if status == "closed" {
		openCount, err := s.queries.CountOpenActionsByIncident(ctx, iID)
		if err == nil && openCount > 0 {
			return nil, fmt.Errorf("cannot close incident with %d open corrective actions", openCount)
		}
	}

	incident, err := s.queries.UpdateIncidentStatus(ctx, qgen.UpdateIncidentStatusParams{
		Status: status,
		ID:     iID,
	})
	if err != nil {
		return nil, fmt.Errorf("update incident: %w", err)
	}

	return &incident, nil
}

// AddCorrectiveActionInput contains CAPA creation fields.
type AddCorrectiveActionInput struct {
	IncidentID  string
	Description string
	OwnerUserID string
	DueDate     string
}

// AddCorrectiveAction adds a corrective action to an incident.
func (s *IncidentService) AddCorrectiveAction(ctx context.Context, in AddCorrectiveActionInput) (*qgen.CorrectiveAction, error) {
	iID := parseUUID(in.IncidentID)
	ownerID := pgtype.UUID{}
	if in.OwnerUserID != "" {
		ownerID = parseUUID(in.OwnerUserID)
	}

	dueDate := pgtype.Timestamptz{}
	if in.DueDate != "" {
		// simplified - in production use proper parsing
		dueDate.Valid = false
	}

	action, err := s.queries.CreateCorrectiveAction(ctx, qgen.CreateCorrectiveActionParams{
		IncidentID:  iID,
		Description: in.Description,
		OwnerUserID: ownerID,
		DueDate:     dueDate,
	})
	if err != nil {
		return nil, fmt.Errorf("create corrective action: %w", err)
	}

	return &action, nil
}

// ListIncidents returns incidents for an organization.
func (s *IncidentService) ListIncidents(ctx context.Context, orgID string, limit, offset int32) ([]qgen.Incident, error) {
	oID := parseUUID(orgID)

	incidents, err := s.queries.ListIncidentsByOrg(ctx, qgen.ListIncidentsByOrgParams{
		OrgID:  oID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("list incidents: %w", err)
	}

	return incidents, nil
}

// ListActions returns corrective actions for an incident.
func (s *IncidentService) ListActions(ctx context.Context, incidentID string) ([]qgen.CorrectiveAction, error) {
	iID := parseUUID(incidentID)

	actions, err := s.queries.ListActionsByIncident(ctx, iID)
	if err != nil {
		return nil, fmt.Errorf("list actions: %w", err)
	}

	return actions, nil
}
