package crypto

import (
	"bytes"
	"testing"
)

func TestEncryptDecryptRoundTrip(t *testing.T) {
	hex32 := "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
	mk, err := NewMasterKey("k1", hex32)
	if err != nil {
		t.Fatal(err)
	}

	plaintext := []byte("super secret credential")
	ct, err := Encrypt(mk, plaintext)
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}

	if bytes.Equal(ct, plaintext) {
		t.Error("ciphertext must not equal plaintext")
	}

	got, err := Decrypt(mk, ct)
	if err != nil {
		t.Fatalf("decrypt: %v", err)
	}
	if !bytes.Equal(got, plaintext) {
		t.Errorf("round-trip mismatch: got %q, want %q", got, plaintext)
	}
}

func TestEncryptProducesUniqueCiphertexts(t *testing.T) {
	hex32 := "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
	mk, _ := NewMasterKey("k1", hex32)
	plain := []byte("same input")

	ct1, _ := Encrypt(mk, plain)
	ct2, _ := Encrypt(mk, plain)
	if bytes.Equal(ct1, ct2) {
		t.Error("two encryptions of the same plaintext must produce different ciphertexts")
	}
}

func TestDecryptInvalidCiphertext(t *testing.T) {
	hex32 := "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
	mk, _ := NewMasterKey("k1", hex32)
	_, err := Decrypt(mk, []byte("definitely not ciphertext"))
	if err == nil {
		t.Error("expected error decrypting garbage")
	}
}

func TestNewMasterKeyInvalidHex(t *testing.T) {
	_, err := NewMasterKey("k1", "not-hex")
	if err == nil {
		t.Error("expected error for invalid hex")
	}
}

func TestNewMasterKeyWrongLength(t *testing.T) {
	_, err := NewMasterKey("k1", "0102030405060708")
	if err == nil {
		t.Error("expected error for wrong key length")
	}
}
