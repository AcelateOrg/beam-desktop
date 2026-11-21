//go:build windows

package platform

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

const spiGetDeskWallpaper = 0x0073

var procSystemParametersInfoW = windows.NewLazySystemDLL("user32.dll").NewProc("SystemParametersInfoW")

// wallpaperCandidates: путь из SPI_GETDESKWALLPAPER, затем TranscodedWallpaper —
// копия текущих обоев, которую Windows держит и для слайд-шоу, и когда
// исходный файл удалён.
func wallpaperCandidates() []string {
	var out []string

	buf := make([]uint16, 1024)
	if r, _, _ := procSystemParametersInfoW.Call(
		spiGetDeskWallpaper,
		uintptr(len(buf)),
		uintptr(unsafe.Pointer(&buf[0])),
		0,
	); r != 0 {
		if path := windows.UTF16ToString(buf); path != "" {
			out = append(out, path)
		}
	}

	if appData := os.Getenv("APPDATA"); appData != "" {
		out = append(out, filepath.Join(appData, "Microsoft", "Windows", "Themes", "TranscodedWallpaper"))
	}
	return out
}

func hideWallpaperCommandWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
