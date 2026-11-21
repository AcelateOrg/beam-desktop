package ota

import (
	"context"
	"crypto/ed25519"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const testSHA = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"

func testRelease(target, version string) *Release {
	return &Release{
		SchemaVersion: SchemaVersion,
		Kind:          KindRelease,
		Target:        target,
		Version:       version,
		ReleasedAt:    time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC),
		Notes:         map[string][]string{"ru": {"Исправлен реконнект"}},
		Files: []File{{
			Path:   "Beam.exe",
			Size:   4,
			SHA256: testSHA,
			URLs:   []string{"https://github.com/acelate/beam-releases/releases/download/v" + version + "/windows-amd64-Beam.exe"},
		}},
	}
}

func testPointer(channel string, target Target, version string) *Pointer {
	return &Pointer{
		SchemaVersion: SchemaVersion,
		Kind:          KindPointer,
		Channel:       channel,
		Target:        target.String(),
		Version:       version,
		Manifest:      ReleasePath(target, version),
		PublishedAt:   time.Date(2026, 5, 1, 12, 0, 0, 0, time.UTC),
	}
}

func TestParseVersionStrict(t *testing.T) {
	for _, ok := range []string{"0.0.1", "2.0.0", "10.20.30"} {
		if _, err := ParseVersion(ok); err != nil {
			t.Errorf("%q: %v", ok, err)
		}
	}
	for _, bad := range []string{"", "2.0", "v2.0.0", "2.0.0-beta", "2.01.0", "2..0", "a.b.c", "2.0.0.0"} {
		if _, err := ParseVersion(bad); err == nil {
			t.Errorf("%q must be rejected", bad)
		}
	}
	a, _ := ParseVersion("1.10.0")
	b, _ := ParseVersion("1.9.0")
	if a.Compare(b) != 1 || b.Compare(a) != -1 || a.Compare(a) != 0 {
		t.Error("numeric compare is broken")
	}
}

func TestCandidateTargets(t *testing.T) {
	if got := candidateTargets("windows", "amd64"); len(got) != 1 || got[0].String() != "windows-amd64" {
		t.Errorf("windows: %v", got)
	}
	got := candidateTargets("darwin", "arm64")
	if len(got) != 2 || got[0].String() != "darwin-arm64" || got[1].String() != "darwin-universal" {
		t.Errorf("darwin: %v", got)
	}
	if got := candidateTargets("freebsd", "amd64"); len(got) != 0 {
		t.Errorf("freebsd: %v", got)
	}
	if _, err := ParseTarget("linux-universal"); err == nil {
		t.Error("universal is macOS-only")
	}
}

func TestReleaseValidation(t *testing.T) {
	mutate := map[string]func(r *Release){
		"schema":      func(r *Release) { r.SchemaVersion = 2 },
		"kind":        func(r *Release) { r.Kind = KindPointer },
		"target":      func(r *Release) { r.Target = "windows-x86" },
		"version":     func(r *Release) { r.Version = "2.1" },
		"min above":   func(r *Release) { r.MinSupportedVersion = "9.0.0" },
		"no files":    func(r *Release) { r.Files = nil },
		"http url":    func(r *Release) { r.Files[0].URLs = []string{"http://example.com/Beam.exe"} },
		"no urls":     func(r *Release) { r.Files[0].URLs = nil },
		"bad sha":     func(r *Release) { r.Files[0].SHA256 = strings.ToUpper(testSHA) },
		"zero size":   func(r *Release) { r.Files[0].Size = 0 },
		"escape":      func(r *Release) { r.Files[0].Path = "../evil.exe" },
		"absolute":    func(r *Release) { r.Files[0].Path = "/etc/passwd" },
		"backslash":   func(r *Release) { r.Files[0].Path = "sub\\Beam.exe" },
		"dup path":    func(r *Release) { r.Files = append(r.Files, r.Files[0]) },
		"bad lang":    func(r *Release) { r.Notes = map[string][]string{"rus": {"x"}} },
		"empty note":  func(r *Release) { r.Notes = map[string][]string{"ru": {" "}} },
		"no released": func(r *Release) { r.ReleasedAt = time.Time{} },
	}
	if err := testRelease("windows-amd64", "2.1.0").Validate(); err != nil {
		t.Fatalf("baseline must be valid: %v", err)
	}
	for name, m := range mutate {
		r := testRelease("windows-amd64", "2.1.0")
		m(r)
		if err := r.Validate(); err == nil {
			t.Errorf("%s: must be rejected", name)
		}
	}

	r := testRelease("windows-amd64", "2.1.0")
	r.Files[0].URLs = []string{"http://127.0.0.1:8080/Beam.exe"}
	if err := r.Validate(); err != nil {
		t.Errorf("loopback http is allowed for local testing: %v", err)
	}
}

func TestPointerValidation(t *testing.T) {
	target := Target{OS: "linux", Arch: "amd64"}
	if err := testPointer("stable", target, "2.0.0").Validate(); err != nil {
		t.Fatalf("baseline must be valid: %v", err)
	}
	p := testPointer("stable", target, "2.0.0")
	p.Manifest = "/v1/releases/linux-amd64/2.0.1.json"
	if p.Validate() == nil {
		t.Error("manifest path must match target + version")
	}
	p = testPointer("Stable", target, "2.0.0")
	if p.Validate() == nil {
		t.Error("channel must be lowercase")
	}
}

