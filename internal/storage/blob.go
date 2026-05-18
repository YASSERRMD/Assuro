package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// BlobStore is the interface for file storage.
type BlobStore interface {
	// Upload stores a file by key.
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

// NewLocalStore creates a local filesystem blob store rooted at basePath.
func NewLocalStore(basePath string) *LocalStore {
	return &LocalStore{basePath: basePath}
}

// Upload writes the reader's contents to {basePath}/{key}.
func (s *LocalStore) Upload(_ context.Context, key string, reader io.Reader) error {
	dest := filepath.Join(s.basePath, filepath.Clean("/"+key))
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return fmt.Errorf("create dirs: %w", err)
	}
	f, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer f.Close()
	if _, err := io.Copy(f, reader); err != nil {
		return fmt.Errorf("write file: %w", err)
	}
	return nil
}

// Download opens and returns the file at {basePath}/{key}.
func (s *LocalStore) Download(_ context.Context, key string) (io.ReadCloser, error) {
	path := filepath.Join(s.basePath, filepath.Clean("/"+key))
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open file: %w", err)
	}
	return f, nil
}

// Delete removes the file at {basePath}/{key}.
func (s *LocalStore) Delete(_ context.Context, key string) error {
	path := filepath.Join(s.basePath, filepath.Clean("/"+key))
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove file: %w", err)
	}
	return nil
}
