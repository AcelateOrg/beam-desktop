package platform

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func GetAppDataDir() string {
	var base string

	switch runtime.GOOS {
	case "windows":
		base = os.Getenv("APPDATA")
	case "darwin":
		home, _ := os.UserHomeDir()
		base = filepath.Join(home, "Library", "Application Support")
	default:
		home, _ := os.UserHomeDir()
		base = xdgConfigHome(home)
	}

	return filepath.Join(base, "Beam"+variantSuffix())
}

func xdgConfigHome(home string) string {
	if dir := os.Getenv("XDG_CONFIG_HOME"); filepath.IsAbs(dir) {
		return dir
	}
	return filepath.Join(home, ".config")
}

func GetProfilesDir() string {
	return filepath.Join(GetAppDataDir(), "profiles")
}

func GetLogsDir() string {
	return filepath.Join(GetAppDataDir(), "logs")
}

func GetTempDir() string {
	return filepath.Join(GetAppDataDir(), "temp")
}

func OpenFolder(path string) error {
	if err := os.MkdirAll(path, 0755); err != nil {
		return err
	}
	switch runtime.GOOS {
	case "windows":
		return exec.Command("explorer", path).Start()
	case "darwin":
		return exec.Command("open", path).Start()
	default:
		return exec.Command("xdg-open", path).Start()
	}
}

func RevealFile(path string) error {
	switch runtime.GOOS {
	case "windows":
		return exec.Command("explorer", "/select,"+path).Start()
	case "darwin":
		return exec.Command("open", "-R", path).Start()
	default:
		return exec.Command("xdg-open", filepath.Dir(path)).Start()
	}
}

func EnsureDirs() error {
	dirs := []string{
		GetAppDataDir(),
		GetProfilesDir(),
		GetLogsDir(),
		GetTempDir(),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}
	}

	return nil
}
