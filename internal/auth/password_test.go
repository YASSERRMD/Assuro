package auth

import (
	"testing"
)

func TestHashAndComparePassword(t *testing.T) {
	plain := "super-secret-password-123"

	hash, err := HashPassword(plain)
	if err != nil {
		t.Fatalf("hash failed: %v", err)
	}
	if hash == "" {
		t.Fatal("hash is empty")
	}

	match, err := ComparePassword(hash, plain)
	if err != nil {
		t.Fatalf("compare failed: %v", err)
	}
	if !match {
		t.Fatal("password did not match")
	}

	match, err = ComparePassword(hash, "wrong-password")
	if err != nil {
		t.Fatalf("compare failed: %v", err)
	}
	if match {
		t.Fatal("wrong password should not match")
	}
}

func TestHashIsDeterministic(t *testing.T) {
	hash1, err := HashPassword("test")
	if err != nil {
		t.Fatal(err)
	}
	hash2, err := HashPassword("test")
	if err != nil {
		t.Fatal(err)
	}
	if hash1 == hash2 {
		t.Fatal("hashes should differ due to random salt")
	}
}
