//go:build linux

package platform

import (
	"bufio"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// wallpaperCandidates опрашивает распространённые окружения: GNOME (с учётом
// тёмной схемы), Cinnamon, MATE, KDE Plasma и XFCE.
func wallpaperCandidates() []string {
	var out []string

	gnomeKeys := []string{"picture-uri", "picture-uri-dark"}
	if strings.Contains(wallpaperCommand("gsettings", "get", "org.gnome.desktop.interface", "color-scheme"), "dark") {
		gnomeKeys = []string{"picture-uri-dark", "picture-uri"}
	}
	for _, key := range gnomeKeys {
		out = append(out, wallpaperCommand("gsettings", "get", "org.gnome.desktop.background", key))
	}
	out = append(out,
		wallpaperCommand("gsettings", "get", "org.cinnamon.desktop.background", "picture-uri"),
		wallpaperCommand("gsettings", "get", "org.mate.background", "picture-filename"),
	)

	if home, err := os.UserHomeDir(); err == nil {
		out = append(out, plasmaWallpapers(filepath.Join(home, ".config", "plasma-org.kde.plasma.desktop-appletsrc"))...)
	}

	out = append(out, xfceWallpapers()...)
	return out
}

// plasmaWallpapers достаёт Image= из секций Wallpaper конфига Plasma.
func plasmaWallpapers(path string) []string {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	var out []string
	inWallpaper := false
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "[") {
			inWallpaper = strings.Contains(line, "[Wallpaper]")
			continue
		}
		if inWallpaper && strings.HasPrefix(line, "Image=") {
			out = append(out, strings.TrimPrefix(line, "Image="))
		}
	}
	return out
}

// xfceWallpapers читает last-image всех мониторов из xfconf.
func xfceWallpapers() []string {
	list := wallpaperCommand("xfconf-query", "-c", "xfce4-desktop", "-l")
	if list == "" {
		return nil
	}
	var out []string
	for _, prop := range strings.Split(list, "\n") {
		prop = strings.TrimSpace(prop)
		if strings.HasSuffix(prop, "/last-image") {
			out = append(out, wallpaperCommand("xfconf-query", "-c", "xfce4-desktop", "-p", prop))
			if len(out) >= 4 {
				break
			}
		}
	}
	return out
}

func hideWallpaperCommandWindow(*exec.Cmd) {}
