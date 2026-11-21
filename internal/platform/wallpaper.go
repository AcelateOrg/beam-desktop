package platform

import (
	"context"
	"errors"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// ErrNoWallpaper — обои рабочего стола не удалось найти (не поддерживаемое
// окружение, слайд-шоу без файла, сплошной цвет вместо картинки).
var ErrNoWallpaper = errors.New("не удалось найти обои рабочего стола")

// maxWallpaperBytes отсекает заведомо не картинки и гигантские файлы, которые
// webview всё равно будет декодировать слишком долго.
const maxWallpaperBytes = 64 << 20

// GetBackdropPhotoPath — файл своего фото для фона интерфейса. Фронт перекодирует
// любое выбранное изображение в JPEG, поэтому имя фиксировано.
func GetBackdropPhotoPath() string {
	return filepath.Join(GetAppDataDir(), "backdrop.jpg")
}

// WallpaperFile возвращает путь к текущим обоям рабочего стола и сведения о
// файле. Кандидаты зависят от ОС и проверяются по порядку.
func WallpaperFile() (string, os.FileInfo, error) {
	for _, candidate := range wallpaperCandidates() {
		path := normalizeWallpaperPath(candidate)
		if path == "" {
			continue
		}
		info, err := os.Stat(path)
		if err != nil || !info.Mode().IsRegular() || info.Size() == 0 || info.Size() > maxWallpaperBytes {
			continue
		}
		return path, info, nil
	}
	return "", nil, ErrNoWallpaper
}

// normalizeWallpaperPath снимает кавычки и схему file:// (GNOME, KDE, macOS
// отдают URI).
func normalizeWallpaperPath(value string) string {
	value = strings.TrimSpace(value)
	value = strings.Trim(value, "'\"")
	if value == "" {
		return ""
	}
	if strings.HasPrefix(value, "file://") {
		parsed, err := url.Parse(value)
		if err != nil {
			return ""
		}
		return parsed.Path
	}
	return value
}

// wallpaperCommand запускает короткую системную утилиту и возвращает её вывод;
// любая ошибка — пустая строка (кандидат просто пропускается).
func wallpaperCommand(name string, args ...string) string {
	path, err := exec.LookPath(name)
	if err != nil {
		return ""
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, path, args...)
	hideWallpaperCommandWindow(cmd)
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}
