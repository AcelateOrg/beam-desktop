//go:build windows

package platform

import (
	"strings"
	"syscall"
	"unsafe"
)

func GetSystemLocale() string {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	getUserDefaultLocaleName := kernel32.NewProc("GetUserDefaultLocaleName")

	const localeNameMaxLength = 85
	buf := make([]uint16, localeNameMaxLength)
	ret, _, _ := getUserDefaultLocaleName.Call(uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	if ret == 0 {
		return "en"
	}

	name := syscall.UTF16ToString(buf)
	lang := strings.ToLower(strings.TrimSpace(strings.SplitN(name, "-", 2)[0]))
	if lang == "" {
		return "en"
	}
	return lang
}
