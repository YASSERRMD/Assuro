package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/YASSERRMD/Assuro/internal/storage"
	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/jackc/pgx/v5/pgtype"
)

// EvidenceService handles evidence operations.
type EvidenceService struct {
	db      *store.DB
	queries *qgen.Queries
	blobs   storage.BlobStore
}

// NewEvidenceService creates a new evidence service.
// blobs may be nil, in which case file storage is skipped (metadata-only mode).
func NewEvidenceService(db *store.DB, blobs storage.BlobStore) *EvidenceService {
	return &EvidenceService{
		db:      db,
		queries: qgen.New(db.Pool()),
		blobs:   blobs,
	}
}

// UploadEvidenceInput contains evidence upload fields.
type UploadEvidenceInput struct {
	OrgID       string
	Title       string
	Description string
	OriginalName string
	MimeType    string
	SizeBytes   int64
	UploadedBy  string
	Content     io.Reader
}

// UploadEvidence stores the file via the blob store and persists metadata.
func (s *EvidenceService) UploadEvidence(ctx context.Context, in UploadEvidenceInput) (*qgen.Evidence, error) {
	// Read file content once to hash it and optionally store it.
	var buf bytes.Buffer
	var contentHash string
	if in.Content != nil {
		hasher := sha256.New()
		tee := io.TeeReader(in.Content, &buf)
		if _, err := io.Copy(hasher, tee); err != nil {
			return nil, fmt.Errorf("read content: %w", err)
		}
		contentHash = hex.EncodeToString(hasher.Sum(nil))
	}

	// Derive a stable, collision-resistant file key from the hash.
	ext := filepath.Ext(in.OriginalName)
	fileKey := ""
	if contentHash != "" {
		fileKey = fmt.Sprintf("evidence/%s/%s/%s%s",
			in.OrgID,
			time.Now().UTC().Format("2006/01"),
			contentHash[:16],
			ext,
		)
	}

	// Persist the file bytes if a blob store is configured.
	if s.blobs != nil && buf.Len() > 0 && fileKey != "" {
		if err := s.blobs.Upload(ctx, fileKey, &buf); err != nil {
			return nil, fmt.Errorf("store file: %w", err)
		}
	}

	orgID := parseUUID(in.OrgID)
	uID := pgtype.UUID{}
	if in.UploadedBy != "" {
		uID = parseUUID(in.UploadedBy)
	}

	evidence, err := s.queries.CreateEvidence(ctx, qgen.CreateEvidenceParams{
		OrgID:       orgID,
		Title:       in.Title,
		Description: pgtype.Text{String: in.Description, Valid: in.Description != ""},
		FileKey:     fileKey,
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

// DownloadEvidence returns the file stream for an evidence record.
func (s *EvidenceService) DownloadEvidence(ctx context.Context, id string) (io.ReadCloser, *qgen.Evidence, error) {
	ev, err := s.GetEvidenceByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if ev.FileKey == "" || s.blobs == nil {
		return nil, nil, fmt.Errorf("no file stored for this evidence record")
	}
	rc, err := s.blobs.Download(ctx, ev.FileKey)
	if err != nil {
		return nil, nil, fmt.Errorf("retrieve file: %w", err)
	}
	return rc, ev, nil
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

// ListEvidenceByOrg returns all evidence for an organization.
func (s *EvidenceService) ListEvidenceByOrg(ctx context.Context, orgID string) ([]qgen.Evidence, error) {
	oID := parseUUID(orgID)
	rows, err := s.queries.ListEvidenceByOrg(ctx, qgen.ListEvidenceByOrgParams{
		OrgID:  oID,
		Limit:  200,
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("list evidence by org: %w", err)
	}
	return rows, nil
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
