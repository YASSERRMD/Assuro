package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"

	"golang.org/x/crypto/argon2"
)

type passwordConfig struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	saltLength  uint32
	keyLength   uint32
}

var defaultConfig = passwordConfig{
	memory:      64 * 1024,
	iterations:  3,
	parallelism: 2,
	saltLength:  16,
	keyLength:   32,
}

// HashPassword hashes a password using argon2id.
func HashPassword(plain string) (string, error) {
	return hashPassword(plain, defaultConfig)
}

func hashPassword(plain string, cfg passwordConfig) (string, error) {
	salt := make([]byte, cfg.saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generate salt: %w", err)
	}

	hash := argon2.IDKey([]byte(plain), salt, cfg.iterations, cfg.memory, cfg.parallelism, cfg.keyLength)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, cfg.memory, cfg.iterations, cfg.parallelism, b64Salt, b64Hash), nil
}

// ComparePassword compares a plain password against a hash.
func ComparePassword(hash, plain string) (bool, error) {
	parts, err := parseHash(hash)
	if err != nil {
		return false, err
	}

	hashBytes := argon2.IDKey([]byte(plain), parts.salt, parts.iterations, parts.memory, parts.parallelism, parts.keyLength)

	decodedHash, err := base64.RawStdEncoding.DecodeString(parts.hash)
	if err != nil {
		return false, fmt.Errorf("decode hash: %w", err)
	}

	return subtle.ConstantTimeCompare(decodedHash, hashBytes) == 1, nil
}

type parsedHash struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	salt        []byte
	hash        string
	keyLength   uint32
}

func parseHash(hash string) (*parsedHash, error) {
	var version, memory, iterations, parallelism int
	var salt, hashPart string

	_, err := fmt.Sscanf(hash, "$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		&version, &memory, &iterations, &parallelism, &salt, &hashPart)
	if err != nil {
		return nil, fmt.Errorf("invalid hash format: %w", err)
	}

	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		return nil, fmt.Errorf("decode salt: %w", err)
	}

	return &parsedHash{
		memory:      uint32(memory),
		iterations:  uint32(iterations),
		parallelism: uint8(parallelism),
		salt:        saltBytes,
		hash:        hashPart,
		keyLength:   32,
	}, nil
}
