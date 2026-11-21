package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"beam-app/internal/application/update/ota"
)

// defaultKeyPath keeps the private key outside of every repo.
func defaultKeyPath() string {
	if v := os.Getenv("BEAM_OTA_KEY"); v != "" {
		return v
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "beam-ota-signing.key"
	}
	return filepath.Join(home, ".beam-ota", "signing.key")
}

func runKeygen(args []string) error {
	fs := flag.NewFlagSet("keygen", flag.ExitOnError)
	out := fs.String("out", defaultKeyPath(), "where to write the private key (keep it secret, back it up)")
	force := fs.Bool("force", false, "overwrite an existing key (old installs will reject the new one until you ship it)")
	_ = fs.Parse(args)

	if _, err := os.Stat(*out); err == nil && !*force {
		return fmt.Errorf("%s already exists - refusing to overwrite (use -force only if you really mean to rotate)", *out)
	} else if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	pub, priv, err := ota.GenerateKey()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(*out), 0o700); err != nil {
		return err
	}
	if err := os.WriteFile(*out, []byte(priv+"\n"), 0o600); err != nil {
		return err
	}

	fmt.Printf(`Private key written to %s
  - never commit it; back it up somewhere safe (password manager).
  - lose it and you can only ship a new key through a manual reinstall.

Public key:
  %s

Paste it into TrustedPublicKeys in
  internal/application/update/ota/sign.go
and rebuild. Builds without it do not update at all.
`, *out, pub)
	return nil
}

func loadKey(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("signing key: %w (create it with: go run ./cmd/beam-ota keygen)", err)
	}
	return string(data), nil
}
