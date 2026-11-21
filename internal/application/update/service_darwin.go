//go:build darwin

package update

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"

	"beam-app/internal/platform"
)

func (s *Service) ApplyUpdate(stagingDir string) error {
	bundlePath, err := installDir()
	if err != nil {
		return err
	}

	relayPath := filepath.Join(bundlePath, "Contents", "MacOS", "beam-relay")
	if _, err := os.Stat(relayPath); err != nil {
		return fmt.Errorf("beam-relay not found: %w", err)
	}

	cmd := exec.Command(relayPath, "--apply-update", stagingDir, bundlePath, strconv.Itoa(os.Getpid()))
	return cmd.Start()
}

func installDir() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	bundlePath, ok := platform.ResolveAppBundle(exePath)
	if !ok {
		return "", fmt.Errorf("failed to resolve the .app bundle from path %s", exePath)
	}
	return bundlePath, nil
}
