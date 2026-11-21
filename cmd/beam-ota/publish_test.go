package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"beam-app/internal/application/update/ota"
)

func TestStageWritesVerifiableFeed(t *testing.T) {
	pub, priv, err := ota.GenerateKey()
	if err != nil {
		t.Fatal(err)
	}
	old := ota.TrustedPublicKeys
	ota.TrustedPublicKeys = []string{pub}
	t.Cleanup(func() { ota.TrustedPublicKeys = old })

	tmp := t.TempDir()
	keyFile := filepath.Join(tmp, "k.key")
	os.WriteFile(keyFile, []byte(priv), 0o600)
	bin := filepath.Join(tmp, "Beam.exe")
	os.WriteFile(bin, []byte("beam binary v2.1.0"), 0o644)
	relay := filepath.Join(tmp, "BeamRelay.exe")
	os.WriteFile(relay, []byte("relay"), 0o644)
	notes := filepath.Join(tmp, "notes.txt")
	os.WriteFile(notes, []byte("\ufeff# заголовок\n- Исправлен реконнект\n\n* Быстрее запуск\n"), 0o644)
	out := filepath.Join(tmp, "out")

	o := &publishOpts{
		keyPath: keyFile, target: "windows-amd64", version: "2.1.0", channel: "stable",
		notesRU: notes, baseURL: ota.DefaultBaseURL, outDir: out,
		files: multiFlag{"Beam.exe=" + bin, "BeamRelay.exe=" + relay},
		urls:  multiFlag{"https://mirror.example/{tag}/{asset}"},
	}
	res, err := stage(o)
	if err != nil {
		t.Fatalf("stage: %v", err)
	}

	// Upload order: binaries, manifest, pointer last.
	var names []string
	for _, f := range res.all() {
		names = append(names, f.name)
	}
	want := "windows-amd64-Beam.exe windows-amd64-BeamRelay.exe ota-release-windows-amd64.json ota-release-windows-amd64.json.sig ota-pointer-stable-windows-amd64.json ota-pointer-stable-windows-amd64.json.sig"
	if got := strings.Join(names, " "); got != want {
		t.Errorf("assets =\n  %s\nwant\n  %s", got, want)
	}

	keys, _ := ota.TrustedKeys()
	feed := &ota.Feed{Source: stagedSource{root: filepath.Join(out, "2.1.0")}, Keys: keys}
	target, _ := ota.ParseTarget("windows-amd64")
	p, err := feed.Pointer(context.Background(), "stable", []ota.Target{target})
	if err != nil {
		t.Fatalf("pointer: %v", err)
	}
	r, err := feed.Release(context.Background(), p)
	if err != nil {
		t.Fatalf("release: %v", err)
	}
	if got, want := r.Files[0].URLs, []string{
		"https://ota-updates.acelate.com/v1/assets/v2.1.0/windows-amd64-Beam.exe",
		"https://mirror.example/v2.1.0/windows-amd64-Beam.exe",
	}; strings.Join(got, " ") != strings.Join(want, " ") {
		t.Errorf("urls = %v, want %v", got, want)
	}
	if r.Files[1].Path != "BeamRelay.exe" || r.Files[1].Size != 5 {
		t.Errorf("relay entry = %+v", r.Files[1])
	}
	if got := strings.Join(r.Notes["ru"], "|"); got != "Исправлен реконнект|Быстрее запуск" {
		t.Errorf("notes = %q", got)
	}

	// Another channel's pointer is not there.
	if _, err := feed.Pointer(context.Background(), "beta", []ota.Target{target}); err == nil {
		t.Error("beta pointer must not exist")
	}
}

func TestStageRejectsUntrustedKey(t *testing.T) {
	_, priv, _ := ota.GenerateKey()
	old := ota.TrustedPublicKeys
	ota.TrustedPublicKeys = nil
	t.Cleanup(func() { ota.TrustedPublicKeys = old })

	tmp := t.TempDir()
	keyFile := filepath.Join(tmp, "k.key")
	os.WriteFile(keyFile, []byte(priv), 0o600)
	bin := filepath.Join(tmp, "Beam")
	os.WriteFile(bin, []byte("x"), 0o644)

	_, err := stage(&publishOpts{
		keyPath: keyFile, target: "linux-amd64", version: "2.1.0", channel: "stable",
		baseURL: ota.DefaultBaseURL, outDir: filepath.Join(tmp, "out"), files: multiFlag{"beam=" + bin},
	})
	if err == nil || !strings.Contains(err.Error(), "TrustedPublicKeys") {
		t.Errorf("err = %v, want an untrusted key error", err)
	}
}
