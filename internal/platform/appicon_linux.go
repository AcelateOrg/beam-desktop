//go:build linux

package platform

import (
	"bufio"
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// maxIconFileSize отсекает аномально большие файлы: иконка едет в UI как data:URL.
const maxIconFileSize = 512 << 10

var (
	desktopIconsOnce sync.Once
	desktopIcons     map[string]string // имя исполняемого файла -> Icon= из .desktop
	appIconCache     sync.Map
)

// AppIcon находит иконку приложения по его .desktop-файлу и теме hicolor и
// возвращает её как data:URL, "" если не нашлась.
func AppIcon(execPath string) string {
	name := strings.ToLower(baseExecutableName(execPath))
	if name == "" {
		return ""
	}
	if cached, ok := appIconCache.Load(name); ok {
		return cached.(string)
	}
	desktopIconsOnce.Do(loadDesktopIcons)

	icon := desktopIcons[name]
	if icon == "" {
		icon = name
	}
	result := iconDataURL(resolveIconFile(icon))
	appIconCache.Store(name, result)
	return result
}

func loadDesktopIcons() {
	desktopIcons = make(map[string]string)
	for _, dir := range desktopSearchDirs() {
		_ = filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
			if err != nil || d.IsDir() || !strings.HasSuffix(d.Name(), ".desktop") {
				return nil
			}
			icon, names := desktopEntryIcon(path)
			if icon == "" {
				return nil
			}
			for _, name := range names {
				key := strings.ToLower(name)
				if _, exists := desktopIcons[key]; !exists {
					desktopIcons[key] = icon
				}
			}
			return nil
		})
	}
}

func desktopEntryIcon(path string) (string, []string) {
	file, err := os.Open(path)
	if err != nil {
		return "", nil
	}
	defer file.Close()

	var inEntry bool
	var icon, execName, tryExec string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "[") {
			inEntry = line == "[Desktop Entry]"
			continue
		}
		if !inEntry {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		value = strings.TrimSpace(value)
		switch strings.TrimSpace(key) {
		case "Icon":
			icon = value
		case "Exec":
			execName = baseExecutableName(desktopExecBinary(value))
		case "TryExec":
			tryExec = baseExecutableName(value)
		}
	}
	var names []string
	if execName != "" {
		names = append(names, execName)
	}
	if tryExec != "" && tryExec != execName {
		names = append(names, tryExec)
	}
	// Имя .desktop-файла часто совпадает с процессом (firefox.desktop -> firefox).
	names = append(names, strings.TrimSuffix(filepath.Base(path), ".desktop"))
	return icon, names
}

func iconSearchRoots() []string {
	var roots []string
	if home, err := os.UserHomeDir(); err == nil {
		roots = append(roots,
			filepath.Join(home, ".local", "share", "icons"),
			filepath.Join(home, ".icons"),
			filepath.Join(home, ".local", "share", "flatpak", "exports", "share", "icons"),
		)
	}
	raw := strings.TrimSpace(os.Getenv("XDG_DATA_DIRS"))
	if raw == "" {
		raw = "/usr/local/share:/usr/share"
	}
	for _, dir := range strings.Split(raw, ":") {
		if dir = strings.TrimSpace(dir); dir != "" {
			roots = append(roots, filepath.Join(dir, "icons"))
		}
	}
	return append(roots, "/var/lib/flatpak/exports/share/icons")
}

// resolveIconFile ищет файл иконки: абсолютный путь из .desktop, иначе тема
// hicolor (сначала подходящие размеры, потом вектор) и /usr/share/pixmaps.
func resolveIconFile(icon string) string {
	if filepath.IsAbs(icon) {
		if isFile(icon) {
			return icon
		}
		return ""
	}
	sizes := []string{"48x48", "64x64", "128x128", "32x32", "96x96", "256x256", "scalable"}
	for _, root := range iconSearchRoots() {
		for _, size := range sizes {
			for _, ext := range []string{".png", ".svg"} {
				candidate := filepath.Join(root, "hicolor", size, "apps", icon+ext)
				if isFile(candidate) {
					return candidate
				}
			}
		}
	}
	for _, ext := range []string{".png", ".svg"} {
		candidate := filepath.Join("/usr/share/pixmaps", icon+ext)
		if isFile(candidate) {
			return candidate
		}
	}
	return ""
}

func isFile(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.Mode().IsRegular() && info.Size() > 0 && info.Size() <= maxIconFileSize
}

func iconDataURL(path string) string {
	if path == "" {
		return ""
	}
	var mime string
	switch strings.ToLower(filepath.Ext(path)) {
	case ".png":
		mime = "image/png"
	case ".svg":
		mime = "image/svg+xml"
	default:
		return ""
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(raw)
}
