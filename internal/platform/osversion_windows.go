//go:build windows

package platform

import (
	"strconv"

	"golang.org/x/sys/windows"
)

func GetOSVersion() string {
	ver := windows.RtlGetVersion()
	if ver == nil {
		return ""
	}
	switch {
	case ver.MajorVersion == 10 && ver.BuildNumber >= 22000:
		return "11"
	case ver.MajorVersion == 10:
		return "10"
	case ver.MajorVersion == 6 && ver.MinorVersion == 3:
		return "8.1"
	case ver.MajorVersion == 6 && ver.MinorVersion == 2:
		return "8"
	case ver.MajorVersion == 6 && ver.MinorVersion == 1:
		return "7"
	default:
		return strconv.Itoa(int(ver.MajorVersion))
	}
}
