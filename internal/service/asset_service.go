package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/domain"
	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// AssetService handles asset operations.
type AssetService struct {
	db      *store.DB
	queries *qgen.Queries
}

// NewAssetService creates a new asset service.
func NewAssetService(db *store.DB) *AssetService {
	return &AssetService{
		db:      db,
		queries: qgen.New(db.Pool()),
	}
}

// CreateAssetInput contains fields for creating an asset.
type CreateAssetInput struct {
	OrgID       string
	AssetType   string
	Name        string
	Description string
	OwnerUserID string
	Metadata    map[string]any
}

// CreateAsset creates a new asset and writes an audit log entry.
func (s *AssetService) CreateAsset(ctx context.Context, in CreateAssetInput) (*domain.Asset, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	var metaBytes []byte
	if in.Metadata != nil {
		metaBytes, _ = json.Marshal(in.Metadata)
	} else {
		metaBytes = []byte("{}")
	}

	ownerID := pgtype.UUID{}
	if in.OwnerUserID != "" {
		ownerID = parseUUID(in.OwnerUserID)
	}

	orgID := parseUUID(in.OrgID)

	asset, err := qtx.CreateAsset(ctx, qgen.CreateAssetParams{
		OrgID:           orgID,
		AssetType:       in.AssetType,
		Name:            in.Name,
		Description:     pgtype.Text{String: in.Description, Valid: in.Description != ""},
		OwnerUserID:     ownerID,
		Metadata:        metaBytes,
		LifecycleStatus: string(domain.LifecycleStatusActive),
	})
	if err != nil {
		return nil, fmt.Errorf("create asset: %w", err)
	}

	payload := []byte(`{"name":"` + in.Name + `"}`)
	_, err = qtx.CreateAuditLog(ctx, qgen.CreateAuditLogParams{
		OrgID:       orgID,
		ActorUserID: ownerID,
		Action:      "asset.create",
		TargetType:  "asset",
		TargetID:    asset.ID,
		Payload:     payload,
	})
	if err != nil {
		return nil, fmt.Errorf("write audit log: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return toDomainAsset(asset), nil
}

// GetAssetByID returns an asset scoped to an organization.
func (s *AssetService) GetAssetByID(ctx context.Context, orgID, assetID string) (*domain.Asset, error) {
	oID := parseUUID(orgID)
	aID := parseUUID(assetID)

	asset, err := s.queries.GetAssetByIDAndOrg(ctx, qgen.GetAssetByIDAndOrgParams{
		ID:    aID,
		OrgID: oID,
	})
	if err != nil {
		return nil, fmt.Errorf("get asset: %w", err)
	}

	return toDomainAsset(asset), nil
}

// ListAssetsInput contains filtering and pagination params.
type ListAssetsInput struct {
	OrgID           string
	AssetType       string
	LifecycleStatus string
	Limit           int32
	Offset          int32
}

// ListAssets returns assets filtered by type and status, paginated.
func (s *AssetService) ListAssets(ctx context.Context, in ListAssetsInput) ([]domain.Asset, error) {
	orgID := parseUUID(in.OrgID)

	assetType := pgtype.Text{}
	if in.AssetType != "" {
		assetType = pgtype.Text{String: in.AssetType, Valid: true}
	}

	status := pgtype.Text{}
	if in.LifecycleStatus != "" {
		status = pgtype.Text{String: in.LifecycleStatus, Valid: true}
	}

	assets, err := s.queries.ListAssets(ctx, qgen.ListAssetsParams{
		OrgID:           orgID,
		AssetType:       assetType,
		LifecycleStatus: status,
		Limit:           in.Limit,
		Offset:          in.Offset,
	})
	if err != nil {
		return nil, fmt.Errorf("list assets: %w", err)
	}

	result := make([]domain.Asset, len(assets))
	for i, a := range assets {
		result[i] = *toDomainAsset(a)
	}
	return result, nil
}

// UpdateAssetInput contains fields for updating an asset.
type UpdateAssetInput struct {
	AssetID         string
	OrgID           string
	Name            string
	Description     string
	OwnerUserID     string
	Metadata        map[string]any
	LifecycleStatus string
}

// UpdateAsset updates an asset and writes an audit log entry.
func (s *AssetService) UpdateAsset(ctx context.Context, in UpdateAssetInput) (*domain.Asset, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	var metaBytes []byte
	if in.Metadata != nil {
		metaBytes, _ = json.Marshal(in.Metadata)
	} else {
		metaBytes = []byte("{}")
	}

	ownerID := pgtype.UUID{}
	if in.OwnerUserID != "" {
		ownerID = parseUUID(in.OwnerUserID)
	}

	orgID := parseUUID(in.OrgID)
	assetID := parseUUID(in.AssetID)

	status := in.LifecycleStatus
	if status == "" {
		status = string(domain.LifecycleStatusActive)
	}

	asset, err := qtx.UpdateAsset(ctx, qgen.UpdateAssetParams{
		Name:            in.Name,
		Description:     pgtype.Text{String: in.Description, Valid: in.Description != ""},
		OwnerUserID:     ownerID,
		Metadata:        metaBytes,
		LifecycleStatus: status,
		ID:              assetID,
		OrgID:           orgID,
	})
	if err != nil {
		return nil, fmt.Errorf("update asset: %w", err)
	}

	payload := []byte(`{"name":"` + in.Name + `"}`)
	_, err = qtx.CreateAuditLog(ctx, qgen.CreateAuditLogParams{
		OrgID:       orgID,
		ActorUserID: ownerID,
		Action:      "asset.update",
		TargetType:  "asset",
		TargetID:    assetID,
		Payload:     payload,
	})
	if err != nil {
		return nil, fmt.Errorf("write audit log: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return toDomainAsset(asset), nil
}

// ArchiveAsset soft-deletes an asset.
func (s *AssetService) ArchiveAsset(ctx context.Context, orgID, assetID string) error {
	oID := parseUUID(orgID)
	aID := parseUUID(assetID)

	_, err := s.queries.ArchiveAsset(ctx, qgen.ArchiveAssetParams{
		ID:    aID,
		OrgID: oID,
	})
	if err != nil {
		return fmt.Errorf("archive asset: %w", err)
	}

	return nil
}

func parseUUID(s string) pgtype.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}
	}
	var bytes [16]byte
	copy(bytes[:], id[:])
	return pgtype.UUID{Bytes: bytes, Valid: true}
}

func toDomainAsset(a qgen.Asset) *domain.Asset {
	meta := make(map[string]any)
	if len(a.Metadata) > 0 {
		json.Unmarshal(a.Metadata, &meta)
	}

	ownerID := ""
	if a.OwnerUserID.Valid {
		u := uuid.UUID(a.OwnerUserID.Bytes)
		ownerID = u.String()
	}

	return &domain.Asset{
		ID:              a.ID.String(),
		OrgID:           a.OrgID.String(),
		AssetType:       domain.AssetType(a.AssetType),
		Name:            a.Name,
		Description:     a.Description.String,
		OwnerUserID:     ownerID,
		Metadata:        meta,
		LifecycleStatus: domain.LifecycleStatus(a.LifecycleStatus),
	}
}
