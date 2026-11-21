//go:build darwin

package platform

import (
	"strings"
	"syscall"
)

func GetOSVersion() string {
	v, err := syscall.Sysctl("kern.osproductversion")
	if err != nil || v == "" {
		return ""
	}
	return strings.SplitN(v, ".", 2)[0]
}
