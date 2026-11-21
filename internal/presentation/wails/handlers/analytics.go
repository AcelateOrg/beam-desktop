package handlers

import (
	"beam-app/internal/platform"
	"beam-bridge/core/analytics"
	"beam-bridge/core/types"
)

// GetAnalytics отдаёт локальную статистику за период: today | week | month | all.
func (h *SettingsHandler) GetAnalytics(period string) types.APIResponse[analytics.Report] {
	if h.logging == nil {
		return types.APIResponse[analytics.Report]{Success: true, Data: analytics.Report{Period: period}}
	}
	return types.APIResponse[analytics.Report]{Success: true, Data: h.logging.GetAnalytics(period)}
}

// maxIconRequest ограничивает один запрос иконок: отчёт отдаёт не больше 50 приложений.
const maxIconRequest = 64

// GetAppIcons отдаёт иконки приложений по путям исполняемых файлов (data:URL).
// Пути без иконки в ответ не попадают.
func (h *SettingsHandler) GetAppIcons(paths []string) types.APIResponse[map[string]string] {
	icons := make(map[string]string, len(paths))
	for i, path := range paths {
		if i >= maxIconRequest {
			break
		}
		if _, done := icons[path]; done || path == "" {
			continue
		}
		if icon := platform.AppIcon(path); icon != "" {
			icons[path] = icon
		}
	}
	return types.APIResponse[map[string]string]{Success: true, Data: icons}
}

// ResetAnalytics удаляет всю накопленную статистику.
func (h *SettingsHandler) ResetAnalytics() types.APIResponse[bool] {
	if h.logging != nil {
		if err := h.logging.ResetAnalytics(); err != nil {
			return types.APIResponse[bool]{Success: false, Error: err.Error()}
		}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}
