package crypto

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrSecretNotFound is returned when a secret does not exist.
var ErrSecretNotFound = errors.New("vault: secret not found")

// Vault stores and retrieves encrypted secrets backed by Postgres.
type Vault struct {
	pool *pgxpool.Pool
	mk   MasterKey
}

// NewVault creates a Vault using the given pool and master key.
func NewVault(pool *pgxpool.Pool, mk MasterKey) *Vault {
	return &Vault{pool: pool, mk: mk}
}

// Put encrypts plaintext and upserts it under (orgID, scope, ref).
func (v *Vault) Put(ctx context.Context, orgID, scope, ref string, plaintext []byte) error {
	ct, err := Encrypt(v.mk, plaintext)
	if err != nil {
		return fmt.Errorf("vault encrypt: %w", err)
	}
	_, err = v.pool.Exec(ctx, `
		INSERT INTO secrets (org_id, scope, ref, ciphertext, key_id)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (org_id, scope, ref) DO UPDATE
		    SET ciphertext = EXCLUDED.ciphertext,
		        key_id     = EXCLUDED.key_id,
		        updated_at = now()`,
		orgID, scope, ref, ct, v.mk.ID,
	)
	return err
}

// Get retrieves and decrypts a secret by (orgID, scope, ref).
func (v *Vault) Get(ctx context.Context, orgID, scope, ref string) ([]byte, error) {
	var ct []byte
	err := v.pool.QueryRow(ctx,
		`SELECT ciphertext FROM secrets WHERE org_id = $1 AND scope = $2 AND ref = $3`,
		orgID, scope, ref,
	).Scan(&ct)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrSecretNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("vault query: %w", err)
	}
	plain, err := Decrypt(v.mk, ct)
	if err != nil {
		return nil, fmt.Errorf("vault decrypt: %w", err)
	}
	return plain, nil
}

// Delete removes a secret.
func (v *Vault) Delete(ctx context.Context, orgID, scope, ref string) error {
	_, err := v.pool.Exec(ctx,
		`DELETE FROM secrets WHERE org_id = $1 AND scope = $2 AND ref = $3`,
		orgID, scope, ref,
	)
	return err
}
