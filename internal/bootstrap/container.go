package bootstrap

import (
	"context"
	"log"
	goRuntime "runtime"
	"sync/atomic"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	appProfile "beam-app/internal/application/profile"
	appSettings "beam-app/internal/application/settings"
	appSystem "beam-app/internal/application/system"
	appUpdate "beam-app/internal/application/update"
	appVPN "beam-app/internal/application/vpn"
	"beam-app/internal/platform"
	"beam-app/internal/presentation/wails/handlers"
	"beam-app/internal/tray"
	"beam-bridge/core/analytics"
	domainSettings "beam-bridge/core/domain/settings"
	infraBeam "beam-bridge/core/infrastructure/beam"
	infraProfile "beam-bridge/core/infrastructure/persistence/profile"
	infraSettings "beam-bridge/core/infrastructure/persistence/settings"
	corePaths "beam-bridge/core/paths"
	"beam-bridge/core/profile"
	"beam-bridge/core/runner"
	"beam-bridge/core/types"
	coreVPN "beam-bridge/core/vpn"
)

type Container struct {
	profileRepo     *infraProfile.FileRepository
	core            *runner.Service
	settingsRepo    *infraSettings.JSONRepository
	profileManager  *profile.Manager
	vpnManager      *coreVPN.Manager
	analytics       *analytics.Store
	profileService  *appProfile.Service
	vpnService      *appVPN.Service
	settingsService *appSettings.Service
	protocolService *appSystem.ProtocolService
	targetService   *appSystem.TargetService
	updateService   *appUpdate.Service
	profileHandler  *handlers.ProfileHandler
	vpnHandler      *handlers.VPNHandler
	settingsHandler *handlers.SettingsHandler
	systemHandler   *handlers.SystemHandler
	windowHandler   *handlers.WindowHandler
	updateHandler   *handlers.UpdateHandler
	trayManager     tray.Manager
	runtime         *handlers.Runtime

	uiHidden atomic.Bool
}

func NewContainer(version, variant, buildHash string) *Container {
	c := &Container{}
	c.runtime = handlers.NewRuntime()

	platform.EnsureDirs()

	corePathLayout := corePaths.Paths{
		Data:     platform.GetAppDataDir(),
		Profiles: platform.GetProfilesDir(),
		Temp:     platform.GetTempDir(),
	}

	// Device-bound key for the profile store and sensitive settings. If it
	// cannot be initialised (unusual), the store degrades to the portable
	// plaintext format rather than failing to start.
	if err := infraBeam.InitKeystore(corePathLayout.Data); err != nil {
		log.Printf("bootstrap: beam keystore unavailable, profiles stay unencrypted: %v", err)
	}

	c.profileRepo = infraProfile.NewFileRepository(corePathLayout)
	_ = c.profileRepo.Load()

	defaultMode := infraSettings.ModeSystemProxy
	if goRuntime.GOOS == "windows" || goRuntime.GOOS == "linux" {
		defaultMode = infraSettings.ModeTun
	}

	var err error
	c.settingsRepo, err = infraSettings.NewJSONRepository(corePathLayout, defaultMode)
	if err != nil {
		panic("failed to init settings repository: " + err.Error())
	}

	c.profileManager = profile.NewManager(c.profileRepo, c.settingsRepo, corePathLayout)

	c.core = runner.New(runner.Options{
		Paths:      corePathLayout,
		Connection: func() domainSettings.ConnectionSettings { return c.settingsRepo.Get().Connection },
		Routes:     c.profileManager.GetRoutePlan,
	})
	// Fast first connect: the TUN adapter and the geo indexes are ready
	// before the user presses Connect.
	c.core.Prewarm()
	c.profileManager.PrewarmGeo()
	c.vpnManager = coreVPN.NewManager(c.profileManager, c.settingsRepo, c.core)
	c.analytics = analytics.Open(corePathLayout.Data)
	c.vpnManager.SetAnalytics(c.analytics)

	c.profileManager.SetCore(c.core)
	// Isolated ping builds its own throwaway core through the coreapi seam,
	// re-exported by runner, so the desktop never imports the engine directly.
	c.profileManager.SetCoreFactory(runner.CoreFactory)

	c.profileService = appProfile.NewService(c.profileRepo, c.profileManager)
	c.vpnService = appVPN.NewService(c.vpnManager)
	c.settingsService = appSettings.NewService(c.settingsRepo)
	c.protocolService = appSystem.NewProtocolService()
	c.targetService = appSystem.NewTargetService(c.profileManager)
	c.updateService = appUpdate.NewService(version)

	c.profileService.SetVPNStatusProvider(c.vpnService.GetStatus)
	c.profileService.SetVPNRestarter(c.vpnManager.Restart)

	c.profileHandler = handlers.NewProfileHandler(c.profileService, c.runtime)
	c.vpnHandler = handlers.NewVPNHandler(c.vpnService)
	c.settingsHandler = handlers.NewSettingsHandler(c.settingsService, c.vpnManager, c.profileRepo.Reset, c.profileManager.GetActiveProTunPreset, c.profileManager.GeoCodes)
	handlers.SetGeoAttributes(c.settingsHandler, c.profileManager.GeoSiteAttributes)
	handlers.SetProTunProfiles(c.settingsHandler, c.profileRepo.GetAll, c.profileManager.GetActiveProfileID, c.profileManager.GetProTunPreset)
	c.systemHandler = handlers.NewSystemHandler(
		c.protocolService,
		c.targetService,
		handlers.BuildMetadata{Version: version, Variant: variant, Hash: buildHash},
	)
	c.windowHandler = handlers.NewWindowHandler(c.runtime)
	c.updateHandler = handlers.NewUpdateHandler(c.updateService, version, c.runtime)

	return c
}

