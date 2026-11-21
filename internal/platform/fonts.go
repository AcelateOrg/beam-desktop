package platform

import (
	"os"
	"path/filepath"
	"regexp"
)

// FontPrefix — путь asset server, по которому webview получает свои шрифты:
// /beam-font/<id>. Расширение не нужно — файл ищется по id.
const FontPrefix = "/beam-font/"

// FontExts — поддерживаемые форматы в порядке поиска.
var FontExts = []string{".woff2", ".woff", ".ttf", ".otf"}

var fontIDPattern = regexp.MustCompile(`^[a-f0-9]{12}$`)

// ValidFontID — id своего шрифта: 12 hex-символов (без путей и точек).
func ValidFontID(id string) bool {
	return fontIDPattern.MatchString(id)
}

// GetFontsDir — каталог загруженных пользователем шрифтов.
func GetFontsDir() string {
	return filepath.Join(GetAppDataDir(), "fonts")
}

// CustomFontFile находит файл шрифта по id.
func CustomFontFile(id string) (string, bool) {
	if !ValidFontID(id) {
		return "", false
	}
	for _, ext := range FontExts {
		path := filepath.Join(GetFontsDir(), id+ext)
		if info, err := os.Stat(path); err == nil && info.Mode().IsRegular() {
			return path, true
		}
	}
	return "", false
}
