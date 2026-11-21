// Package media отдаёт webview локальные картинки фона через asset server Wails:
// так изображение не гоняется через IPC и localStorage в виде base64.
package media

import (
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"beam-app/internal/platform"
	"beam-bridge/core/infrastructure/mediacache"
)

// profileMedia resolves cached provider images (icon, banner); set at startup.
var profileMedia func(name string) (string, bool)

// SetProfileMedia wires the profile image cache into the asset server.
func SetProfileMedia(resolve func(name string) (string, bool)) {
	profileMedia = resolve
}

// serveProfileMedia serves /beam-media/<name>. SVG from a provider is shown
// only through <img>, the CSP keeps it inert if opened directly.
func serveProfileMedia(w http.ResponseWriter, r *http.Request) {
	if profileMedia == nil {
		http.NotFound(w, r)
		return
	}
	path, ok := profileMedia(strings.TrimPrefix(r.URL.Path, mediacache.Prefix))
	if !ok {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src data:")
	serveImage(w, r, path)
}

// BackdropPrefix — путь, по которому фронт запрашивает картинки фона:
// /beam-backdrop/wallpaper — обои ОС, /beam-backdrop/photo — своё фото.
// Query (?v=...) игнорируется и нужен только для сброса кэша webview.
const BackdropPrefix = "/beam-backdrop/"

// BackdropMiddleware перехватывает запросы BackdropPrefix до раздачи ассетов
// (в dev-режиме — до прокси на Vite, который иначе отдал бы index.html).
func BackdropMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		isMedia := strings.HasPrefix(r.URL.Path, mediacache.Prefix)
		isFont := strings.HasPrefix(r.URL.Path, platform.FontPrefix)
		if !isMedia && !isFont && !strings.HasPrefix(r.URL.Path, BackdropPrefix) {
			next.ServeHTTP(w, r)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if isMedia {
			serveProfileMedia(w, r)
			return
		}
		if isFont {
			serveFont(w, r)
			return
		}

		var path string
		switch strings.TrimPrefix(r.URL.Path, BackdropPrefix) {
		case "wallpaper":
			found, _, err := platform.WallpaperFile()
			if err != nil {
				http.NotFound(w, r)
				return
			}
			path = found
		case "photo":
			path = platform.GetBackdropPhotoPath()
		default:
			http.NotFound(w, r)
			return
		}

		serveImage(w, r, path)
	})
}

// serveFont serves /beam-font/<id> — a user-uploaded font (see settings.SaveCustomFont).
func serveFont(w http.ResponseWriter, r *http.Request) {
	path, ok := platform.CustomFontFile(strings.TrimPrefix(r.URL.Path, platform.FontPrefix))
	if !ok {
		http.NotFound(w, r)
		return
	}
	f, err := os.Open(path)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		http.NotFound(w, r)
		return
	}
	contentType := "font/" + strings.TrimPrefix(filepath.Ext(path), ".")
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "max-age=31536000, immutable")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeContent(w, r, "", info.ModTime(), f)
}

func serveImage(w http.ResponseWriter, r *http.Request, path string) {
	f, err := os.Open(path)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil || !info.Mode().IsRegular() {
		http.NotFound(w, r)
		return
	}

	contentType := imageContentType(f, path)
	if contentType == "" {
		http.Error(w, "unsupported media type", http.StatusUnsupportedMediaType)
		return
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeContent(w, r, "", info.ModTime(), f)
}

// imageContentType определяет тип по содержимому (TranscodedWallpaper в Windows — без
// расширения), затем по расширению. Не картинка — пустая строка.
func imageContentType(f *os.File, path string) string {
	head := make([]byte, 512)
	n, _ := io.ReadFull(f, head)
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return ""
	}
	if sniffed := http.DetectContentType(head[:n]); strings.HasPrefix(sniffed, "image/") {
		return sniffed
	}

	switch ext := strings.ToLower(filepath.Ext(path)); ext {
	case ".heic", ".heif":
		return "image/heic"
	case ".avif":
		return "image/avif"
	case ".jxl":
		return "image/jxl"
	default:
		if byExt := mime.TypeByExtension(ext); strings.HasPrefix(byExt, "image/") {
			return byExt
		}
	}
	return ""
}
