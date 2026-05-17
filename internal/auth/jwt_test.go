package auth

import (
	"testing"
	"time"
)

func TestGenerateAndVerifyToken(t *testing.T) {
	secret := "test-secret-key-long-enough"
	userID := "user-1"
	orgID := "org-1"
	role := "owner"

	tokens, err := GenerateTokens(userID, orgID, role, secret, 15*time.Minute, 7*24*time.Hour)
	if err != nil {
		t.Fatalf("generate tokens: %v", err)
	}
	if tokens.AccessToken == "" {
		t.Fatal("access token is empty")
	}
	if tokens.RefreshToken == "" {
		t.Fatal("refresh token is empty")
	}

	claims, err := VerifyToken(tokens.AccessToken, secret)
	if err != nil {
		t.Fatalf("verify token: %v", err)
	}
	if claims.UserID != userID {
		t.Errorf("expected user %s, got %s", userID, claims.UserID)
	}
	if claims.OrgID != orgID {
		t.Errorf("expected org %s, got %s", orgID, claims.OrgID)
	}
	if claims.Role != role {
		t.Errorf("expected role %s, got %s", role, claims.Role)
	}
}

func TestVerifyTokenWrongSecret(t *testing.T) {
	tokens, err := GenerateTokens("u1", "o1", "viewer", "correct-secret", 15*time.Minute, 7*24*time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	_, err = VerifyToken(tokens.AccessToken, "wrong-secret")
	if err == nil {
		t.Fatal("expected error with wrong secret")
	}
}
