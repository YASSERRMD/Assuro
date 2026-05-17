package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"

	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/jackc/pgx/v5/pgtype"
)

// EvidenceService handles evidence operations.
type EvidenceService struct {
	db      *store.DB
	queries *qgen.Queries
}

// NewEvidenceService creates a new evidence service.
func NewEvidenceService(db *store.DB) *EvidenceService {
	return &EvidenceService{
		db:      db,
		queries: qgen.New(db.Pool()),
	}
}

// UploadEvidenceInput contains evidence upload fields.
type UploadEvidenceInput struct {
	OrgID       string
	Title       string
	Description string
	FileKey     string
	MimeType    string
	SizeBytes   int64
	UploadedBy  string
	Content     io.Reader
}

// UploadEvidence stores evidence metadata and computes content hash.
func (s *EvidenceService) UploadEvidence(ctx context.Context, in UploadEvidenceInput) (*qgen.Evidence, error) {
	hasher := sha256.New()
	if in.Content != nil {
		if _, err := io.Copy(hasher, in.Content); err != nil {
			return nil, fmt.Errorf("compute hash: %w", err)
		}
	}
	contentHash := hex.EncodeToString(hasher.Sum(nil))

	orgID := parseUUID(in.OrgID)
	uID := pgtype.UUID{}
	if in.UploadedBy != "" {
		uID = parseUUID(in.UploadedBy)
	}

	evidence, err := s.queries.CreateEvidence(ctx, qgen.CreateEvidenceParams{
		OrgID:       orgID,
		Title:       in.Title,
		Description: pgtype.Text{String: in.Description, Valid: in.Description != ""},
		FileKey:     in.FileKey,
		ContentHash: contentHash,
		MimeType:    pgtype.Text{String: in.MimeType, Valid: in.MimeType != ""},
		SizeBytes:   in.SizeBytes,
		UploadedBy:  uID,
	})
	if err != nil {
		return nil, fmt.Errorf("create evidence: %w", err)
	}

	return &evidence, nil
}

// LinkEvidence links evidence to a target.
func (s *EvidenceService) LinkEvidence(ctx context.Context, evidenceID, targetType, targetID string) error {
	eID := parseUUID(evidenceID)
	tID := parseUUID(targetID)

	err := s.queries.LinkEvidence(ctx, qgen.LinkEvidenceParams{
		EvidenceID: eID,
		TargetType: targetType,
		TargetID:   tID,
	})
	if err != nil {
		return fmt.Errorf("link evidence: %w", err)
	}

	return nil
}

// ListEvidenceByTarget returns evidence linked to a target.
func (s *EvidenceService) ListEvidenceByTarget(ctx context.Context, targetType, targetID string) ([]qgen.Evidence, error) {
	tID := parseUUID(targetID)

	evidence, err := s.queries.ListEvidenceByTarget(ctx, qgen.ListEvidenceByTargetParams{
		TargetType: targetType,
		TargetID:   tID,
	})
	if err != nil {
		return nil, fmt.Errorf("list evidence: %w", err)
	}

	return evidence, nil
}

// GetEvidenceByID returns evidence by ID.
func (s *EvidenceService) GetEvidenceByID(ctx context.Context, id string) (*qgen.Evidence, error) {
	eID := parseUUID(id)

	evidence, err := s.queries.GetEvidenceByID(ctx, eID)
	if err != nil {
		return nil, fmt.Errorf("get evidence: %w", err)
	}

	return &evidence, nil
}

// ComputeHash computes the SHA-256 hash of content.
func ComputeHash(content []byte) string {
	hasher := sha256.New()
	hasher.Write(content)
	return hex.EncodeToString(hasher.Sum(nil))
}
