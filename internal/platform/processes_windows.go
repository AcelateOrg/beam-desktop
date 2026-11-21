//go:build windows

package platform

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"
	"sort"
	"strings"
	"sync"
	"unsafe"

	"beam-bridge/core/types"

	ps "github.com/mitchellh/go-ps"
	"golang.org/x/sys/windows"
)

var (
	shell32 = windows.NewLazySystemDLL("shell32.dll")
	user32  = windows.NewLazySystemDLL("user32.dll")
	gdi32   = windows.NewLazySystemDLL("gdi32.dll")

	procSHGetFileInfoW     = shell32.NewProc("SHGetFileInfoW")
	procGetDC              = user32.NewProc("GetDC")
	procReleaseDC          = user32.NewProc("ReleaseDC")
	procDestroyIcon        = user32.NewProc("DestroyIcon")
	procGetSystemMetrics   = user32.NewProc("GetSystemMetrics")
	procDrawIconEx         = user32.NewProc("DrawIconEx")
	procCreateCompatibleDC = gdi32.NewProc("CreateCompatibleDC")
	procDeleteDC           = gdi32.NewProc("DeleteDC")
	procCreateDIBSection   = gdi32.NewProc("CreateDIBSection")
	procSelectObject       = gdi32.NewProc("SelectObject")
	procDeleteObject       = gdi32.NewProc("DeleteObject")
	processIconCache       sync.Map
)

const (
	shgfiIcon      = 0x000000100
	shgfiSmallIcon = 0x000000001
	dibRGBColors   = 0
	biRGB          = 0
	diNormal       = 0x0003
	smCxSmIcon     = 49
	smCySmIcon     = 50
	smCxIcon       = 11
	smCyIcon       = 12
)

type shFileInfo struct {
	Icon        windows.Handle
	IconIndex   int32
	Attributes  uint32
	DisplayName [windows.MAX_PATH]uint16
	TypeName    [80]uint16
}

type bitmapInfoHeader struct {
	Size          uint32
	Width         int32
	Height        int32
	Planes        uint16
	BitCount      uint16
	Compression   uint32
	SizeImage     uint32
	XPelsPerMeter int32
	YPelsPerMeter int32
	ClrUsed       uint32
	ClrImportant  uint32
}

type rgbQuad struct {
	Blue     byte
	Green    byte
	Red      byte
	Reserved byte
}

type bitmapInfo struct {
	Header bitmapInfoHeader
	Colors [1]rgbQuad
}

func ListRunningApplications() ([]types.RunningApplication, error) {
	processes, err := ps.Processes()
	if err != nil {
		return nil, err
	}

	seen := make(map[string]types.RunningApplication)
	for _, process := range processes {
		name := strings.TrimSpace(process.Executable())
		if name == "" {
			continue
		}

		key := strings.ToLower(name)
		if _, exists := seen[key]; exists {
			continue
		}

		path := queryProcessImagePath(process.Pid())
		seen[key] = types.RunningApplication{
			Name: name,
			Path: path,
			Icon: loadProcessIcon(path),
		}
	}

	result := make([]types.RunningApplication, 0, len(seen))
	for _, app := range seen {
		result = append(result, app)
	}

	sort.Slice(result, func(i, j int) bool {
		return strings.ToLower(result[i].Name) < strings.ToLower(result[j].Name)
	})

	return result, nil
}

func queryProcessImagePath(pid int) string {
	if pid <= 0 {
		return ""
	}

	handle, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, uint32(pid))
	if err != nil {
		return ""
	}
	defer windows.CloseHandle(handle)

	buffer := make([]uint16, 32768)
	size := uint32(len(buffer))
	if err := windows.QueryFullProcessImageName(handle, 0, &buffer[0], &size); err != nil {
		return ""
	}

	return windows.UTF16ToString(buffer[:size])
}

func loadProcessIcon(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}

	cacheKey := strings.ToLower(path)
	if cached, ok := processIconCache.Load(cacheKey); ok {
		return cached.(string)
	}

	icon, err := extractFileIcon(path, false)
	if err != nil {
		return ""
	}

	processIconCache.Store(cacheKey, icon)
	return icon
}

