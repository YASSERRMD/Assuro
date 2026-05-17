package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/domain"
	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/jackc/pgx/v5/pgtype"
)

// AISystemService handles AI system operations.
type AISystemService struct {
	db      *store.DB
	queries *qgen.Queries
	assets  *AssetService
}

// NewAISystemService creates a new AI system service.
func NewAISystemService(db *store.DB, assets *AssetService) *AISystemService {
	return &AISystemService{
		db:      db,
		queries: qgen.New(db.Pool()),
		assets:  assets,
	}
}

// RegisterAISystemInput contains fields for registering an AI system.
type RegisterAISystemInput struct {
	OrgID               string
	Name                string
	Description         string
	OwnerUserID         string
	Provider            string
	ModelFamily         string
	Modality            string
	DeploymentContext   string
	DataSources         []string
	IntendedPurpose     string
	AffectedPopulations []string
	EUMarketExposure    bool
	IsAgentic           bool
	AutonomyLevel       int32
	LifecycleStage      string
}

// RegisterAISystem creates an asset and its AI system details in a transaction.
func (s *AISystemService) RegisterAISystem(ctx context.Context, in RegisterAISystemInput) (*domain.AISystem, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	var metaBytes []byte
	metaBytes, _ = json.Marshal(map[string]string{"type": "ai_system"})

	ownerID := pgtype.UUID{}
	if in.OwnerUserID != "" {
		ownerID = parseUUID(in.OwnerUserID)
	}

	orgID := parseUUID(in.OrgID)

	asset, err := qtx.CreateAsset(ctx, qgen.CreateAssetParams{
		OrgID:           orgID,
		AssetType:       string(domain.AssetTypeAISystem),
		Name:            in.Name,
		Description:     pgtype.Text{String: in.Description, Valid: in.Description != ""},
		OwnerUserID:     ownerID,
		Metadata:        metaBytes,
		LifecycleStatus: string(domain.LifecycleStatusActive),
	})
	if err != nil {
		return nil, fmt.Errorf("create asset: %w", err)
	}

	dataSources, _ := json.Marshal(in.DataSources)
	affectedPops, _ := json.Marshal(in.AffectedPopulations)

	stage := in.LifecycleStage
	if stage == "" {
		stage = "design"
	}

	details, err := qtx.CreateAISystemDetails(ctx, qgen.CreateAISystemDetailsParams{
		AssetID:             asset.ID,
		Provider:            pgtype.Text{String: in.Provider, Valid: in.Provider != ""},
		ModelFamily:         pgtype.Text{String: in.ModelFamily, Valid: in.ModelFamily != ""},
		Modality:            pgtype.Text{String: in.Modality, Valid: in.Modality != ""},
		DeploymentContext:   pgtype.Text{String: in.DeploymentContext, Valid: in.DeploymentContext != ""},
		DataSources:         dataSources,
		IntendedPurpose:     pgtype.Text{String: in.IntendedPurpose, Valid: in.IntendedPurpose != ""},
		AffectedPopulations: affectedPops,
		EuMarketExposure:    pgtype.Bool{Bool: in.EUMarketExposure, Valid: true},
		IsAgentic:           pgtype.Bool{Bool: in.IsAgentic, Valid: true},
		AutonomyLevel:       pgtype.Int4{Int32: in.AutonomyLevel, Valid: true},
		LifecycleStage:      pgtype.Text{String: stage, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create ai system details: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return toDomainAISystem(asset, details), nil
}

// GetAISystem returns an AI system by asset ID.
func (s *AISystemService) GetAISystem(ctx context.Context, orgID, assetID string) (*domain.AISystem, error) {
	asset, err := s.assets.GetAssetByID(ctx, orgID, assetID)
	if err != nil {
		return nil, fmt.Errorf("get asset: %w", err)
	}

	aID := parseUUID(assetID)
	details, err := s.queries.GetAISystemDetailsByAssetID(ctx, aID)
	if err != nil {
		return nil, fmt.Errorf("get ai system details: %w", err)
	}

	return &domain.AISystem{
		Asset:   *asset,
		Details: toDomainDetails(details),
	}, nil
}

// ListAISystemsInput contains filtering and pagination params.
type ListAISystemsInput struct {
	OrgID           string
	LifecycleStatus string
	Limit           int32
	Offset          int32
}

// ListAISystems returns AI systems with their details.
func (s *AISystemService) ListAISystems(ctx context.Context, in ListAISystemsInput) ([]domain.AISystem, error) {
	orgID := parseUUID(in.OrgID)

	status := pgtype.Text{}
	if in.LifecycleStatus != "" {
		status = pgtype.Text{String: in.LifecycleStatus, Valid: true}
	}

	rows, err := s.queries.ListAISystems(ctx, qgen.ListAISystemsParams{
		OrgID:           orgID,
		LifecycleStatus: status,
		Limit:           in.Limit,
		Offset:          in.Offset,
	})
	if err != nil {
		return nil, fmt.Errorf("list ai systems: %w", err)
	}

	result := make([]domain.AISystem, len(rows))
	for i, r := range rows {
		result[i] = domain.AISystem{
			Asset: domain.Asset{
				ID:              r.ID.String(),
				OrgID:           r.OrgID.String(),
				AssetType:       domain.AssetType(r.AssetType),
				Name:            r.Name,
				Description:     r.Description.String,
				LifecycleStatus: domain.LifecycleStatus(r.LifecycleStatus),
			},
			Details: domain.AISystemDetails{
				Provider:          r.Provider.String,
				ModelFamily:       r.ModelFamily.String,
				Modality:          r.Modality.String,
				DeploymentContext: r.DeploymentContext.String,
				IntendedPurpose:   r.IntendedPurpose.String,
				EUMarketExposure:  r.EuMarketExposure.Bool,
				IsAgentic:         r.IsAgentic.Bool,
				AutonomyLevel:     r.AutonomyLevel.Int32,
				LifecycleStage:    r.LifecycleStage.String,
				LatestRiskTier:    r.LatestRiskTier,
			},
		}
	}
	return result, nil
}

// BulkRegisterInput contains a batch of AI systems to register.
type BulkRegisterInput struct {
	OrgID   string
	Systems []RegisterAISystemInput
}

// BulkRegister registers multiple AI systems in a single transaction.
func (s *AISystemService) BulkRegister(ctx context.Context, in BulkRegisterInput) ([]domain.AISystem, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)
	orgID := parseUUID(in.OrgID)

	var results []domain.AISystem

	for _, sys := range in.Systems {
		var metaBytes []byte
		metaBytes, _ = json.Marshal(map[string]string{"type": "ai_system"})

		asset, err := qtx.CreateAsset(ctx, qgen.CreateAssetParams{
			OrgID:           orgID,
			AssetType:       string(domain.AssetTypeAISystem),
			Name:            sys.Name,
			Description:     pgtype.Text{String: sys.Description, Valid: sys.Description != ""},
			Metadata:        metaBytes,
			LifecycleStatus: string(domain.LifecycleStatusActive),
		})
		if err != nil {
			return nil, fmt.Errorf("create asset %s: %w", sys.Name, err)
		}

		dataSources, _ := json.Marshal(sys.DataSources)
		affectedPops, _ := json.Marshal(sys.AffectedPopulations)

		stage := sys.LifecycleStage
		if stage == "" {
			stage = "design"
		}

		details, err := qtx.CreateAISystemDetails(ctx, qgen.CreateAISystemDetailsParams{
			AssetID:             asset.ID,
			Provider:            pgtype.Text{String: sys.Provider, Valid: sys.Provider != ""},
			ModelFamily:         pgtype.Text{String: sys.ModelFamily, Valid: sys.ModelFamily != ""},
			Modality:            pgtype.Text{String: sys.Modality, Valid: sys.Modality != ""},
			DeploymentContext:   pgtype.Text{String: sys.DeploymentContext, Valid: sys.DeploymentContext != ""},
			DataSources:         dataSources,
			IntendedPurpose:     pgtype.Text{String: sys.IntendedPurpose, Valid: sys.IntendedPurpose != ""},
			AffectedPopulations: affectedPops,
			EuMarketExposure:    pgtype.Bool{Bool: sys.EUMarketExposure, Valid: true},
			IsAgentic:           pgtype.Bool{Bool: sys.IsAgentic, Valid: true},
			AutonomyLevel:       pgtype.Int4{Int32: sys.AutonomyLevel, Valid: true},
			LifecycleStage:      pgtype.Text{String: stage, Valid: true},
		})
		if err != nil {
			return nil, fmt.Errorf("create details %s: %w", sys.Name, err)
		}

		results = append(results, *toDomainAISystem(asset, details))
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return results, nil
}

func toDomainAISystem(a qgen.Asset, d qgen.AiSystemDetail) *domain.AISystem {
	return &domain.AISystem{
		Asset: domain.Asset{
			ID:              a.ID.String(),
			OrgID:           a.OrgID.String(),
			AssetType:       domain.AssetType(a.AssetType),
			Name:            a.Name,
			Description:     a.Description.String,
			LifecycleStatus: domain.LifecycleStatus(a.LifecycleStatus),
		},
		Details: toDomainDetails(d),
	}
}

func toDomainDetails(d qgen.AiSystemDetail) domain.AISystemDetails {
	var dataSources []string
	if len(d.DataSources) > 0 {
		json.Unmarshal(d.DataSources, &dataSources)
	}

	var affectedPops []string
	if len(d.AffectedPopulations) > 0 {
		json.Unmarshal(d.AffectedPopulations, &affectedPops)
	}

	return domain.AISystemDetails{
		Provider:            d.Provider.String,
		ModelFamily:         d.ModelFamily.String,
		Modality:            d.Modality.String,
		DeploymentContext:   d.DeploymentContext.String,
		DataSources:         dataSources,
		IntendedPurpose:     d.IntendedPurpose.String,
		AffectedPopulations: affectedPops,
		EUMarketExposure:    d.EuMarketExposure.Bool,
		IsAgentic:           d.IsAgentic.Bool,
		AutonomyLevel:       d.AutonomyLevel.Int32,
		LifecycleStage:      d.LifecycleStage.String,
		LatestRiskTier:      "unknown",
	}
}
