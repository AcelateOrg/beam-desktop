package settings

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"

	domainSettings "beam-bridge/core/domain/settings"
	"beam-app/internal/platform"
	"beam-bridge/core/types"
)

const autoStartAppName = "Beam"

type Service struct {
	repo domainSettings.Repository
}

func NewService(repo domainSettings.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetConnection() domainSettings.ConnectionSettings {
	return s.repo.Get().Connection
}

func (s *Service) UpdateConnection(conn domainSettings.ConnectionSettings) error {
	return s.repo.UpdateConnection(conn)
}

func (s *Service) GetApplication() domainSettings.ApplicationSettings {
	appSettings := s.repo.Get().Application
	if enabled, err := platform.IsLaunchOnStartupEnabled(autoStartAppName); err == nil {
		appSettings.LaunchOnStartup = enabled
	}
	return appSettings
}

func (s *Service) UpdateApplication(app domainSettings.ApplicationSettings) error {
	currentEnabled, _ := platform.IsLaunchOnStartupEnabled(autoStartAppName)
	if currentEnabled != app.LaunchOnStartup {
		if err := platform.SetLaunchOnStartup(autoStartAppName, app.LaunchOnStartup); err != nil {
			return err
		}
	}
	return s.repo.UpdateApplication(app)
}

func (s *Service) GetSplitTunnel() types.SplitTunnelSettings {
	return s.repo.Get().SplitTunnel
}

func (s *Service) SetSplitTunnelEnabled(enabled bool) error {
	return s.repo.SetSplitTunnelEnabled(enabled)
}

func (s *Service) UpdateSplitTunnel(st types.SplitTunnelSettings) error {
	return s.repo.UpdateSplitTunnel(st)
}

func (s *Service) GetRoutingMode() string {
	mode := s.repo.Get().RoutingMode
	if mode == "" {
		return "easy"
	}
	return mode
}

func (s *Service) SetRoutingMode(mode string) error {
	return s.repo.UpdateRoutingMode(mode)
}

func (s *Service) GetProTunGraph() types.ProTunGraph {
	return s.repo.Get().ProTunGraph
}

func (s *Service) SaveProTunGraph(graph types.ProTunGraph) error {
	return s.repo.UpdateProTunGraph(graph)
}

// GetProTunProfileGraph returns the user's ProTun layer of a profile.
func (s *Service) GetProTunProfileGraph(profileID string) (types.ProTunGraph, bool) {
	graph, ok := s.repo.Get().ProTunProfiles[profileID]
	return graph, ok
}

// ProTunProfileIDs lists the profiles that have their own ProTun layer.
func (s *Service) ProTunProfileIDs() map[string]bool {
	out := map[string]bool{}
	for id, graph := range s.repo.Get().ProTunProfiles {
		if len(graph.Nodes) > 0 {
			out[id] = true
		}
	}
	return out
}

func (s *Service) SaveProTunProfileGraph(profileID string, graph *types.ProTunGraph) error {
	return s.repo.UpdateProTunProfileGraph(profileID, graph)
}

func (s *Service) GetAppearance() domainSettings.AppearanceSettings {
	return s.repo.Get().Appearance
}

func (s *Service) SetTheme(theme string) error {
	current := s.repo.Get().Appearance
	current.Theme = theme
	return s.repo.UpdateAppearance(current)
}

// SetAccent задаёт свой акцент поверх готовых тем; "" — акцент темы.
func (s *Service) SetAccent(color string) (string, error) {
	current := s.repo.Get().Appearance
	current.Accent = color
	if err := s.repo.UpdateAppearance(current); err != nil {
		return "", err
	}
	return s.repo.Get().Appearance.Accent, nil
}

func (s *Service) SetAppearanceDetails(font, radius, animation string) error {
	current := s.repo.Get().Appearance
	current.Font = font
	current.Radius = radius
	current.Animation = animation
	return s.repo.UpdateAppearance(current)
}

// GetCustomThemes returns user-defined themes in their saved order.
func (s *Service) GetCustomThemes() []domainSettings.CustomTheme {
	themes := s.repo.Get().Appearance.CustomThemes
	if themes == nil {
		return []domainSettings.CustomTheme{}
	}
	return themes
}

// SaveCustomTheme creates (empty ID) or updates a custom theme and returns
// the stored, normalized version.
func (s *Service) SaveCustomTheme(theme domainSettings.CustomTheme) (domainSettings.CustomTheme, error) {
	if !customThemeColorRe.MatchString(theme.Color) {
		return domainSettings.CustomTheme{}, fmt.Errorf("некорректный цвет темы: %q", theme.Color)
	}

	current := s.repo.Get().Appearance
	themes := make([]domainSettings.CustomTheme, len(current.CustomThemes), len(current.CustomThemes)+1)
	copy(themes, current.CustomThemes)

	if theme.ID == "" {
		if len(themes) >= maxCustomThemes {
			return domainSettings.CustomTheme{}, fmt.Errorf("достигнут лимит пользовательских тем (%d)", maxCustomThemes)
		}
		id, err := newCustomThemeID()
		if err != nil {
			return domainSettings.CustomTheme{}, err
		}
		theme.ID = id
		themes = append(themes, theme)
	} else {
		found := false
		for i := range themes {
			if themes[i].ID == theme.ID {
				themes[i] = theme
				found = true
				break
			}
		}
		if !found {
			// Unknown id means the theme is being restored (undo after delete):
			// keeping the id keeps "custom:<id>" references valid.
			if !customThemeIDRe.MatchString(theme.ID) {
				return domainSettings.CustomTheme{}, fmt.Errorf("некорректный id темы: %q", theme.ID)
			}
			if len(themes) >= maxCustomThemes {
				return domainSettings.CustomTheme{}, fmt.Errorf("достигнут лимит пользовательских тем (%d)", maxCustomThemes)
			}
			themes = append(themes, theme)
		}
	}

	current.CustomThemes = themes
	if err := s.repo.UpdateAppearance(current); err != nil {
		return domainSettings.CustomTheme{}, err
	}
	for _, saved := range s.repo.Get().Appearance.CustomThemes {
		if saved.ID == theme.ID {
			return saved, nil
		}
	}
	return domainSettings.CustomTheme{}, fmt.Errorf("не удалось сохранить тему")
}

// DeleteCustomTheme removes a custom theme. If it was active, the app falls
// back to the built-in dark theme.
func (s *Service) DeleteCustomTheme(id string) error {
	current := s.repo.Get().Appearance
	themes := make([]domainSettings.CustomTheme, 0, len(current.CustomThemes))
	for _, t := range current.CustomThemes {
		if t.ID != id {
			themes = append(themes, t)
		}
	}
	if len(themes) == len(current.CustomThemes) {
		return nil
	}
	current.CustomThemes = themes
	if current.Theme == customThemePrefix+id {
		current.Theme = "dark"
	}
	return s.repo.UpdateAppearance(current)
}

const (
	customThemePrefix = "custom:"
	maxCustomThemes   = 64
)

var (
	customThemeColorRe = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	customThemeIDRe    = regexp.MustCompile(`^[a-z0-9]{4,32}$`)
)

func newCustomThemeID() (string, error) {
	buf := make([]byte, 6)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("не удалось сгенерировать id темы: %w", err)
	}
	return hex.EncodeToString(buf), nil
}