func (c *Container) ProfileHandler() *handlers.ProfileHandler   { return c.profileHandler }
func (c *Container) VPNHandler() *handlers.VPNHandler           { return c.vpnHandler }
func (c *Container) SettingsHandler() *handlers.SettingsHandler { return c.settingsHandler }
func (c *Container) SystemHandler() *handlers.SystemHandler     { return c.systemHandler }
func (c *Container) WindowHandler() *handlers.WindowHandler     { return c.windowHandler }
func (c *Container) UpdateHandler() *handlers.UpdateHandler     { return c.updateHandler }
func (c *Container) VPNManager() *coreVPN.Manager               { return c.vpnManager }
func (c *Container) ProfileManager() *profile.Manager           { return c.profileManager }
func (c *Container) TargetService() *appSystem.TargetService    { return c.targetService }
func (c *Container) SettingsService() *appSettings.Service      { return c.settingsService }
func (c *Container) ProfileRepo() *infraProfile.FileRepository  { return c.profileRepo }

func (c *Container) SetContext(ctx context.Context) {
	c.runtime.SetContext(ctx)

	c.vpnManager.SetContext(ctx)

	c.vpnManager.SetEmitter(func(event string, data any) {
		if event == "vpn:stats" && c.uiHidden.Load() {
			return
		}
		runtime.EventsEmit(ctx, event, data)
	})

}

func (c *Container) Runtime() *handlers.Runtime { return c.runtime }

// FlushAnalytics writes pending statistics to disk (on exit).
func (c *Container) FlushAnalytics() {
	if c.analytics != nil {
		_ = c.analytics.Flush()
	}
}

func (c *Container) SetUIHidden(hidden bool) {
	c.uiHidden.Store(hidden)
}

func (c *Container) InitTray(config tray.Config) {
	c.trayManager = tray.New(config)
}

func (c *Container) TrayManager() tray.Manager { return c.trayManager }

func (c *Container) SetVPNStatusCallback(callback func(status types.VPNStatus)) {
	c.vpnManager.SetStatusCallback(callback)
}
