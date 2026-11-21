//go:build windows

package tray

import "golang.org/x/sys/windows"

func enableDarkContextMenus() {
	defer func() { recover() }()

	ver := windows.RtlGetVersion()
	if ver == nil || ver.MajorVersion < 10 || ver.BuildNumber < 17763 {
		return
	}

	uxtheme, err := windows.LoadDLL("uxtheme.dll")
	if err != nil {
		return
	}
	defer uxtheme.Release()

	if setPreferredAppMode, err := uxtheme.FindProcByOrdinal(135); err == nil {
		_, _, _ = setPreferredAppMode.Call(1)
	}
	if flushMenuThemes, err := uxtheme.FindProcByOrdinal(136); err == nil {
		_, _, _ = flushMenuThemes.Call()
	}
}
