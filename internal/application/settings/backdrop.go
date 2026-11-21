package settings

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"beam-app/internal/platform"
	domainSettings "beam-bridge/core/domain/settings"
)

// maxBackdropPhotoBytes — лимит на уже перекодированный фронтом JPEG
// (до 2560 px по длинной стороне он занимает сильно меньше).
const maxBackdropPhotoBytes = 16 << 20

func (s *Service) GetBackdrop() domainSettings.BackdropSettings {
	b := s.repo.Get().Appearance.Backdrop
	if b.Mode == "" {
		b.Mode = domainSettings.BackdropOff
	}
	return b
}

// UpdateBackdrop меняет режим и параметры. Версию фото задаёт только
// SaveBackdropPhoto: клиент не может сослаться на несуществующий файл.
func (s *Service) UpdateBackdrop(b domainSettings.BackdropSettings) (domainSettings.BackdropSettings, error) {
	current := s.repo.Get().Appearance
	b.PhotoVersion = current.Backdrop.PhotoVersion
	if b.Mode == domainSettings.BackdropPhoto && !backdropPhotoExists() {
		return domainSettings.BackdropSettings{}, errors.New("фото для фона не загружено")
	}
	current.Backdrop = b
	if err := s.repo.UpdateAppearance(current); err != nil {
		return domainSettings.BackdropSettings{}, err
	}
	return s.GetBackdrop(), nil
}

// SaveBackdropPhoto сохраняет фото (base64 JPEG/PNG/WebP, можно data URL) и
// включает режим «фото».
func (s *Service) SaveBackdropPhoto(encoded string) (domainSettings.BackdropSettings, error) {
	if i := strings.Index(encoded, ","); strings.HasPrefix(encoded, "data:") && i > 0 {
		encoded = encoded[i+1:]
	}
	if base64.StdEncoding.DecodedLen(len(encoded)) > maxBackdropPhotoBytes+3 {
		return domainSettings.BackdropSettings{}, errors.New("фото слишком большое")
	}
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return domainSettings.BackdropSettings{}, fmt.Errorf("некорректные данные фото: %w", err)
	}
	if len(data) == 0 || len(data) > maxBackdropPhotoBytes {
		return domainSettings.BackdropSettings{}, errors.New("фото слишком большое")
	}
	switch http.DetectContentType(data) {
	case "image/jpeg", "image/png", "image/webp":
	default:
		return domainSettings.BackdropSettings{}, errors.New("неподдерживаемый формат фото")
	}

	if err := writeFileAtomic(platform.GetBackdropPhotoPath(), data); err != nil {
		return domainSettings.BackdropSettings{}, fmt.Errorf("не удалось сохранить фото: %w", err)
	}

	version := make([]byte, 6)
	if _, err := rand.Read(version); err != nil {
		return domainSettings.BackdropSettings{}, err
	}

	current := s.repo.Get().Appearance
	current.Backdrop.Mode = domainSettings.BackdropPhoto
	current.Backdrop.PhotoVersion = hex.EncodeToString(version)
	if err := s.repo.UpdateAppearance(current); err != nil {
		return domainSettings.BackdropSettings{}, err
	}
	return s.GetBackdrop(), nil
}

// RemoveBackdropPhoto удаляет фото; если оно было фоном, фон выключается.
func (s *Service) RemoveBackdropPhoto() (domainSettings.BackdropSettings, error) {
	if err := os.Remove(platform.GetBackdropPhotoPath()); err != nil && !errors.Is(err, os.ErrNotExist) {
		return domainSettings.BackdropSettings{}, err
	}
	current := s.repo.Get().Appearance
	if current.Backdrop.Mode == domainSettings.BackdropPhoto {
		current.Backdrop.Mode = domainSettings.BackdropOff
	}
	current.Backdrop.PhotoVersion = ""
	if err := s.repo.UpdateAppearance(current); err != nil {
		return domainSettings.BackdropSettings{}, err
	}
	return s.GetBackdrop(), nil
}

// WallpaperVersion сообщает, найдены ли обои ОС, и их версию — хэш пути,
// размера и времени изменения. Версия меняется при смене картинки, и фронт
// пересчитывает палитру; сам путь наружу не отдаётся.
func (s *Service) WallpaperVersion() (string, bool) {
	path, info, err := platform.WallpaperFile()
	if err != nil {
		return "", false
	}
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s|%d|%d", path, info.Size(), info.ModTime().UnixNano())))
	return hex.EncodeToString(sum[:8]), true
}

func backdropPhotoExists() bool {
	info, err := os.Stat(platform.GetBackdropPhotoPath())
	return err == nil && info.Mode().IsRegular() && info.Size() > 0
}

func writeFileAtomic(path string, data []byte) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".backdrop-*.tmp")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, path)
}
