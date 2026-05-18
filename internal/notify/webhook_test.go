package notify

import (
	"testing"
)

func TestSignAndVerifyHMAC(t *testing.T) {
	secret := []byte("signing-secret")
	body := []byte(`{"event":"test","org_id":"abc"}`)

	sig := signHMAC(secret, body)
	if !VerifySignature(secret, body, "sha256="+sig) {
		t.Error("expected signature to verify")
	}
}

func TestVerifySignatureWrongSecret(t *testing.T) {
	body := []byte(`{"event":"test"}`)
	sig := signHMAC([]byte("correct"), body)
	if VerifySignature([]byte("wrong"), body, "sha256="+sig) {
		t.Error("expected verification to fail with wrong secret")
	}
}

func TestVerifySignatureWrongBody(t *testing.T) {
	secret := []byte("secret")
	sig := signHMAC(secret, []byte("original"))
	if VerifySignature(secret, []byte("tampered"), "sha256="+sig) {
		t.Error("expected verification to fail with tampered body")
	}
}
