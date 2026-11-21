package handlers

import (
	domainSettings "beam-bridge/core/domain/settings"
	"beam-bridge/core/types"
)

// SetGeoAttributes подключает источник @-атрибутов geosite.dat. Функция пакета,
// а не метод: все экспортируемые методы хендлера Wails публикует во фронт.
func SetGeoAttributes(h *SettingsHandler, fn func(code string) ([]string, error)) {
	h.geoAttrs = fn
}

// GetGeoSiteAttributes — атрибуты категории geosite ("ads", "cn", ...) для
// записей вида category@attr.
func (h *SettingsHandler) GetGeoSiteAttributes(code string) types.APIResponse[[]string] {
	if h.geoAttrs == nil {
		return types.APIResponse[[]string]{Success: true, Data: []string{}}
	}
	attrs, err := h.geoAttrs(code)
	if err != nil {
		return types.APIResponse[[]string]{Success: false, Error: err.Error()}
	}
	if attrs == nil {
		attrs = []string{}
	}
	return types.APIResponse[[]string]{Success: true, Data: attrs}
}

func (h *SettingsHandler) GetCoreSettings() types.APIResponse[domainSettings.CoreSettings] {
	return types.APIResponse[domainSettings.CoreSettings]{Success: true, Data: h.service.GetCore()}
}

func (h *SettingsHandler) SaveCoreSettings(data domainSettings.CoreSettings) types.APIResponse[bool] {
	if err := h.service.UpdateCore(data); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetDNSSettings() types.APIResponse[domainSettings.DNSSettings] {
	return types.APIResponse[domainSettings.DNSSettings]{Success: true, Data: h.service.GetDNS()}
}

func (h *SettingsHandler) SaveDNSSettings(data domainSettings.DNSSettings) types.APIResponse[bool] {
	if err := h.service.UpdateDNS(data); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}
