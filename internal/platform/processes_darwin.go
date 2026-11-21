//go:build darwin

package platform

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"syscall"
	"unsafe"

	"beam-bridge/core/types"

	ps "github.com/mitchellh/go-ps"
)

var bundleIconCache sync.Map

var bundleInfoCache sync.Map

var nonBundlePathPrefixes = []string{
	"/Applications/",
	"/usr/local/",
	"/opt/homebrew/",
	"/opt/local/",
}

func ListRunningApplications() ([]types.RunningApplication, error) {
	processes, err := ps.Processes()
	if err != nil {
		return nil, err
	}

	seen := make(map[string]types.RunningApplication)
	for _, process := range processes {
		path := execPathForPID(process.Pid())
		if path == "" {
			continue
		}

		if bundlePath, ok := ResolveAppBundle(path); ok {
			if _, exists := seen[bundlePath]; exists {
				continue
			}
			seen[bundlePath] = types.RunningApplication{
				Name: bundleDisplayName(bundlePath),
				Path: bundlePath,
				Icon: bundleIcon(bundlePath),
			}
			continue
		}

		if !isRelevantNonBundlePath(path) {
			continue
		}
		if _, exists := seen[path]; exists {
			continue
		}
		seen[path] = types.RunningApplication{
			Name: filepath.Base(path),
			Path: path,
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

func execPathForPID(pid int) string {
	if pid <= 0 {
		return ""
	}

	const (
		procPidPathInfo     = 0xb
		procPidPathInfoSize = 1024
		procCallNumPidInfo  = 0x2
	)

	buf := make([]byte, procPidPathInfoSize)
	_, _, errno := syscall.Syscall6(
		syscall.SYS_PROC_INFO,
		procCallNumPidInfo,
		uintptr(pid),
		procPidPathInfo,
		0,
		uintptr(unsafe.Pointer(&buf[0])),
		procPidPathInfoSize,
	)
	if errno != 0 {
		return ""
	}

	if n := bytes.IndexByte(buf, 0); n >= 0 {
		buf = buf[:n]
	}
	return string(buf)
}

// AppIcon возвращает иконку .app-бандла исполняемого файла как data:URL, "" если её нет.
func AppIcon(execPath string) string {
	bundle, ok := ResolveAppBundle(strings.TrimSpace(execPath))
	if !ok {
		return ""
	}
	return bundleIcon(bundle)
}

func ResolveAppBundle(execPath string) (string, bool) {
	var topmost string
	dir := filepath.Dir(execPath)
	for dir != "/" && dir != "." && dir != "" {
		if strings.HasSuffix(dir, ".app") {
			topmost = dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	if topmost == "" {
		return "", false
	}
	return topmost, true
}

func isRelevantNonBundlePath(path string) bool {
	if home, err := os.UserHomeDir(); err == nil && home != "" && strings.HasPrefix(path, home+"/") {
		return true
	}
	for _, prefix := range nonBundlePathPrefixes {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}
	return false
}

func bundleInfo(bundlePath string) map[string]interface{} {
	if cached, ok := bundleInfoCache.Load(bundlePath); ok {
		info, _ := cached.(map[string]interface{})
		return info
	}
	info := readBundleInfoPlist(bundlePath)
	bundleInfoCache.Store(bundlePath, info)
	return info
}

func bundleDisplayName(bundlePath string) string {
	info := bundleInfo(bundlePath)
	if name, ok := info["CFBundleDisplayName"].(string); ok && strings.TrimSpace(name) != "" {
		return name
	}
	if name, ok := info["CFBundleName"].(string); ok && strings.TrimSpace(name) != "" {
		return name
	}
	return strings.TrimSuffix(filepath.Base(bundlePath), ".app")
}

func readBundleInfoPlist(bundlePath string) map[string]interface{} {
	plistPath := filepath.Join(bundlePath, "Contents", "Info.plist")
	out, err := exec.Command("/usr/bin/plutil", "-convert", "json", "-o", "-", plistPath).Output()
	if err != nil {
		return nil
	}
	var info map[string]interface{}
	if err := json.Unmarshal(out, &info); err != nil {
		return nil
	}
	return info
}

func bundleIcon(bundlePath string) string {
	if cached, ok := bundleIconCache.Load(bundlePath); ok {
		return cached.(string)
	}
	icon := extractBundleIcon(bundlePath)
	bundleIconCache.Store(bundlePath, icon)
	return icon
}

func extractBundleIcon(bundlePath string) string {
	info := bundleInfo(bundlePath)
	iconFile, _ := info["CFBundleIconFile"].(string)
	iconFile = strings.TrimSpace(iconFile)
	if iconFile == "" {
		iconFile = "AppIcon"
	}
	if !strings.HasSuffix(strings.ToLower(iconFile), ".icns") {
		iconFile += ".icns"
	}

	iconPath := filepath.Join(bundlePath, "Contents", "Resources", iconFile)
	if _, err := os.Stat(iconPath); err != nil {
		return ""
	}

	tmp, err := os.CreateTemp("", "beam-icon-*.png")
	if err != nil {
		return ""
	}
	tmpPath := tmp.Name()
	tmp.Close()
	defer os.Remove(tmpPath)

	if err := exec.Command("/usr/bin/sips", "-s", "format", "png", "-Z", "64", iconPath, "--out", tmpPath).Run(); err != nil {
		return ""
	}

	data, err := os.ReadFile(tmpPath)
	if err != nil || len(data) == 0 {
		return ""
	}

	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(data)
}
