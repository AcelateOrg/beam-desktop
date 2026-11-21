package ota

import (
	"context"
	"crypto/ed25519"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// maxFeedFileSize caps a pointer/manifest/signature download. Real files are
// a few KB; anything bigger is not ours.
const maxFeedFileSize = 1 << 20

// ErrNotFound is returned by a Source when the file does not exist.
var ErrNotFound = errors.New("not found")

// Source reads feed files by site path ("/v1/channels/stable/...").
type Source interface {
	Fetch(ctx context.Context, sitePath string) ([]byte, error)
}

// HTTPSource reads the feed over HTTP(S).
type HTTPSource struct {
	BaseURL   string
	Client    *http.Client
	UserAgent string
}

func (s HTTPSource) Fetch(ctx context.Context, sitePath string) ([]byte, error) {
	url := trimSlash(s.BaseURL) + sitePath
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	// The pointer changes in place; ask caches in between for a fresh copy.
	req.Header.Set("Cache-Control", "no-cache")
	if s.UserAgent != "" {
		req.Header.Set("User-Agent", s.UserAgent)
	}
	client := s.Client
	if client == nil {
		client = &http.Client{Timeout: 15 * time.Second}
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("%s: %w", url, ErrNotFound)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s: %s", url, resp.Status)
	}
	return readCapped(resp.Body, url)
}

// DirSource reads the feed from a local checkout of the site repo.
type DirSource struct{ Dir string }

func (s DirSource) Fetch(_ context.Context, sitePath string) ([]byte, error) {
	full := filepath.Join(s.Dir, filepath.FromSlash(strings.TrimPrefix(sitePath, "/")))
	f, err := os.Open(full)
	if errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("%s: %w", full, ErrNotFound)
	}
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return readCapped(f, full)
}

func readCapped(r io.Reader, name string) ([]byte, error) {
	data, err := io.ReadAll(io.LimitReader(r, maxFeedFileSize+1))
	if err != nil {
		return nil, err
	}
	if len(data) > maxFeedFileSize {
		return nil, fmt.Errorf("%s: file is larger than %d bytes", name, maxFeedFileSize)
	}
	return data, nil
}

// Feed reads and verifies pointers and releases.
type Feed struct {
	Source Source
	Keys   []ed25519.PublicKey
}

// fetchSigned returns the file only if its signature checks out.
func (f *Feed) fetchSigned(ctx context.Context, sitePath string) ([]byte, error) {
	if len(f.Keys) == 0 {
		return nil, ErrNoTrustedKeys
	}
	data, err := f.Source.Fetch(ctx, sitePath)
	if err != nil {
		return nil, err
	}
	sig, err := f.Source.Fetch(ctx, sitePath+SignatureSuffix)
	if err != nil {
		return nil, fmt.Errorf("signature of %s: %w", sitePath, err)
	}
	if err := Verify(data, sig, f.Keys); err != nil {
		return nil, fmt.Errorf("%s: %w", sitePath, err)
	}
	return data, nil
}

// Pointer reads the current version for one channel, trying the targets in
// order (see CandidateTargets) until one is published.
func (f *Feed) Pointer(ctx context.Context, channel string, targets []Target) (*Pointer, error) {
	if len(targets) == 0 {
		return nil, errors.New("auto-update is not supported on this platform")
	}
	var lastErr error
	for _, t := range targets {
		data, err := f.fetchSigned(ctx, PointerPath(channel, t))
		if errors.Is(err, ErrNotFound) {
			lastErr = err
			continue
		}
		if err != nil {
			return nil, err
		}
		p, err := DecodePointer(data)
		if err != nil {
			return nil, err
		}
		// The signature covers the content, not the URL: make sure a
		// validly signed pointer of another platform was not swapped in.
		if p.Channel != channel || p.Target != t.String() {
			return nil, fmt.Errorf("pointer at %s describes %s/%s", PointerPath(channel, t), p.Channel, p.Target)
		}
		return p, nil
	}
	return nil, lastErr
}

// Release reads the manifest a pointer refers to.
func (f *Feed) Release(ctx context.Context, p *Pointer) (*Release, error) {
	data, err := f.fetchSigned(ctx, p.Manifest)
	if err != nil {
		return nil, err
	}
	r, err := DecodeRelease(data)
	if err != nil {
		return nil, err
	}
	if r.Target != p.Target || r.Version != p.Version {
		return nil, fmt.Errorf("manifest %s describes %s %s, pointer says %s %s", p.Manifest, r.Target, r.Version, p.Target, p.Version)
	}
	return r, nil
}