func (s *Service) GetOnboardingCompleted() bool {
	return s.repo.Get().OnboardingCompleted
}

func (s *Service) SetOnboardingCompleted(completed bool) error {
	return s.repo.SetOnboardingCompleted(completed)
}

func (s *Service) GetHwid() domainSettings.HwidSettings {
	return s.repo.Get().Hwid
}

func (s *Service) UpdateHwid(h domainSettings.HwidSettings) error {
	return s.repo.UpdateHwid(h)
}

func (s *Service) GetPing() domainSettings.PingSettings {
	return s.repo.Get().Ping
}

func (s *Service) UpdatePing(ping domainSettings.PingSettings) error {
	return s.repo.UpdatePing(ping)
}

func (s *Service) ListRunningApplications() ([]types.RunningApplication, error) {
	return platform.ListRunningApplications()
}

func (s *Service) GetDeveloperMode() bool {
	return s.repo.Get().DeveloperMode
}

func (s *Service) SetDeveloperMode(enabled bool) error {
	return s.repo.SetDeveloperMode(enabled)
}

func (s *Service) GetTraceLogging() bool {
	return s.repo.Get().TraceLogging
}

func (s *Service) SetTraceLogging(enabled bool) error {
	return s.repo.SetTraceLogging(enabled)
}

func (s *Service) GetCoreLogging() bool {
	return !s.repo.Get().DisableCoreLogging
}

// GetLogLevel возвращает пользовательский уровень логов вкладки «Логи».
// Пустое значение старых настроек трактуется как "info"; выключенные логи
// ядра — как "off".
func (s *Service) GetLogLevel() string {
	settings := s.repo.Get()
	if settings.DisableCoreLogging {
		return "off"
	}
	switch settings.LogLevel {
	case "off", "error", "info", "debug":
		return settings.LogLevel
	default:
		return "info"
	}
}

func (s *Service) SetLogLevel(level string) error {
	return s.repo.SetLogLevel(level)
}

func (s *Service) SetCoreLogging(enabled bool) error {
	return s.repo.SetCoreLogging(enabled)
}

func (s *Service) GetRealityDebug() bool {
	return s.repo.Get().RealityDebug
}

func (s *Service) SetRealityDebug(enabled bool) error {
	return s.repo.SetRealityDebug(enabled)
}

func (s *Service) GetExtendedLogs() bool {
	return s.repo.Get().ExtendedLogs
}

func (s *Service) SetExtendedLogs(enabled bool) error {
	return s.repo.SetExtendedLogs(enabled)
}

func (s *Service) ResetAllData() error {
	return s.repo.ResetToDefaults()
}
