package service

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// DiscoveryItem is a candidate AI model pending review in the discovery inbox.
type DiscoveryItem struct {
	ID          string          `json:"id"`
	OrgID       string          `json:"org_id"`
	ConnectorID *string         `json:"connector_id,omitempty"`
	SourceType  string          `json:"source_type"`
	SourceRef   string          `json:"source_ref"`
	Name        string          `json:"name"`
	ModelType   string          `json:"model_type,omitempty"`
	RawData     json.RawMessage `json:"raw_data"`
	DedupKey    string          `json:"dedup_key"`
	State       string          `json:"state"`
	AssetID     *string         `json:"asset_id,omitempty"`
	ReviewedBy  *string         `json:"reviewed_by,omitempty"`
	ReviewedAt  *string         `json:"reviewed_at,omitempty"`
	CreatedAt   string          `json:"created_at"`
}

// DiscoveryService manages the discovery inbox and reconciliation with the asset registry.
type DiscoveryService struct {
	db *store.DB
}

// NewDiscoveryService creates a DiscoveryService.
func NewDiscoveryService(db *store.DB) *DiscoveryService {
	return &DiscoveryService{db: db}
}

// dedupKey generates a stable dedup key for a discovery item.
func dedupKey(orgID, sourceType, sourceRef string) string {
	h := sha256.Sum256([]byte(orgID + "|" + sourceType + "|" + sourceRef))
	return fmt.Sprintf("%x", h[:8])
}

// Ingest upserts a discovery item into the inbox, deduplicating by (org, source_type, source_ref).
func (s *DiscoveryService) Ingest(ctx context.Context, item DiscoveryItem) (*DiscoveryItem, error) {
	if item.RawData == nil {
		item.RawData = json.RawMessage("{}")
	}
	item.DedupKey = dedupKey(item.OrgID, item.SourceType, item.SourceRef)

	var id, createdAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO discovery_inbox
		   (org_id, connector_id, source_type, source_ref, name, model_type, raw_data, dedup_key)
		 VALUES ($1, NULLIF($2,'')::uuid, $3, $4, $5, NULLIF($6,''), $7, $8)
		 ON CONFLICT (org_id, dedup_key) DO UPDATE
		   SET name=EXCLUDED.name, model_type=EXCLUDED.model_type, raw_data=EXCLUDED.raw_data
		 RETURNING id, created_at::text`,
		item.OrgID, derefStr(item.ConnectorID), item.SourceType, item.SourceRef,
		item.Name, item.ModelType, item.RawData, item.DedupKey,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("ingest discovery item: %w", err)
	}
	item.ID = id
	item.State = "new"
	item.CreatedAt = createdAt
	return &item, nil
}

// ListInbox returns discovery inbox items for an org.
func (s *DiscoveryService) ListInbox(ctx context.Context, orgID, state string) ([]DiscoveryItem, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, connector_id::text, source_type, source_ref, name,
		        COALESCE(model_type,''), raw_data, dedup_key, state,
		        asset_id::text, reviewed_by::text, reviewed_at::text, created_at::text
		 FROM discovery_inbox
		 WHERE org_id=$1 AND ($2='' OR state=$2)
		 ORDER BY created_at DESC`,
		orgID, state,
	)
	if err != nil {
		return nil, fmt.Errorf("list discovery inbox: %w", err)
	}
	defer rows.Close()

	var out []DiscoveryItem
	for rows.Next() {
		var d DiscoveryItem
		if err := rows.Scan(&d.ID, &d.OrgID, &d.ConnectorID, &d.SourceType, &d.SourceRef,
			&d.Name, &d.ModelType, &d.RawData, &d.DedupKey, &d.State,
			&d.AssetID, &d.ReviewedBy, &d.ReviewedAt, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// Reconcile merges a discovery item into the asset registry (links to existing or creates new asset).
func (s *DiscoveryService) Reconcile(ctx context.Context, id, orgID, userID string, assetID *string) error {
	// If assetID provided, link to existing; otherwise mark as merged (caller creates asset externally)
	state := "merged"
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE discovery_inbox
		 SET state=$1, asset_id=NULLIF($2,'')::uuid,
		     reviewed_by=NULLIF($3,'')::uuid, reviewed_at=now()
		 WHERE id=$4 AND org_id=$5`,
		state, derefStr(assetID), userID, id, orgID,
	)
	return err
}

// Dismiss marks a discovery item as dismissed (won't be promoted to the registry).
func (s *DiscoveryService) Dismiss(ctx context.Context, id, orgID, userID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE discovery_inbox
		 SET state='dismissed', reviewed_by=NULLIF($1,'')::uuid, reviewed_at=now()
		 WHERE id=$2 AND org_id=$3`,
		userID, id, orgID,
	)
	return err
}

// DeduplicateShadowFindings cross-references shadow AI findings with the discovery inbox and assets,
// updating their status to 'registered' when a matching asset is found.
func (s *DiscoveryService) DeduplicateShadowFindings(ctx context.Context, orgID string) (int, error) {
	res, err := s.db.Pool().Exec(ctx,
		`UPDATE shadow_ai_findings saf
		 SET status='registered', reviewed_at=now()
		 FROM assets a
		 WHERE saf.org_id=$1
		   AND saf.status='open'
		   AND LOWER(a.name) = LOWER(saf.name)
		   AND a.org_id=$1`,
		orgID,
	)
	if err != nil {
		return 0, fmt.Errorf("dedup shadow findings: %w", err)
	}
	return int(res.RowsAffected()), nil
}
