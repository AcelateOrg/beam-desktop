//go:build !windows && !darwin && !linux

package platform

import (
	"sort"
	"strings"

	"beam-bridge/core/types"

	ps "github.com/mitchellh/go-ps"
)

// AppIcon: на этих системах иконок приложений нет — UI показывает букву.
func AppIcon(string) string { return "" }

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
		if _, exists := seen[key]; !exists {
			seen[key] = types.RunningApplication{Name: name}
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
