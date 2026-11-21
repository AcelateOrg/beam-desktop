package update

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"beam-app/internal/application/update/ota"
	"beam-app/internal/platform"
)

// CheckForUpdate reads the signed pointer for this platform and, if it names
// a newer version, the signed release manifest. nil means up to date.
func (s *Service) CheckForUpdate(ctx context.Context, currentVersion string) (*Update, error) {
	keys, err := ota.TrustedKeys()
	if err != nil {
		return nil, err
	}

	feed := &ota.Feed{
		Source: ota.HTTPSource{
			BaseURL:   s.baseURL,
			UserAgent: s.userAgent,
		},
		Keys: keys,
	}

	pointer, err := feed.Pointer(ctx, s.channel, ota.CandidateTargets())
	if errors.Is(err, ota.ErrNotFound) {
		// Nothing published for this platform yet.
		updateLog.Printf("check: nothing published for %v on %s", ota.CandidateTargets(), s.channel)
		return nil, nil
	}
	if err != nil {
		updateLog.Printf("check failed: %v", err)
		return nil, err
	}

	latest, err := ota.ParseVersion(pointer.Version)
	if err != nil {
		return nil, err
	}
	if latest.Compare(ota.LooseVersion(currentVersion)) <= 0 {
		return nil, nil
	}

	release, err := feed.Release(ctx, pointer)
	if err != nil {
		updateLog.Printf("check: release %s failed: %v", pointer.Version, err)
		return nil, err
	}
	return evaluate(release, currentVersion), nil
}

// DownloadUpdate fetches every changed file of the release into a staging
// dir, verifying size and sha256. Each file is tried from its mirrors in
// order.
func (s *Service) DownloadUpdate(release *ota.Release, onProgress ProgressFunc) (string, error) {
	dir, err := installDir()
	if err != nil {
		return "", err
	}

	stagingDir := filepath.Join(platform.GetTempDir(), "update-staging")
	if err := os.RemoveAll(stagingDir); err != nil {
		return "", err
	}
	if err := os.MkdirAll(stagingDir, 0755); err != nil {
		return "", err
	}

	var pending []ota.File
	var total int64
	for _, f := range release.Files {
		localPath := filepath.Join(dir, filepath.FromSlash(f.Path))
		if hash, err := fileSHA256(localPath); err == nil && hash == f.SHA256 {
			continue
		}
		pending = append(pending, f)
		total += f.Size
	}

	// Report progress over all files together, not per file: the bar must
	// not jump back to 0% when BeamRelay.exe starts after Beam.exe.
	var done int64
	for _, f := range pending {
		offset := done
		fileProgress := func(stage, name string, bytesDone, _ int64) {
			if onProgress != nil {
				onProgress(stage, name, offset+bytesDone, total)
			}
		}
		if err := s.downloadFile(f, stagingDir, fileProgress); err != nil {
			updateLog.Printf("download of %s %s failed: %v", release.Version, f.Path, err)
			os.RemoveAll(stagingDir)
			return "", err
		}
		done += f.Size
	}

	return stagingDir, nil
}

func (s *Service) downloadFile(f ota.File, stagingDir string, onProgress ProgressFunc) error {
	if err := f.Validate(); err != nil {
		return err
	}
	destPath := filepath.Join(stagingDir, filepath.FromSlash(f.Path))
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return err
	}

	var failures []string
	for _, url := range f.URLs {
		err := s.downloadFrom(url, f, destPath, onProgress)
		if err == nil {
			return nil
		}
		_ = os.Remove(destPath)
		failures = append(failures, err.Error())
	}
	return fmt.Errorf("failed to download %s: %s", f.Path, strings.Join(failures, "; "))
}

func (s *Service) downloadFrom(url string, f ota.File, destPath string, onProgress ProgressFunc) error {
	out, err := os.OpenFile(destPath, os.O_CREATE|os.O_RDWR|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer out.Close()

	progress := func(done int64) {
		if onProgress != nil {
			onProgress("downloading", f.Path, done, f.Size)
		}
	}
	if err := s.fetchFile(url, out, f.Size, progress); err != nil {
		return fmt.Errorf("%s: %w", url, err)
	}
	if err := out.Close(); err != nil {
		return err
	}

	if onProgress != nil {
		onProgress("verifying", f.Path, f.Size, f.Size)
	}
	// Chunks land out of order, so the hash is taken over the finished file.
	if info, err := os.Stat(destPath); err != nil || info.Size() != f.Size {
		return fmt.Errorf("%s: file size does not match the manifest", url)
	}
	sum, err := fileSHA256(destPath)
	if err != nil {
		return err
	}
	if sum != f.SHA256 {
		return fmt.Errorf("%s: sha256 does not match the manifest", url)
	}
	return nil
}

func fileSHA256(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}
