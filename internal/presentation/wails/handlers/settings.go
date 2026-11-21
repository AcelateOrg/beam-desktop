package handlers

import (
	"net/netip"
	"runtime/debug"
	"strings"

	"beam-app/internal/application/settings"
	"beam-app/internal/presentation/wails/dto"
	domainSettings "beam-bridge/core/domain/settings"
	"beam-bridge/core/types"
	coreVPN "beam-bridge/core/vpn"
)

type SettingsHandler struct {
	service       *settings.Service
	logging       *coreVPN.Manager
	resetProfiles func() error
	// proTunPreset — провайдерский пресет маршрутизации активного профиля:
	// (граф, locked). nil-граф = пресета нет.
	proTunPreset func() (*types.ProTunGraph, bool)
	// geoCodes — коды стран/категорий из geoip.dat / geosite.dat.
	geoCodes func(kind string) ([]string, error)
	// geoAttrs — @-атрибуты категории geosite.dat (см. SetGeoAttributes).
	geoAttrs func(code string) ([]string, error)
	// protun — источники для слоёв ProTun по профилям (см. SetProTunProfiles).
	protun proTunSources
}

func NewSettingsHandler(service *settings.Service, logging *coreVPN.Manager, resetProfiles func() error, proTunPreset func() (*types.ProTunGraph, bool), geoCodes func(kind string) ([]string, error)) *SettingsHandler {
	return &SettingsHandler{service: service, logging: logging, resetProfiles: resetProfiles, proTunPreset: proTunPreset, geoCodes: geoCodes}
}

