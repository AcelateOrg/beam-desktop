package platform

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

// On some machines WebView2 draws nothing with GPU acceleration on (broken or
// missing driver, hybrid graphics, RDP, VMs): the window stays the colour of
// its background, i.e. black. Without the GPU it renders in software and
// works, so the choice is remembered in a marker file next to the settings.
const webviewGpuOffFile = "webview-gpu.off"

func webviewGpuOffPath() string {
	return filepath.Join(GetAppDataDir(), webviewGpuOffFile)
}

// WebviewGpuDisabled reports whether WebView2 should start with --disable-gpu:
// the marker file exists, BEAM_DISABLE_GPU is set, or --disable-gpu was passed.
func WebviewGpuDisabled(args []string) bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("BEAM_DISABLE_GPU"))) {
	case "", "0", "false", "off":
	default:
		return true
	}
	for _, arg := range args {
		if arg == "--disable-gpu" || arg == "-disable-gpu" {
			return true
		}
	}
	_, err := os.Stat(webviewGpuOffPath())
	return err == nil
}

// SetWebviewGpuDisabled stores the choice for the next launch.
func SetWebviewGpuDisabled(disabled bool, reason string) error {
	path := webviewGpuOffPath()
	if !disabled {
		LogCrashEvent("webview: GPU acceleration re-enabled (%s)", reason)
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return err
		}
		return nil
	}
	LogCrashEvent("webview: GPU acceleration disabled (%s)", reason)
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(time.Now().Format(time.RFC3339)+" "+reason+"\n"), 0644)
}
