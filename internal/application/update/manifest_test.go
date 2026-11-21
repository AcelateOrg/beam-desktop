package update

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"beam-app/internal/application/update/ota"
)

func release(version string) *ota.Release {
	return &ota.Release{
		SchemaVersion: ota.SchemaVersion,
		Kind:          ota.KindRelease,
		Target:        "windows-amd64",
		Version:       version,
		ReleasedAt:    time.Now(),
	}
}

func TestEvaluate(t *testing.T) {
	if evaluate(release("2.0.0"), "2.0.0") != nil {
		t.Error("same version must not be an update")
	}
	if evaluate(release("1.9.9"), "2.0.0") != nil {
		t.Error("older version must not be an update")
	}
	if u := evaluate(release("2.1.0"), "2.0.0"); u == nil || u.Mandatory {
		t.Errorf("2.1.0 over 2.0.0 should be an optional update, got %+v", u)
	}
	if evaluate(release("2.1.0"), "dev") == nil {
		t.Error("a dev build counts as 0.0.0 and gets the update")
	}
	if u := evaluate(release("2.0.1"), "v2.0.0-beta"); u == nil {
		t.Error("loose current version must parse")
	}

	r := release("2.1.0")
	r.MinSupportedVersion = "2.0.0"
	if u := evaluate(r, "1.9.0"); u == nil || !u.Mandatory {
		t.Error("below minSupportedVersion must be mandatory")
	}
	if u := evaluate(r, "2.0.0"); u == nil || u.Mandatory {
		t.Error("at minSupportedVersion must stay optional")
	}

	r = release("2.1.0")
	r.Mandatory = true
	if u := evaluate(r, "2.0.5"); u == nil || !u.Mandatory {
		t.Error("mandatory flag must carry over")
	}
}

func TestPickNotes(t *testing.T) {
	if got := pickNotes(map[string][]string{"en": {"a"}, "ru": {"б"}}); got[0] != "б" {
		t.Errorf("ru must win, got %v", got)
	}
	if got := pickNotes(map[string][]string{"en": {"a"}}); got[0] != "a" {
		t.Errorf("en fallback, got %v", got)
	}
	if got := pickNotes(map[string][]string{"de": {"x"}}); got[0] != "x" {
		t.Errorf("any language fallback, got %v", got)
	}
	if got := pickNotes(nil); len(got) != 0 {
		t.Errorf("no notes, got %v", got)
	}
}

func TestDownloadFileFallsBackToMirror(t *testing.T) {
	payload := []byte("new beam binary")
	sum := sha256.Sum256(payload)

	broken := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("tampered!"))
	}))
	defer broken.Close()
	good := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(payload)
	}))
	defer good.Close()

	f := ota.File{
		Path:   "Beam.exe",
		Size:   int64(len(payload)),
		SHA256: hex.EncodeToString(sum[:]),
		URLs:   []string{broken.URL + "/Beam.exe", good.URL + "/Beam.exe"},
	}

	dir := t.TempDir()
	var lastDone, lastTotal int64
	s := &Service{userAgent: "test"}
	if err := s.downloadFile(f, dir, func(_, _ string, done, total int64) { lastDone, lastTotal = done, total }); err != nil {
		t.Fatalf("download: %v", err)
	}
	got, err := os.ReadFile(filepath.Join(dir, "Beam.exe"))
	if err != nil || string(got) != string(payload) {
		t.Fatalf("staged file = %q, %v", got, err)
	}
	if lastDone != f.Size || lastTotal != f.Size {
		t.Errorf("progress ended at %d/%d", lastDone, lastTotal)
	}
}

func TestDownloadFileRejectsWrongHash(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("aaaa"))
	}))
	defer srv.Close()

	f := ota.File{
		Path:   "Beam.exe",
		Size:   4,
		SHA256: "0000000000000000000000000000000000000000000000000000000000000000",
		URLs:   []string{srv.URL + "/Beam.exe"},
	}
	s := &Service{userAgent: "test"}
	dir := t.TempDir()
	if err := s.downloadFile(f, dir, nil); err == nil {
		t.Fatal("a hash mismatch must fail")
	}
	if _, err := os.Stat(filepath.Join(dir, "Beam.exe")); !os.IsNotExist(err) {
		t.Error("a rejected file must not stay in staging")
	}
}
