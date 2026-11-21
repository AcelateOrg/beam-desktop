//go:build linux

package platform

import (
	_ "embed"
	"os"
	"path/filepath"
)

//go:embed assets/appicon.png
var desktopIconPNG []byte

func DesktopIconPath() string { return desktopIconPath() }

func desktopIconPath() string {
	path := filepath.Join(GetAppDataDir(), "icon.png")

	if info, err := os.Stat(path); err == nil && info.Size() == int64(len(desktopIconPNG)) {
		return path
	}

	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return "beam"
	}
	if err := os.WriteFile(path, desktopIconPNG, 0644); err != nil {
		return "beam"
	}
	return path
}
