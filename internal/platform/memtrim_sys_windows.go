//go:build windows

package platform

import (
	"golang.org/x/sys/windows"
)

// EmptyWorkingSet живёт в psapi.dll (на современных Windows форвардится в
// kernel32). Дёргаем через LazyDLL, чтобы не тащить cgo.
var procEmptyWorkingSet = windows.NewLazySystemDLL("psapi.dll").NewProc("EmptyWorkingSet")

func openProcessForTrim(pid int) (windows.Handle, error) {
	// PROCESS_SET_QUOTA обязателен для EmptyWorkingSet, QUERY_LIMITED
	// пригодится для диагностики и не требует лишних прав.
	return windows.OpenProcess(
		windows.PROCESS_SET_QUOTA|windows.PROCESS_QUERY_LIMITED_INFORMATION,
		false, uint32(pid),
	)
}

func closeHandle(handle windows.Handle) {
	_ = windows.CloseHandle(handle)
}

func emptyWorkingSet(handle windows.Handle) {
	// Ошибки игнорируем осознанно: трим — best effort, чужой антивирус или
	// уже умерший процесс не должны влиять на приложение.
	_, _, _ = procEmptyWorkingSet.Call(uintptr(handle))
}
