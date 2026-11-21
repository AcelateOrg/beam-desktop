package dto

import (
	"beam-bridge/core/types"
	"time"
)

type ProfileData struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Provider  string `json:"provider"`
	URL       string `json:"url"`
	Announce  string `json:"announce,omitempty"`
	DataLimit int64  `json:"dataLimit"`
	DataUsed  int64  `json:"dataUsed"`
	ExpiresAt string `json:"expiresAt"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
	IsActive  bool   `json:"isActive"`
}

func ToProfileData(prof *types.Profile) *ProfileData {
	if prof == nil {
		return nil
	}
	return &ProfileData{
		ID:        prof.ID,
		Name:      prof.Name,
		Provider:  prof.Provider,
		URL:       prof.URL,
		Announce:  prof.Announce,
		DataLimit: prof.DataLimit,
		DataUsed:  prof.DataUsed,
		ExpiresAt: prof.ExpiresAt.Format(time.RFC3339Nano),
		CreatedAt: prof.CreatedAt.Format(time.RFC3339Nano),
		UpdatedAt: prof.UpdatedAt.Format(time.RFC3339Nano),
		IsActive:  prof.IsActive,
	}
}

type ConnectionSettingsData struct {
	Mode         string `json:"mode"`
	ProxyType    string `json:"proxyType"`
	ProxyHost    string `json:"proxyHost"`
	ProxyPort    int    `json:"proxyPort"`
	TunName      string `json:"tunName"`
	PrimaryDNS   string `json:"primaryDns"`
	SecondaryDNS string `json:"secondaryDns"`
	ProxyDNS     string `json:"proxyDns"`
	DNSOverVPN   bool   `json:"dnsOverVpn"`
	MTU          int    `json:"mtu"`
	Stack        string `json:"stack"`
}

// ProTunStateData — граф маршрутизации + признак провайдерского лока.
type ProTunStateData struct {
	Graph  types.ProTunGraph `json:"graph"`
	Locked bool              `json:"locked"`
}

// SplitTunnelConflictData — пересечение пользовательского оверрайда
// (сплит-туннель) с провайдерским пресетом: значение и то, куда его
// маршрутизирует пресет.
type SplitTunnelConflictData struct {
	Value  string `json:"value"`
	Target string `json:"target"`
}

type PingSettingsData struct {
	NodeMode       string `json:"nodeMode"`
	ConnectionMode string `json:"connectionMode"`
}

type ApplicationSettingsData struct {
	LaunchOnStartup                bool `json:"launchOnStartup"`
	MinimizeToTray                 bool `json:"minimizeToTray"`
	AutoConnect                    bool `json:"autoConnect"`
	DisableSubscriptionAutoRefresh bool `json:"disableSubscriptionAutoRefresh"`
}

type HwidSettingsData struct {
	Enabled bool   `json:"enabled"`
	Mode    string `json:"mode"`
	Value   string `json:"value"`
}

type AppearanceDetailsData struct {
	Font      string `json:"font"`
	Radius    string `json:"radius"`
	Animation string `json:"animation"`
}

// CustomFontData — загруженный пользователем шрифт; файл отдаётся по /beam-font/<id>.
type CustomFontData struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Ext  string `json:"ext"`
}

// WallpaperInfo — найдены ли обои ОС и их версия (меняется при смене картинки).
type WallpaperInfo struct {
	Available bool   `json:"available"`
	Version   string `json:"version"`
}
