//go:build linux

package platform

import (
	"bufio"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"syscall"

	"beam-bridge/core/types"
)

func ListRunningApplications() ([]types.RunningApplication, error) {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return nil, err
	}

	desktop := desktopExecutableNames()
	uid := os.Getuid()

	apps := make(map[string]types.RunningApplication)
	all := make(map[string]types.RunningApplication)

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		if _, err := strconv.Atoi(entry.Name()); err != nil {
			continue
		}

		procDir := filepath.Join("/proc", entry.Name())
		if !ownedByCurrentUser(procDir, uid) {
			continue
		}

		name := procExecutableName(procDir)
		if name == "" {
			continue
		}

		key := strings.ToLower(name)
		if _, exists := all[key]; !exists {
			all[key] = types.RunningApplication{Name: name}
		}
		if _, ok := desktop[key]; !ok {
			continue
		}
		if _, exists := apps[key]; !exists {
			apps[key] = types.RunningApplication{Name: name}
		}
	}

	source := apps
	if len(source) == 0 {
		source = all
	}

	result := make([]types.RunningApplication, 0, len(source))
	for _, app := range source {
		result = append(result, app)
	}

	sort.Slice(result, func(i, j int) bool {
		return strings.ToLower(result[i].Name) < strings.ToLower(result[j].Name)
	})

	return result, nil
}

func ownedByCurrentUser(procDir string, uid int) bool {
	if uid == 0 {
		return true
	}
	info, err := os.Stat(procDir)
	if err != nil {
		return false
	}
	st, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return true
	}
	return int(st.Uid) == uid
}

func desktopExecutableNames() map[string]struct{} {
	names := make(map[string]struct{})
	for _, dir := range desktopSearchDirs() {
		_ = filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return nil
			}
			if d.IsDir() || !strings.HasSuffix(d.Name(), ".desktop") {
				return nil
			}
			for _, name := range desktopEntryExecutables(path) {
				names[strings.ToLower(name)] = struct{}{}
			}
			return nil
		})
	}
	return names
}

func desktopSearchDirs() []string {
	var dirs []string

	dataHome := strings.TrimSpace(os.Getenv("XDG_DATA_HOME"))
	if !filepath.IsAbs(dataHome) {
		dataHome = ""
		if home, err := os.UserHomeDir(); err == nil {
			dataHome = filepath.Join(home, ".local", "share")
		}
	}
	if dataHome != "" {
		dirs = append(dirs,
			filepath.Join(dataHome, "applications"),
			filepath.Join(dataHome, "flatpak", "exports", "share", "applications"),
		)
	}

	raw := strings.TrimSpace(os.Getenv("XDG_DATA_DIRS"))
	if raw == "" {
		raw = "/usr/local/share:/usr/share"
	}
	for _, dir := range strings.Split(raw, ":") {
		if dir = strings.TrimSpace(dir); dir != "" {
			dirs = append(dirs, filepath.Join(dir, "applications"))
		}
	}

	dirs = append(dirs,
		"/var/lib/flatpak/exports/share/applications",
		"/var/lib/snapd/desktop/applications",
	)
	return dirs
}

func desktopEntryExecutables(path string) []string {
	file, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer file.Close()

	var (
		inEntry  bool
		hidden   bool
		execName string
		tryExec  string
	)
	isApp := true

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if strings.HasPrefix(line, "[") {
			inEntry = line == "[Desktop Entry]"
			continue
		}
		if !inEntry {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)

		switch key {
		case "Type":
			isApp = value == "Application"
		case "NoDisplay", "Hidden":
			if strings.EqualFold(value, "true") {
				hidden = true
			}
		case "Exec":
			execName = baseExecutableName(desktopExecBinary(value))
		case "TryExec":
			tryExec = baseExecutableName(value)
		}
	}
	if scanner.Err() != nil {
		return nil
	}
	if !isApp || hidden {
		return nil
	}

	var names []string
	if execName != "" {
		names = append(names, execName)
	}
	if tryExec != "" && tryExec != execName {
		names = append(names, tryExec)
	}
	return names
}

func desktopExecBinary(exec string) string {
	for _, field := range strings.Fields(exec) {
		field = strings.Trim(field, "\"'")
		if field == "" || strings.HasPrefix(field, "%") || strings.HasPrefix(field, "-") {
			continue
		}
		if strings.Contains(field, "=") {
			continue
		}
		switch filepath.Base(field) {
		case "env", "sh", "bash", "nohup":
			continue
		}
		return field
	}
	return ""
}

func procExecutableName(procDir string) string {
	if target, err := os.Readlink(filepath.Join(procDir, "exe")); err == nil {
		if name := baseExecutableName(target); name != "" {
			return name
		}
	}

	raw, err := os.ReadFile(filepath.Join(procDir, "cmdline"))
	if err != nil {
		return ""
	}
	argv0 := string(raw)
	if idx := strings.IndexByte(argv0, 0); idx >= 0 {
		argv0 = argv0[:idx]
	}
	return baseExecutableName(argv0)
}

func baseExecutableName(path string) string {
	path = strings.TrimSpace(path)
	path = strings.TrimSuffix(path, " (deleted)")
	if path == "" {
		return ""
	}

	name := filepath.Base(path)
	if name == "." || name == "/" {
		return ""
	}
	return name
}
