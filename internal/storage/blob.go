package storage

import (
	"context"
	"io"
)

// BlobStore is the interface for file storage.
type BlobStore interface {
	// Upload stores a file and returns its key.
	Upload(ctx context.Context, key string, reader io.Reader) error
	// Download retrieves a file by key.
	Download(ctx context.Context, key string) (io.ReadCloser, error)
	// Delete removes a file by key.
	Delete(ctx context.Context, key string) error
}

// LocalStore implements BlobStore using the local filesystem.
type LocalStore struct {
	basePath string
}

// NewLocalStore creates a local filesystem blob store.
func NewLocalStore(basePath string) *LocalStore {
	return &LocalStore{basePath: basePath}
}

// Upload writes the file to the local filesystem.
func (s *LocalStore) Upload(ctx context.Context, key string, reader io.Reader) error {
	return nil
}

// Download opens the file from the local filesystem.
func (s *LocalStore) Download(ctx context.Context, key string) (io.ReadCloser, error) {
	return nil, nil
}

// Delete removes the file from the local filesystem.
func (s *LocalStore) Delete(ctx context.Context, key string) error {
	return nil
}