func TestDecodeRejectsTrailingData(t *testing.T) {
	data, err := Marshal(testRelease("windows-amd64", "2.1.0"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := DecodeRelease(data); err != nil {
		t.Fatalf("round trip: %v", err)
	}
	if _, err := DecodeRelease(append(data, []byte(`{"x":1}`)...)); err == nil {
		t.Error("trailing JSON must be rejected")
	}
	// Unknown fields are tolerated so v1 can grow optional fields.
	withExtra := strings.Replace(string(data), `"kind"`, `"futureField": true, "kind"`, 1)
	if _, err := DecodeRelease([]byte(withExtra)); err != nil {
		t.Errorf("unknown field must be ignored: %v", err)
	}
}

// writeSigned publishes v at sitePath inside dir, signed with key.
func writeSigned(t *testing.T, dir, sitePath string, v interface{ Validate() error }, key ed25519.PrivateKey) {
	t.Helper()
	data, err := Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	full := filepath.Join(dir, filepath.FromSlash(strings.TrimPrefix(sitePath, "/")))
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(full, data, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(full+SignatureSuffix, Sign(data, key), 0o644); err != nil {
		t.Fatal(err)
	}
}

func newKey(t *testing.T) (ed25519.PrivateKey, ed25519.PublicKey) {
	t.Helper()
	pubB64, privB64, err := GenerateKey()
	if err != nil {
		t.Fatal(err)
	}
	priv, err := ParsePrivateKey(privB64)
	if err != nil {
		t.Fatal(err)
	}
	pub, err := ParsePublicKey(pubB64)
	if err != nil {
		t.Fatal(err)
	}
	if PublicKeyString(priv) != pubB64 {
		t.Fatal("public key derived from the seed differs")
	}
	return priv, pub
}

func TestFeedEndToEnd(t *testing.T) {
	priv, pub := newKey(t)
	dir := t.TempDir()
	target := Target{OS: "windows", Arch: "amd64"}

	writeSigned(t, dir, ReleasePath(target, "2.1.0"), testRelease(target.String(), "2.1.0"), priv)
	writeSigned(t, dir, PointerPath("stable", target), testPointer("stable", target, "2.1.0"), priv)

	feed := &Feed{Source: DirSource{Dir: dir}, Keys: []ed25519.PublicKey{pub}}
	ctx := context.Background()

	p, err := feed.Pointer(ctx, "stable", []Target{target})
	if err != nil {
		t.Fatalf("pointer: %v", err)
	}
	r, err := feed.Release(ctx, p)
	if err != nil {
		t.Fatalf("release: %v", err)
	}
	if r.Version != "2.1.0" || r.Files[0].Path != "Beam.exe" {
		t.Errorf("unexpected release %+v", r)
	}

	// Linux has nothing published: not found, not an error.
	if _, err := feed.Pointer(ctx, "stable", []Target{{OS: "linux", Arch: "amd64"}}); !errors.Is(err, ErrNotFound) {
		t.Errorf("missing target: want ErrNotFound, got %v", err)
	}

	// Another key: rejected.
	_, otherPub := newKey(t)
	stranger := &Feed{Source: DirSource{Dir: dir}, Keys: []ed25519.PublicKey{otherPub}}
	if _, err := stranger.Pointer(ctx, "stable", []Target{target}); err == nil {
		t.Error("a foreign key must not verify")
	}

	// No keys at all: refuse.
	noKeys := &Feed{Source: DirSource{Dir: dir}}
	if _, err := noKeys.Pointer(ctx, "stable", []Target{target}); !errors.Is(err, ErrNoTrustedKeys) {
		t.Errorf("no keys: want ErrNoTrustedKeys, got %v", err)
	}

	// Tampered file: rejected.
	ptrFile := filepath.Join(dir, filepath.FromSlash(strings.TrimPrefix(PointerPath("stable", target), "/")))
	data, _ := os.ReadFile(ptrFile)
	os.WriteFile(ptrFile, []byte(strings.Replace(string(data), "2.1.0", "2.1.1", -1)), 0o644)
	if _, err := feed.Pointer(ctx, "stable", []Target{target}); err == nil {
		t.Error("a tampered pointer must not verify")
	}
}

func TestFeedRejectsSwappedPointer(t *testing.T) {
	priv, pub := newKey(t)
	dir := t.TempDir()
	win := Target{OS: "windows", Arch: "amd64"}
	linux := Target{OS: "linux", Arch: "amd64"}

	// A validly signed Windows pointer placed at the Linux path.
	writeSigned(t, dir, PointerPath("stable", linux), testPointer("stable", win, "2.1.0"), priv)

	feed := &Feed{Source: DirSource{Dir: dir}, Keys: []ed25519.PublicKey{pub}}
	if _, err := feed.Pointer(context.Background(), "stable", []Target{linux}); err == nil {
		t.Error("a pointer for another target must be rejected")
	}
}

func TestFeedDarwinFallsBackToUniversal(t *testing.T) {
	priv, pub := newKey(t)
	dir := t.TempDir()
	uni := Target{OS: "darwin", Arch: "universal"}
	writeSigned(t, dir, PointerPath("stable", uni), testPointer("stable", uni, "2.1.0"), priv)

	feed := &Feed{Source: DirSource{Dir: dir}, Keys: []ed25519.PublicKey{pub}}
	p, err := feed.Pointer(context.Background(), "stable", candidateTargets("darwin", "arm64"))
	if err != nil {
		t.Fatalf("pointer: %v", err)
	}
	if p.Target != "darwin-universal" {
		t.Errorf("got %s", p.Target)
	}
}

func TestSchemaFilesEmbedded(t *testing.T) {
	for _, name := range []string{PointerSchemaFile, ReleaseSchemaFile} {
		data, err := SchemaFS.ReadFile("schema/" + name)
		if err != nil || !strings.Contains(string(data), `"$id"`) {
			t.Errorf("%s: %v", name, err)
		}
	}
}
