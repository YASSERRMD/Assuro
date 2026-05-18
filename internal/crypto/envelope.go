package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
)

// ErrInvalidCiphertext is returned when decryption fails due to bad data.
var ErrInvalidCiphertext = errors.New("crypto: invalid ciphertext")

// MasterKey holds the raw 32-byte AES-256 master key and its identifier.
type MasterKey struct {
	ID  string
	Key []byte
}

// NewMasterKey creates a MasterKey from a hex-encoded 32-byte key string.
func NewMasterKey(id, hexKey string) (MasterKey, error) {
	raw, err := hex.DecodeString(hexKey)
	if err != nil {
		return MasterKey{}, fmt.Errorf("decode master key: %w", err)
	}
	if len(raw) != 32 {
		return MasterKey{}, fmt.Errorf("master key must be 32 bytes, got %d", len(raw))
	}
	return MasterKey{ID: id, Key: raw}, nil
}

// GenerateMasterKey generates a random 32-byte master key and returns it as hex.
func GenerateMasterKey() (string, error) {
	b := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// Encrypt encrypts plaintext with AES-256-GCM using the master key.
// The returned ciphertext includes the nonce prepended.
func Encrypt(mk MasterKey, plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(mk.Key)
	if err != nil {
		return nil, fmt.Errorf("create cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create gcm: %w", err)
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("generate nonce: %w", err)
	}
	sealed := gcm.Seal(nonce, nonce, plaintext, nil)
	return sealed, nil
}

// Decrypt decrypts a ciphertext produced by Encrypt.
func Decrypt(mk MasterKey, ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(mk.Key)
	if err != nil {
		return nil, fmt.Errorf("create cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create gcm: %w", err)
	}
	ns := gcm.NonceSize()
	if len(ciphertext) < ns {
		return nil, ErrInvalidCiphertext
	}
	nonce, data := ciphertext[:ns], ciphertext[ns:]
	plain, err := gcm.Open(nil, nonce, data, nil)
	if err != nil {
		return nil, ErrInvalidCiphertext
	}
	return plain, nil
}
