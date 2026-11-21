package settings

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"beam-app/internal/platform"
)

const (
	maxFontBytes    = 10 << 20
	maxCustomFonts  = 16
	maxFontNameRune = 40
	// CustomFontPrefix — значение Appearance.Font для своего шрифта: custom:<id>.
	CustomFontPrefix = "custom:"
)

// CustomFont — загруженный пользователем шрифт.
type CustomFont struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Ext     string `json:"ext"`
	AddedAt int64  `json:"addedAt"`
}

var fontsMu sync.Mutex

func fontsIndexPath() string { return filepath.Join(platform.GetFontsDir(), "fonts.json") }

func readFontsIndex() []CustomFont {
	data, err := os.ReadFile(fontsIndexPath())
	if err != nil {
		return nil
	}
	var list []CustomFont
	if json.Unmarshal(data, &list) != nil {
		return nil
	}
	// Только записи с живым файлом.
	out := list[:0]
	for _, f := range list {
		if _, ok := platform.CustomFontFile(f.ID); ok {
			out = append(out, f)
		}
	}
	return out
}

func writeFontsIndex(list []CustomFont) error {
	if list == nil {
		list = []CustomFont{}
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return writeFileAtomic(fontsIndexPath(), data)
}

// ListCustomFonts — свои шрифты в порядке добавления.
func (s *Service) ListCustomFonts() []CustomFont {
	fontsMu.Lock()
	defer fontsMu.Unlock()
	list := readFontsIndex()
	if list == nil {
		return []CustomFont{}
	}
	return list
}

// fontExt определяет формат по сигнатуре файла (расширению не верим).
func fontExt(data []byte) string {
	if len(data) < 4 {
		return ""
	}
	switch head := data[:4]; {
	case bytes.Equal(head, []byte("wOF2")):
		return ".woff2"
	case bytes.Equal(head, []byte("wOFF")):
		return ".woff"
	case bytes.Equal(head, []byte("OTTO")):
		return ".otf"
	case bytes.Equal(head, []byte{0, 1, 0, 0}), bytes.Equal(head, []byte("true")):
		return ".ttf"
	}
	return ""
}

func fontDisplayName(fileName string) string {
	name := filepath.Base(strings.ReplaceAll(fileName, "\\", "/"))
	name = strings.TrimSuffix(name, filepath.Ext(name))
	name = strings.NewReplacer("_", " ", "-", " ").Replace(name)
	name = strings.Join(strings.Fields(name), " ")
	if !utf8.ValidString(name) || name == "" {
		return "Свой шрифт"
	}
	if r := []rune(name); len(r) > maxFontNameRune {
		name = string(r[:maxFontNameRune])
	}
	return name
}

// SaveCustomFont сохраняет шрифт (base64 / data URL). Повторная загрузка того
// же файла возвращает уже сохранённую запись.
func (s *Service) SaveCustomFont(fileName, encoded string) (CustomFont, error) {
	if i := strings.Index(encoded, ","); strings.HasPrefix(encoded, "data:") && i > 0 {
		encoded = encoded[i+1:]
	}
	if base64.StdEncoding.DecodedLen(len(encoded)) > maxFontBytes+3 {
		return CustomFont{}, errors.New("файл шрифта больше 10 МБ")
	}
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return CustomFont{}, fmt.Errorf("некорректные данные шрифта: %w", err)
	}
	if len(data) == 0 || len(data) > maxFontBytes {
		return CustomFont{}, errors.New("файл шрифта больше 10 МБ")
	}
	ext := fontExt(data)
	if ext == "" {
		return CustomFont{}, errors.New("это не шрифт: поддерживаются TTF, OTF, WOFF и WOFF2")
	}

	sum := sha256.Sum256(data)
	id := hex.EncodeToString(sum[:6])

	fontsMu.Lock()
	defer fontsMu.Unlock()
	list := readFontsIndex()
	for _, f := range list {
		if f.ID == id {
			return f, nil
		}
	}
	if len(list) >= maxCustomFonts {
		return CustomFont{}, fmt.Errorf("не больше %d своих шрифтов — удалите лишние", maxCustomFonts)
	}

	if err := writeFileAtomic(filepath.Join(platform.GetFontsDir(), id+ext), data); err != nil {
		return CustomFont{}, fmt.Errorf("не удалось сохранить шрифт: %w", err)
	}
	font := CustomFont{ID: id, Name: fontDisplayName(fileName), Ext: strings.TrimPrefix(ext, "."), AddedAt: time.Now().Unix()}
	if err := writeFontsIndex(append(list, font)); err != nil {
		return CustomFont{}, err
	}
	return font, nil
}

// DeleteCustomFont удаляет шрифт; если он был выбран — возвращается Rubik.
func (s *Service) DeleteCustomFont(id string) error {
	if !platform.ValidFontID(id) {
		return errors.New("неизвестный шрифт")
	}
	fontsMu.Lock()
	defer fontsMu.Unlock()

	for _, ext := range platform.FontExts {
		path := filepath.Join(platform.GetFontsDir(), id+ext)
		if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}
	if err := writeFontsIndex(readFontsIndex()); err != nil {
		return err
	}

	current := s.repo.Get().Appearance
	if current.Font == CustomFontPrefix+id {
		current.Font = "rubik"
		return s.repo.UpdateAppearance(current)
	}
	return nil
}
