package platform

import (
	"os"
	"path/filepath"
)

func resolveSelfExecutable() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.EvalSymlinks(exe)
}
