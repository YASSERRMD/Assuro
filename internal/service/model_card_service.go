package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// ModelCard holds structured documentation for an AI system.
type ModelCard struct {
	ID               string          `json:"id"`
	OrgID            string          `json:"org_id"`
	AssetID          string          `json:"asset_id"`
	Version          string          `json:"version"`
	Status           string          `json:"status"`
	ModelDetails     json.RawMessage `json:"model_details"`
	IntendedUse      json.RawMessage `json:"intended_use"`
	Limitations      json.RawMessage `json:"limitations"`
	EthicalConcerns  json.RawMessage `json:"ethical_concerns"`
	Performance      json.RawMessage `json:"performance"`
	TrainingData     json.RawMessage `json:"training_data"`
	PublishedAt      *string         `json:"published_at,omitempty"`
	CreatedBy        *string         `json:"created_by,omitempty"`
	CreatedAt        string          `json:"created_at"`
	UpdatedAt        string          `json:"updated_at"`
}

// ModelCardService manages model cards.
type ModelCardService struct {
	db *store.DB
}

// NewModelCardService creates a ModelCardService.
func NewModelCardService(db *store.DB) *ModelCardService {
	return &ModelCardService{db: db}
}

func rawOrEmpty(r json.RawMessage) json.RawMessage {
	if r == nil {
		return json.RawMessage("{}")
	}
	return r
}

// CreateCard creates a new model card for an asset.
func (s *ModelCardService) CreateCard(ctx context.Context, mc ModelCard) (*ModelCard, error) {
	if mc.Version == "" {
		mc.Version = "1.0"
	}
	mc.ModelDetails = rawOrEmpty(mc.ModelDetails)
	mc.IntendedUse = rawOrEmpty(mc.IntendedUse)
	mc.Limitations = rawOrEmpty(mc.Limitations)
	mc.EthicalConcerns = rawOrEmpty(mc.EthicalConcerns)
	mc.Performance = rawOrEmpty(mc.Performance)
	mc.TrainingData = rawOrEmpty(mc.TrainingData)

	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO model_cards
		   (org_id, asset_id, version, model_details, intended_use, limitations,
		    ethical_concerns, performance, training_data, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NULLIF($10,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		mc.OrgID, mc.AssetID, mc.Version, mc.ModelDetails, mc.IntendedUse, mc.Limitations,
		mc.EthicalConcerns, mc.Performance, mc.TrainingData, derefStr(mc.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create model card: %w", err)
	}
	mc.ID = id
	mc.Status = "draft"
	mc.CreatedAt = createdAt
	mc.UpdatedAt = updatedAt
	return &mc, nil
}

// ListCards returns model cards for an org or asset.
func (s *ModelCardService) ListCards(ctx context.Context, orgID, assetID, status string) ([]ModelCard, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, asset_id, version, status,
		        model_details, intended_use, limitations, ethical_concerns,
		        performance, training_data, published_at::text, created_by::text,
		        created_at::text, updated_at::text
		 FROM model_cards
		 WHERE org_id=$1 AND ($2='' OR asset_id::text=$2) AND ($3='' OR status=$3)
		 ORDER BY created_at DESC`,
		orgID, assetID, status,
	)
	if err != nil {
		return nil, fmt.Errorf("list model cards: %w", err)
	}
	defer rows.Close()

	var out []ModelCard
	for rows.Next() {
		var mc ModelCard
		if err := rows.Scan(&mc.ID, &mc.OrgID, &mc.AssetID, &mc.Version, &mc.Status,
			&mc.ModelDetails, &mc.IntendedUse, &mc.Limitations, &mc.EthicalConcerns,
			&mc.Performance, &mc.TrainingData, &mc.PublishedAt,
			&mc.CreatedBy, &mc.CreatedAt, &mc.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, mc)
	}
	return out, rows.Err()
}

// UpdateCard updates the sections of a model card.
func (s *ModelCardService) UpdateCard(ctx context.Context, id, orgID string, mc ModelCard) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE model_cards
		 SET model_details=$1, intended_use=$2, limitations=$3,
		     ethical_concerns=$4, performance=$5, training_data=$6, updated_at=now()
		 WHERE id=$7 AND org_id=$8`,
		rawOrEmpty(mc.ModelDetails), rawOrEmpty(mc.IntendedUse), rawOrEmpty(mc.Limitations),
		rawOrEmpty(mc.EthicalConcerns), rawOrEmpty(mc.Performance), rawOrEmpty(mc.TrainingData),
		id, orgID,
	)
	return err
}

// PublishCard marks a model card as published.
func (s *ModelCardService) PublishCard(ctx context.Context, id, orgID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE model_cards SET status='published', published_at=now(), updated_at=now()
		 WHERE id=$1 AND org_id=$2`,
		id, orgID,
	)
	return err
}
