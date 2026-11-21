//go:build !windows && !darwin && !linux

package update

import (
	"fmt"
	"os"
	"path/filepath"
)

func (s *Service) ApplyUpdate(stagingDir string) error {
	return fmt.Errorf("auto-update is not supported on this platform")
}

func installDir() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Dir(exePath), nil
}
