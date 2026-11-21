//go:build darwin || linux

package platform

import (
	"os"
	"strings"
)

func GetSystemLocale() string {
	for _, key := range []string{"LC_ALL", "LC_MESSAGES", "LANG"} {
		if lang := parseLocaleLang(os.Getenv(key)); lang != "" {
			return lang
		}
	}
	return "en"
}

func parseLocaleLang(v string) string {
	v = strings.SplitN(v, ".", 2)[0]
	v = strings.SplitN(v, "_", 2)[0]
	v = strings.SplitN(v, "-", 2)[0]
	v = strings.ToLower(strings.TrimSpace(v))
	if v == "" || v == "c" || v == "posix" {
		return ""
	}
	return v
}
