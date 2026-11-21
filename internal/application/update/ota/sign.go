package ota

import (
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

// TrustedPublicKeys are the base64 ed25519 public keys whose signatures the
// client accepts. Several keys may be listed to rotate without breaking
// installed versions: ship the new key first, sign with it later.
//
// Generate a pair once with `go run ./cmd/beam-ota keygen` and paste the
// printed public key here. Keep the private key OUT of the repo.
var TrustedPublicKeys = []string{
	"fniYueYtYUwOQFeU2bHBqK89Y/z9MnVZ5kyunFQT6p0=",
}

// ErrNoTrustedKeys means this build cannot verify the feed, so it does not
// update at all (an unverified update is worse than none for a VPN client).
var ErrNoTrustedKeys = errors.New("no OTA public key is compiled into this build (ota.TrustedPublicKeys)")

// ParsePublicKey decodes a base64 ed25519 public key.
func ParsePublicKey(s string) (ed25519.PublicKey, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(s))
	if err != nil {
		return nil, fmt.Errorf("public key: %w", err)
	}
	if len(raw) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("public key: want %d bytes, got %d", ed25519.PublicKeySize, len(raw))
	}
	return ed25519.PublicKey(raw), nil
}

// TrustedKeys parses TrustedPublicKeys.
func TrustedKeys() ([]ed25519.PublicKey, error) {
	return ParsePublicKeys(TrustedPublicKeys)
}

// ParsePublicKeys parses a list of base64 keys; an empty list is an error.
func ParsePublicKeys(list []string) ([]ed25519.PublicKey, error) {
	if len(list) == 0 {
		return nil, ErrNoTrustedKeys
	}
	keys := make([]ed25519.PublicKey, 0, len(list))
	for _, s := range list {
		k, err := ParsePublicKey(s)
		if err != nil {
			return nil, err
		}
		keys = append(keys, k)
	}
	return keys, nil
}

// Verify checks a detached signature file (base64) against any trusted key.
func Verify(data, sigFile []byte, keys []ed25519.PublicKey) error {
	if len(keys) == 0 {
		return ErrNoTrustedKeys
	}
	sig, err := base64.StdEncoding.DecodeString(string(bytes.TrimSpace(sigFile)))
	if err != nil {
		return fmt.Errorf("signature: %w", err)
	}
	if len(sig) != ed25519.SignatureSize {
		return fmt.Errorf("signature: want %d bytes, got %d", ed25519.SignatureSize, len(sig))
	}
	for _, k := range keys {
		if ed25519.Verify(k, data, sig) {
			return nil
		}
	}
	return errors.New("signature does not match any trusted key")
}

// Sign returns the contents of a detached signature file.
func Sign(data []byte, key ed25519.PrivateKey) []byte {
	return []byte(base64.StdEncoding.EncodeToString(ed25519.Sign(key, data)) + "\n")
}

// GenerateKey creates a new key pair. The private key is serialized as the
// base64 32-byte seed.
func GenerateKey() (publicB64, privateB64 string, err error) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", "", err
	}
	return base64.StdEncoding.EncodeToString(pub), base64.StdEncoding.EncodeToString(priv.Seed()), nil
}

// ParsePrivateKey decodes a base64 seed written by GenerateKey.
func ParsePrivateKey(s string) (ed25519.PrivateKey, error) {
	seed, err := base64.StdEncoding.DecodeString(strings.TrimSpace(s))
	if err != nil {
		return nil, fmt.Errorf("private key: %w", err)
	}
	if len(seed) != ed25519.SeedSize {
		return nil, fmt.Errorf("private key: want a %d-byte seed, got %d bytes", ed25519.SeedSize, len(seed))
	}
	return ed25519.NewKeyFromSeed(seed), nil
}

// PublicKeyString returns the base64 public key of a private key.
func PublicKeyString(key ed25519.PrivateKey) string {
	return base64.StdEncoding.EncodeToString(key.Public().(ed25519.PublicKey))
}
