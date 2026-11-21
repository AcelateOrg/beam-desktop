//go:build darwin

package platform

import (
	"context"
	"os"
	"os/exec"
	"strings"
	"time"
)

// TitleBarDoubleClickAction mirrors System Settings → Desktop & Dock →
// "Double-click a window's title bar to". Beam runs as root via sudo, so the
// global domain has to be read as the logged-in user, not root.
func TitleBarDoubleClickAction() TitleBarAction {
	switch strings.TrimSpace(readGlobalDefault("AppleActionOnDoubleClick")) {
	case "Minimize":
		return TitleBarMinimise
	case "None":
		return TitleBarNone
	case "Maximize", "Fill":
		// Wails has no "Fill"; zoom is the closest equivalent.
		return TitleBarMaximise
	}

	// Pre-Big Sur boolean that predates AppleActionOnDoubleClick.
	if strings.TrimSpace(readGlobalDefault("AppleMiniaturizeOnDoubleClick")) == "1" {
		return TitleBarMinimise
	}
	return TitleBarMaximise
}

func readGlobalDefault(key string) string {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	var cmd *exec.Cmd
	if sudoUser := os.Getenv("SUDO_USER"); os.Geteuid() == 0 && sudoUser != "" && sudoUser != "root" {
		cmd = exec.CommandContext(ctx, sudoPath, "-n", "-u", sudoUser, "/usr/bin/defaults", "read", "-g", key)
	} else {
		cmd = exec.CommandContext(ctx, "/usr/bin/defaults", "read", "-g", key)
	}

	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return string(out)
}
