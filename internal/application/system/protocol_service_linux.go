//go:build linux

package system

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"beam-app/internal/platform"
)

type ProtocolService struct{}

func NewProtocolService() *ProtocolService { return &ProtocolService{} }

const mimeType = "x-scheme-handler/beam"

const desktopFileName = "beam-app.desktop"

func xdgDataHome() (string, error) {
	if dir := os.Getenv("XDG_DATA_HOME"); dir != "" {
		return dir, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to resolve home directory: %w", err)
	}
	return filepath.Join(home, ".local", "share"), nil
}

func desktopFilePath() (string, error) {
	dataHome, err := xdgDataHome()
	if err != nil {
		return "", err
	}
	return filepath.Join(dataHome, "applications", desktopFileName), nil
}

func (s *ProtocolService) Enable() error {
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to resolve exe path: %w", err)
	}

	path, err := desktopFilePath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("failed to create ~/.local/share/applications: %w", err)
	}

	content := fmt.Sprintf(`[Desktop Entry]
Type=Application
Name=BEAM
Comment=Fast VPN client
Exec=%s %%u
Icon=%s
Terminal=false
StartupNotify=false
NoDisplay=true
MimeType=%s;
Categories=Network;
`, quoteDesktopExec(exePath), platform.DesktopIconPath(), mimeType)

	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write the .desktop file: %w", err)
	}

	if out, err := exec.Command("xdg-mime", "default", desktopFileName, mimeType).CombinedOutput(); err != nil {
		return fmt.Errorf("xdg-mime default: %s: %w", strings.TrimSpace(string(out)), err)
	}
	_ = refreshDesktopDatabase()
	return nil
}

func (s *ProtocolService) Disable() error {
	path, err := desktopFilePath()
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove the .desktop file: %w", err)
	}
	_ = refreshDesktopDatabase()
	return nil
}

func (s *ProtocolService) IsEnabled() bool {
	out, err := exec.Command("xdg-mime", "query", "default", mimeType).Output()
	if err != nil {
		return false
	}
	return strings.TrimSpace(string(out)) == desktopFileName
}

func (s *ProtocolService) Fix() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to resolve exe path: %w", err)
	}
	_ = s.Disable()
	if err := s.Enable(); err != nil {
		return "", err
	}
	return exePath, nil
}

func refreshDesktopDatabase() error {
	dataHome, err := xdgDataHome()
	if err != nil {
		return err
	}
	return exec.Command("update-desktop-database", filepath.Join(dataHome, "applications")).Run()
}

func quoteDesktopExec(path string) string {
	if strings.ContainsAny(path, " \t") {
		return `"` + strings.ReplaceAll(path, `"`, `\"`) + `"`
	}
	return path
}
