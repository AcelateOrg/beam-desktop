//go:build windows

package update

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
)

func (s *Service) ApplyUpdate(stagingDir string) error {
	dir, err := installDir()
	if err != nil {
		return err
	}

	relayPath := filepath.Join(dir, "BeamRelay.exe")
	if _, err := os.Stat(relayPath); err != nil {
		return fmt.Errorf("BeamRelay.exe not found: %w", err)
	}

	cmd := exec.Command(relayPath, "--apply-update", stagingDir, dir, strconv.Itoa(os.Getpid()))
	return cmd.Start()
}

func installDir() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Dir(exePath), nil
}
