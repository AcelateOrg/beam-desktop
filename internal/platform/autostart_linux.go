//go:build linux

package platform

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const autoStartFlag = "--autostart"

func IsAutoStartLaunch(args []string) bool {
	for _, arg := range args {
		if strings.EqualFold(strings.TrimSpace(arg), autoStartFlag) {
			return true
		}
	}
	return false
}

func autostartDesktopPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("failed to resolve XDG_CONFIG_HOME: %w", err)
	}
	return filepath.Join(configDir, "autostart", "beam-app"+variantSuffix()+".desktop"), nil
}

func IsLaunchOnStartupEnabled(appName string) (bool, error) {
	path, err := autostartDesktopPath()
	if err != nil {
		return false, err
	}
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func SetLaunchOnStartup(appName string, enabled bool) error {
	path, err := autostartDesktopPath()
	if err != nil {
		return err
	}

	if !enabled {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to remove the autostart entry: %w", err)
		}
		return nil
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to resolve exe path: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("failed to create the autostart directory: %w", err)
	}

	content := fmt.Sprintf(`[Desktop Entry]
Type=Application
Name=BEAM
Comment=BEAM VPN autostart
Exec=%s %s
Icon=%s
Terminal=false
X-GNOME-Autostart-enabled=true
`, quoteDesktopExec(exePath), autoStartFlag, desktopIconPath())

	return os.WriteFile(path, []byte(content), 0644)
}

func quoteDesktopExec(path string) string {
	if strings.ContainsAny(path, " \t") {
		return `"` + strings.ReplaceAll(path, `"`, `\"`) + `"`
	}
	return path
}
