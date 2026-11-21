package ota

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/url"
	"path"
	"regexp"
	"strings"
)

var (
	channelRe = regexp.MustCompile(`^[a-z][a-z0-9-]{0,31}$`)
	langRe    = regexp.MustCompile(`^[a-z]{2}$`)
	sha256Re  = regexp.MustCompile(`^[0-9a-f]{64}$`)
)

// ValidateChannel checks a channel name ("stable", "beta").
func ValidateChannel(c string) error {
	if !channelRe.MatchString(c) {
		return fmt.Errorf("channel %q: want lowercase letters, digits and dashes", c)
	}
	return nil
}

// DecodePointer parses and validates a pointer file.
func DecodePointer(data []byte) (*Pointer, error) {
	var p Pointer
	if err := decode(data, &p); err != nil {
		return nil, fmt.Errorf("pointer: %w", err)
	}
	if err := p.Validate(); err != nil {
		return nil, fmt.Errorf("pointer: %w", err)
	}
	return &p, nil
}

// DecodeRelease parses and validates a release manifest.
func DecodeRelease(data []byte) (*Release, error) {
	var r Release
	if err := decode(data, &r); err != nil {
		return nil, fmt.Errorf("release: %w", err)
	}
	if err := r.Validate(); err != nil {
		return nil, fmt.Errorf("release: %w", err)
	}
	return &r, nil
}

// decode is lenient about unknown fields on purpose: a future v1 file may
// gain an optional field, and already-shipped clients must still read it.
// Everything they do rely on is checked by Validate.
func decode(data []byte, v any) error {
	dec := json.NewDecoder(bytes.NewReader(data))
	if err := dec.Decode(v); err != nil {
		return err
	}
	if _, err := dec.Token(); !errors.Is(err, io.EOF) {
		return errors.New("trailing data after the JSON object")
	}
	return nil
}

// Validate checks every field of the pointer.
func (p *Pointer) Validate() error {
	if p.SchemaVersion != SchemaVersion {
		return fmt.Errorf("schemaVersion %d is not supported (want %d)", p.SchemaVersion, SchemaVersion)
	}
	if p.Kind != KindPointer {
		return fmt.Errorf("kind %q: want %q", p.Kind, KindPointer)
	}
	if err := ValidateChannel(p.Channel); err != nil {
		return err
	}
	target, err := ParseTarget(p.Target)
	if err != nil {
		return err
	}
	if _, err := ParseVersion(p.Version); err != nil {
		return err
	}
	if want := ReleasePath(target, p.Version); p.Manifest != want {
		return fmt.Errorf("manifest %q: want %q", p.Manifest, want)
	}
	if p.PublishedAt.IsZero() {
		return errors.New("publishedAt is required")
	}
	return nil
}

// Validate checks every field of the release.
func (r *Release) Validate() error {
	if r.SchemaVersion != SchemaVersion {
		return fmt.Errorf("schemaVersion %d is not supported (want %d)", r.SchemaVersion, SchemaVersion)
	}
	if r.Kind != KindRelease {
		return fmt.Errorf("kind %q: want %q", r.Kind, KindRelease)
	}
	if _, err := ParseTarget(r.Target); err != nil {
		return err
	}
	version, err := ParseVersion(r.Version)
	if err != nil {
		return err
	}
	if r.ReleasedAt.IsZero() {
		return errors.New("releasedAt is required")
	}
	if r.MinSupportedVersion != "" {
		minV, err := ParseVersion(r.MinSupportedVersion)
		if err != nil {
			return fmt.Errorf("minSupportedVersion: %w", err)
		}
		if minV.Compare(version) > 0 {
			return fmt.Errorf("minSupportedVersion %s is above the release version %s", r.MinSupportedVersion, r.Version)
		}
	}
	for lang, lines := range r.Notes {
		if !langRe.MatchString(lang) {
			return fmt.Errorf("notes: language %q: want a 2-letter code", lang)
		}
		for i, line := range lines {
			if strings.TrimSpace(line) == "" {
				return fmt.Errorf("notes.%s[%d] is empty", lang, i)
			}
		}
	}
	if len(r.Files) == 0 {
		return errors.New("files: at least one file is required")
	}
	seen := map[string]bool{}
	for i, f := range r.Files {
		if err := f.Validate(); err != nil {
			return fmt.Errorf("files[%d]: %w", i, err)
		}
		key := strings.ToLower(f.Path)
		if seen[key] {
			return fmt.Errorf("files[%d]: duplicate path %q", i, f.Path)
		}
		seen[key] = true
	}
	return nil
}

// Validate checks one file entry.
func (f *File) Validate() error {
	if err := ValidateFilePath(f.Path); err != nil {
		return err
	}
	if f.Size <= 0 {
		return fmt.Errorf("%s: size must be positive", f.Path)
	}
	if !sha256Re.MatchString(f.SHA256) {
		return fmt.Errorf("%s: sha256 must be 64 lowercase hex chars", f.Path)
	}
	if len(f.URLs) == 0 {
		return fmt.Errorf("%s: at least one url is required", f.Path)
	}
	for _, u := range f.URLs {
		if err := ValidateDownloadURL(u); err != nil {
			return fmt.Errorf("%s: %w", f.Path, err)
		}
	}
	return nil
}

// ValidateFilePath accepts a clean relative path with forward slashes that
// cannot escape the install dir.
func ValidateFilePath(p string) error {
	switch {
	case p == "":
		return errors.New("path is required")
	case strings.ContainsAny(p, "\\:\x00"):
		return fmt.Errorf("path %q: use forward slashes, no drive letters", p)
	case strings.HasPrefix(p, "/"):
		return fmt.Errorf("path %q must be relative", p)
	case path.Clean(p) != p:
		return fmt.Errorf("path %q is not clean", p)
	case p == ".." || strings.HasPrefix(p, "../"):
		return fmt.Errorf("path %q escapes the install dir", p)
	}
	return nil
}

// ValidateDownloadURL requires https; plain http is allowed only for
// loopback hosts (local testing).
func ValidateDownloadURL(raw string) error {
	u, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("url %q: %w", raw, err)
	}
	if u.Host == "" {
		return fmt.Errorf("url %q: host is required", raw)
	}
	switch u.Scheme {
	case "https":
		return nil
	case "http":
		if isLoopback(u.Hostname()) {
			return nil
		}
	}
	return fmt.Errorf("url %q: must be https", raw)
}

func isLoopback(host string) bool {
	if host == "localhost" {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}