// AppIcon возвращает крупную (32px с учётом DPI) иконку исполняемого файла
// как data:URL, "" если её нет. Кэшируется на время жизни процесса.
func AppIcon(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}
	cacheKey := "large:" + strings.ToLower(path)
	if cached, ok := processIconCache.Load(cacheKey); ok {
		return cached.(string)
	}
	icon, err := extractFileIcon(path, true)
	if err != nil {
		icon = ""
	}
	// Неудача тоже кэшируется: файл без иконки не дёргаем на каждый запрос.
	processIconCache.Store(cacheKey, icon)
	return icon
}

func extractFileIcon(path string, large bool) (string, error) {
	pathPtr, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return "", err
	}

	flags := uintptr(shgfiIcon | shgfiSmallIcon)
	metricW, metricH := uintptr(smCxSmIcon), uintptr(smCySmIcon)
	if large {
		flags = shgfiIcon
		metricW, metricH = smCxIcon, smCyIcon
	}

	var info shFileInfo
	res, _, callErr := procSHGetFileInfoW.Call(
		uintptr(unsafe.Pointer(pathPtr)),
		0,
		uintptr(unsafe.Pointer(&info)),
		unsafe.Sizeof(info),
		flags,
	)
	if res == 0 || info.Icon == 0 {
		if callErr == nil || callErr == windows.ERROR_SUCCESS {
			callErr = windows.ERROR_FILE_NOT_FOUND
		}
		return "", callErr
	}
	defer procDestroyIcon.Call(uintptr(info.Icon))

	pngData, err := renderIconToPNG(info.Icon, metricW, metricH)
	if err != nil {
		return "", err
	}

	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngData), nil
}

func renderIconToPNG(icon windows.Handle, metricW, metricH uintptr) ([]byte, error) {
	width, _, _ := procGetSystemMetrics.Call(metricW)
	height, _, _ := procGetSystemMetrics.Call(metricH)
	if width == 0 {
		width = 16
	}
	if height == 0 {
		height = 16
	}

	screenDC, _, err := procGetDC.Call(0)
	if screenDC == 0 {
		return nil, err
	}
	defer procReleaseDC.Call(0, screenDC)

	memDC, _, err := procCreateCompatibleDC.Call(screenDC)
	if memDC == 0 {
		return nil, err
	}
	defer procDeleteDC.Call(memDC)

	var bits unsafe.Pointer
	info := bitmapInfo{
		Header: bitmapInfoHeader{
			Size:        uint32(unsafe.Sizeof(bitmapInfoHeader{})),
			Width:       int32(width),
			Height:      -int32(height),
			Planes:      1,
			BitCount:    32,
			Compression: biRGB,
		},
	}

	bitmap, _, err := procCreateDIBSection.Call(
		screenDC,
		uintptr(unsafe.Pointer(&info)),
		dibRGBColors,
		uintptr(unsafe.Pointer(&bits)),
		0,
		0,
	)
	if bitmap == 0 {
		return nil, err
	}
	defer procDeleteObject.Call(bitmap)

	oldBitmap, _, _ := procSelectObject.Call(memDC, bitmap)
	defer procSelectObject.Call(memDC, oldBitmap)

	pixelCount := int(width * height * 4)
	if bits != nil {
		clear(unsafe.Slice((*byte)(bits), pixelCount))
	}

	res, _, err := procDrawIconEx.Call(
		memDC,
		0,
		0,
		uintptr(icon),
		width,
		height,
		0,
		0,
		diNormal,
	)
	if res == 0 || bits == nil {
		return nil, err
	}

	src := unsafe.Slice((*byte)(bits), pixelCount)
	img := image.NewNRGBA(image.Rect(0, 0, int(width), int(height)))
	for i := 0; i < len(src); i += 4 {
		img.Pix[i] = src[i+2]
		img.Pix[i+1] = src[i+1]
		img.Pix[i+2] = src[i]
		img.Pix[i+3] = src[i+3]
	}

	var buffer bytes.Buffer
	if err := png.Encode(&buffer, img); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}