// GetGeoCodes отдаёт коды для карточек «Страны» (geoip) и «Категории» (geosite).
// При первом вызове скачивает базу.
func (h *SettingsHandler) GetGeoCodes(kind string) types.APIResponse[[]string] {
	codes, err := h.geoCodes(kind)
	if err != nil {
		return types.APIResponse[[]string]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[[]string]{Success: true, Data: codes}
}

func (h *SettingsHandler) GetConnectionSettings() types.APIResponse[dto.ConnectionSettingsData] {
	s := h.service.GetConnection()
	return types.APIResponse[dto.ConnectionSettingsData]{
		Success: true,
		Data: dto.ConnectionSettingsData{
			Mode:         s.Mode,
			ProxyType:    s.ProxyType,
			ProxyHost:    s.ProxyHost,
			ProxyPort:    s.ProxyPort,
			TunName:      s.TunName,
			PrimaryDNS:   s.PrimaryDNS,
			SecondaryDNS: s.SecondaryDNS,
			ProxyDNS:     s.ProxyDNS,
			DNSOverVPN:   s.DNSOverVPN,
			MTU:          s.MTU,
			Stack:        s.Stack,
		},
	}
}

func (h *SettingsHandler) SaveConnectionSettings(data dto.ConnectionSettingsData) types.APIResponse[bool] {
	conn := domainSettings.ConnectionSettings{
		Mode:         data.Mode,
		ProxyType:    data.ProxyType,
		ProxyHost:    data.ProxyHost,
		ProxyPort:    data.ProxyPort,
		TunName:      data.TunName,
		PrimaryDNS:   data.PrimaryDNS,
		SecondaryDNS: data.SecondaryDNS,
		ProxyDNS:     data.ProxyDNS,
		DNSOverVPN:   data.DNSOverVPN,
		MTU:          data.MTU,
		Stack:        data.Stack,
		// Kill Switch сохраняется отдельно (SetKillSwitch) и применяется сразу.
		KillSwitch: h.service.GetConnection().KillSwitch,
	}
	if err := h.service.UpdateConnection(conn); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

// SetKillSwitch сохраняет Kill Switch и сразу применяет к текущему подключению,
// без переподключения.
func (h *SettingsHandler) SetKillSwitch(enabled bool) types.APIResponse[bool] {
	conn := h.service.GetConnection()
	conn.KillSwitch = enabled
	if err := h.service.UpdateConnection(conn); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	if err := h.logging.ApplyKillSwitch(enabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetApplicationSettings() types.APIResponse[dto.ApplicationSettingsData] {
	s := h.service.GetApplication()
	return types.APIResponse[dto.ApplicationSettingsData]{
		Success: true,
		Data: dto.ApplicationSettingsData{
			LaunchOnStartup:                s.LaunchOnStartup,
			MinimizeToTray:                 s.MinimizeToTray,
			AutoConnect:                    s.AutoConnect,
			DisableSubscriptionAutoRefresh: s.DisableSubscriptionAutoRefresh,
		},
	}
}

func (h *SettingsHandler) SaveApplicationSettings(data dto.ApplicationSettingsData) types.APIResponse[bool] {
	app := domainSettings.ApplicationSettings{
		LaunchOnStartup:                data.LaunchOnStartup,
		MinimizeToTray:                 data.MinimizeToTray,
		AutoConnect:                    data.AutoConnect,
		DisableSubscriptionAutoRefresh: data.DisableSubscriptionAutoRefresh,
	}
	if err := h.service.UpdateApplication(app); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetSplitTunnel() types.APIResponse[types.SplitTunnelSettings] {
	return types.APIResponse[types.SplitTunnelSettings]{
		Success: true,
		Data:    h.service.GetSplitTunnel(),
	}
}

func (h *SettingsHandler) SetSplitTunnelEnabled(enabled bool) types.APIResponse[bool] {
	if err := h.service.SetSplitTunnelEnabled(enabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) SaveSplitTunnelSettings(data types.SplitTunnelSettings) types.APIResponse[bool] {
	if err := h.service.UpdateSplitTunnel(data); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetRoutingMode() types.APIResponse[string] {
	return types.APIResponse[string]{
		Success: true,
		Data:    h.service.GetRoutingMode(),
	}
}

func (h *SettingsHandler) SetRoutingMode(mode string) types.APIResponse[bool] {
	if err := h.service.SetRoutingMode(mode); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetProTunGraph() types.APIResponse[types.ProTunGraph] {
	return types.APIResponse[types.ProTunGraph]{
		Success: true,
		Data:    h.effectiveProTunGraph(),
	}
}

// effectiveProTunGraph — общий слой ProTun. Провайдерский пресет живёт
// в слое профиля (см. GetProTunLayer) и общий слой не залочивает.
func (h *SettingsHandler) effectiveProTunGraph() types.ProTunGraph {
	return h.service.GetProTunGraph()
}

// GetProTunState отдаёт граф вместе с признаком провайдерского лока — UI
// по нему переходит в read-only и показывает поясняющий баннер.
func (h *SettingsHandler) GetProTunState() types.APIResponse[dto.ProTunStateData] {
	locked := false
	return types.APIResponse[dto.ProTunStateData]{
		Success: true,
		Data: dto.ProTunStateData{
			Graph:  h.effectiveProTunGraph(),
			Locked: locked,
		},
	}
}

// GetSplitTunnelConflicts — пересечения пользовательского сплит-туннеля с
// провайдерским пресетом маршрутизации. Конфликт — это когда пользователь
// выводит в VPN то, что провайдер просил пустить напрямую/в блок (например,
// RU-ресурсы: так палятся IP нод перед ТСПУ). Добавление трафика В VPN
// конфликтом не считается.
func (h *SettingsHandler) GetSplitTunnelConflicts() types.APIResponse[[]dto.SplitTunnelConflictData] {
	conflicts := []dto.SplitTunnelConflictData{}
	if h.proTunPreset == nil {
		return types.APIResponse[[]dto.SplitTunnelConflictData]{Success: true, Data: conflicts}
	}
	preset, _ := h.proTunPreset()
	if preset == nil {
		return types.APIResponse[[]dto.SplitTunnelConflictData]{Success: true, Data: conflicts}
	}

	// Собираем, какие элементы пресет ведёт в direct/block.
	nodesByID := make(map[string]types.ProTunNode, len(preset.Nodes))
	for _, node := range preset.Nodes {
		nodesByID[node.ID] = node
	}
	protected := map[string]string{} // item (lower) → куда ведёт пресет
	var protectedPrefixes []netip.Prefix
	for _, edge := range preset.Edges {
		dest, ok := nodesByID[edge.Target]
		if !ok || (dest.Kind != types.ProTunKindDirect && dest.Kind != types.ProTunKindBlock) {
			continue
		}
		source, ok := nodesByID[edge.Source]
		if !ok {
			continue
		}
		// Со списками сплит-туннеля пересекаются только приложения, домены и IP
		// (другие и удалённые виды карточек пропускаются).
		if source.Kind != types.ProTunKindApps && source.Kind != types.ProTunKindDomains && source.Kind != types.ProTunKindIPRanges {
			continue
		}
		target := "direct"
		if dest.Kind == types.ProTunKindBlock {
			target = "block"
		}
		for _, item := range source.Items {
			item = strings.ToLower(strings.TrimSpace(item))
			if item == "" {
				continue
			}
			if source.Kind == types.ProTunKindIPRanges {
				if p, err := netip.ParsePrefix(item); err == nil {
					protectedPrefixes = append(protectedPrefixes, p)
				}
				protected[item] = target
			} else {
				protected[item] = target
			}
		}
	}

	// Сплит-туннель в режиме exclude отправляет перечисленное напрямую —
	// это НЕ ослабляет пресет, конфликтом не считается. Конфликтует только
	// include («в VPN»).
	st := h.service.GetSplitTunnel()
	if st.Mode != "include" {
		return types.APIResponse[[]dto.SplitTunnelConflictData]{Success: true, Data: conflicts}
	}

	report := func(value string) {
		v := strings.ToLower(strings.TrimSpace(value))
		if v == "" {
			return
		}
		if target, hit := protected[v]; hit {
			conflicts = append(conflicts, dto.SplitTunnelConflictData{Value: value, Target: target})
			return
		}
		// Домены: суффиксное пересечение в обе стороны (user "steam.com"
		// против пресета ".ru" и наоборот).
		for item, target := range protected {
			if strings.HasPrefix(item, ".") && strings.HasSuffix(v, item) ||
				strings.HasPrefix(v, ".") && strings.HasSuffix(item, v) {
				conflicts = append(conflicts, dto.SplitTunnelConflictData{Value: value, Target: target})
				return
			}
		}
		// Префиксы: перекрытие сетей.
		if p, err := netip.ParsePrefix(v); err == nil {
			for _, pp := range protectedPrefixes {
				if p.Overlaps(pp) {
					conflicts = append(conflicts, dto.SplitTunnelConflictData{Value: value, Target: protected[pp.String()]})
					return
				}
			}
		}
	}
	for _, app := range st.Apps {
		report(app)
	}
	for _, domain := range st.Domains {
		report(domain)
	}
	for _, ip := range st.IPs {
		report(ip)
	}

	return types.APIResponse[[]dto.SplitTunnelConflictData]{Success: true, Data: conflicts}
}

func (h *SettingsHandler) SaveProTunGraph(graph types.ProTunGraph) types.APIResponse[bool] {
	if err := h.service.SaveProTunGraph(graph); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetTheme() types.APIResponse[string] {
	return types.APIResponse[string]{
		Success: true,
		Data:    h.service.GetAppearance().Theme,
	}
}

func (h *SettingsHandler) SetTheme(theme string) types.APIResponse[bool] {
	if err := h.service.SetTheme(theme); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

// GetAccent returns the accent override for built-in themes ("" — theme's own).
func (h *SettingsHandler) GetAccent() types.APIResponse[string] {
	return types.APIResponse[string]{Success: true, Data: h.service.GetAppearance().Accent}
}

// SetAccent sets the accent override (#rrggbb) or clears it with "".
func (h *SettingsHandler) SetAccent(color string) types.APIResponse[string] {
	saved, err := h.service.SetAccent(color)
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[string]{Success: true, Data: saved}
}

// GetCustomThemes returns the user's custom themes.
func (h *SettingsHandler) GetCustomThemes() types.APIResponse[[]domainSettings.CustomTheme] {
	return types.APIResponse[[]domainSettings.CustomTheme]{Success: true, Data: h.service.GetCustomThemes()}
}

// SaveCustomTheme creates (empty id) or updates a custom theme.
func (h *SettingsHandler) SaveCustomTheme(theme domainSettings.CustomTheme) types.APIResponse[domainSettings.CustomTheme] {
	saved, err := h.service.SaveCustomTheme(theme)
	if err != nil {
		return types.APIResponse[domainSettings.CustomTheme]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[domainSettings.CustomTheme]{Success: true, Data: saved}
}

// DeleteCustomTheme removes a custom theme; an active one falls back to dark.
func (h *SettingsHandler) DeleteCustomTheme(id string) types.APIResponse[bool] {
	if err := h.service.DeleteCustomTheme(id); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetAppearanceDetails() types.APIResponse[dto.AppearanceDetailsData] {
	a := h.service.GetAppearance()
	return types.APIResponse[dto.AppearanceDetailsData]{
		Success: true,
		Data: dto.AppearanceDetailsData{
			Font:      a.Font,
			Radius:    a.Radius,
			Animation: a.Animation,
		},
	}
}

func (h *SettingsHandler) SetAppearanceDetails(font, radius, animation string) types.APIResponse[bool] {
	if err := h.service.SetAppearanceDetails(font, radius, animation); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

// ListCustomFonts returns user-uploaded fonts.
func (h *SettingsHandler) ListCustomFonts() types.APIResponse[[]dto.CustomFontData] {
	list := h.service.ListCustomFonts()
	out := make([]dto.CustomFontData, 0, len(list))
	for _, f := range list {
		out = append(out, dto.CustomFontData{ID: f.ID, Name: f.Name, Ext: f.Ext})
	}
	return types.APIResponse[[]dto.CustomFontData]{Success: true, Data: out}
}

// SaveCustomFont stores a TTF/OTF/WOFF/WOFF2 font (base64 / data URL).
func (h *SettingsHandler) SaveCustomFont(fileName, encoded string) types.APIResponse[dto.CustomFontData] {
	f, err := h.service.SaveCustomFont(fileName, encoded)
	if err != nil {
		return types.APIResponse[dto.CustomFontData]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[dto.CustomFontData]{Success: true, Data: dto.CustomFontData{ID: f.ID, Name: f.Name, Ext: f.Ext}}
}

// DeleteCustomFont removes a user font; if it was active the font falls back to Rubik.
func (h *SettingsHandler) DeleteCustomFont(id string) types.APIResponse[bool] {
	if err := h.service.DeleteCustomFont(id); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

// GetBackdrop returns the interface background settings (off / OS wallpaper / photo).
func (h *SettingsHandler) GetBackdrop() types.APIResponse[domainSettings.BackdropSettings] {
	return types.APIResponse[domainSettings.BackdropSettings]{Success: true, Data: h.service.GetBackdrop()}
}

// UpdateBackdrop changes mode, blur and dim of the interface background.
func (h *SettingsHandler) UpdateBackdrop(b domainSettings.BackdropSettings) types.APIResponse[domainSettings.BackdropSettings] {
	saved, err := h.service.UpdateBackdrop(b)
	if err != nil {
		return types.APIResponse[domainSettings.BackdropSettings]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[domainSettings.BackdropSettings]{Success: true, Data: saved}
}

// SaveBackdropPhoto stores a user photo (base64 / data URL) and makes it the background.
func (h *SettingsHandler) SaveBackdropPhoto(encoded string) types.APIResponse[domainSettings.BackdropSettings] {
	saved, err := h.service.SaveBackdropPhoto(encoded)
	if err != nil {
		return types.APIResponse[domainSettings.BackdropSettings]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[domainSettings.BackdropSettings]{Success: true, Data: saved}
}

// RemoveBackdropPhoto deletes the user photo; a photo background is turned off.
func (h *SettingsHandler) RemoveBackdropPhoto() types.APIResponse[domainSettings.BackdropSettings] {
	saved, err := h.service.RemoveBackdropPhoto()
	if err != nil {
		return types.APIResponse[domainSettings.BackdropSettings]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[domainSettings.BackdropSettings]{Success: true, Data: saved}
}

// GetWallpaperInfo reports whether the OS wallpaper was found and its version.
func (h *SettingsHandler) GetWallpaperInfo() types.APIResponse[dto.WallpaperInfo] {
	version, ok := h.service.WallpaperVersion()
	return types.APIResponse[dto.WallpaperInfo]{Success: true, Data: dto.WallpaperInfo{Available: ok, Version: version}}
}

func (h *SettingsHandler) GetOnboardingCompleted() types.APIResponse[bool] {
	return types.APIResponse[bool]{
		Success: true,
		Data:    h.service.GetOnboardingCompleted(),
	}
}

func (h *SettingsHandler) SetOnboardingCompleted(completed bool) types.APIResponse[bool] {
	if err := h.service.SetOnboardingCompleted(completed); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetHwidSettings() types.APIResponse[dto.HwidSettingsData] {
	s := h.service.GetHwid()
	return types.APIResponse[dto.HwidSettingsData]{
		Success: true,
		Data: dto.HwidSettingsData{
			Enabled: s.Enabled,
			Mode:    s.Mode,
			Value:   s.Value,
		},
	}
}

func (h *SettingsHandler) SaveHwidSettings(data dto.HwidSettingsData) types.APIResponse[bool] {
	hwid := domainSettings.HwidSettings{
		Enabled: data.Enabled,
		Mode:    data.Mode,
		Value:   data.Value,
	}
	if err := h.service.UpdateHwid(hwid); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetPingSettings() types.APIResponse[dto.PingSettingsData] {
	p := h.service.GetPing()
	return types.APIResponse[dto.PingSettingsData]{
		Success: true,
		Data: dto.PingSettingsData{
			NodeMode:       p.NodeMode,
			ConnectionMode: p.ConnectionMode,
		},
	}
}

func (h *SettingsHandler) SavePingSettings(data dto.PingSettingsData) types.APIResponse[bool] {
	ping := domainSettings.PingSettings{
		NodeMode:       data.NodeMode,
		ConnectionMode: data.ConnectionMode,
	}
	if err := h.service.UpdatePing(ping); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) ListRunningApplications() types.APIResponse[[]types.RunningApplication] {
	apps, err := h.service.ListRunningApplications()
	if err != nil {
		return types.APIResponse[[]types.RunningApplication]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[[]types.RunningApplication]{Success: true, Data: apps}
}

func (h *SettingsHandler) GetDeveloperMode() types.APIResponse[bool] {
	return types.APIResponse[bool]{Success: true, Data: h.service.GetDeveloperMode()}
}

func (h *SettingsHandler) SetDeveloperMode(enabled bool) types.APIResponse[bool] {
	if err := h.service.SetDeveloperMode(enabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetTraceLogging() types.APIResponse[bool] {
	return types.APIResponse[bool]{Success: true, Data: h.service.GetTraceLogging()}
}

func (h *SettingsHandler) GetCoreLogging() types.APIResponse[bool] {
	return types.APIResponse[bool]{Success: true, Data: h.service.GetCoreLogging()}
}

func (h *SettingsHandler) SetCoreLogging(enabled bool) types.APIResponse[bool] {
	if err := h.service.SetCoreLogging(enabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	if h.logging != nil {
		h.logging.SetCoreLogging(enabled)
		if !enabled {
			go debug.FreeOSMemory()
		}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

// GetLogLevel возвращает уровень логов вкладки «Логи»: off | error | info | debug.
func (h *SettingsHandler) GetLogLevel() types.APIResponse[string] {
	return types.APIResponse[string]{Success: true, Data: h.service.GetLogLevel()}
}

// SetLogLevel меняет уровень логов на лету: сохраняет в настройки и сразу
// применяет к работающему ядру без переподключения.
func (h *SettingsHandler) SetLogLevel(level string) types.APIResponse[bool] {
	if err := h.service.SetLogLevel(level); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	if h.logging != nil {
		h.logging.SetLogLevel(level)
		if level == "off" {
			go debug.FreeOSMemory()
		}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) SetTraceLogging(enabled bool) types.APIResponse[bool] {
	if err := h.service.SetTraceLogging(enabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	if h.logging != nil {
		h.logging.SetTraceLogging(enabled)
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetRealityDebug() types.APIResponse[bool] {
	return types.APIResponse[bool]{Success: true, Data: h.service.GetRealityDebug()}
}

func (h *SettingsHandler) SetRealityDebug(enabled bool) types.APIResponse[bool] {
	if err := h.service.SetRealityDebug(enabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	if h.logging != nil {
		h.logging.SetRealityDebug(enabled)
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) GetExtendedLogs() types.APIResponse[bool] {
	return types.APIResponse[bool]{Success: true, Data: h.service.GetExtendedLogs()}
}

func (h *SettingsHandler) SetExtendedLogs(enabled bool) types.APIResponse[bool] {
	if err := h.service.SetExtendedLogs(enabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	if h.logging != nil {
		h.logging.SetExtendedLogs(enabled)
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SettingsHandler) ResetAllData() types.APIResponse[bool] {
	if h.resetProfiles != nil {
		if err := h.resetProfiles(); err != nil {
			return types.APIResponse[bool]{Success: false, Error: err.Error()}
		}
	}
	if err := h.service.ResetAllData(); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}
