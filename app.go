package main

import (
	"context"
	"net"
	"os"
	goruntime "runtime"
	"runtime/debug"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"beam-app/internal/bootstrap"
	"beam-app/internal/platform"
	"beam-app/internal/tray"
	"beam-bridge/core/target"
	"beam-bridge/core/types"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx                    context.Context
	container              *bootstrap.Container
	stateMu                sync.RWMutex
	windowHidden           bool
	quitRequested          bool
	trayIcon               []byte
	webviewGpuDisabled     bool
	lastHeartbeat          atomic.Int64
	singleInstanceListener net.Listener
	// previous is how the last run ended (see platform.BeginSession).
	previous platform.PreviousSession
	// webviewHidden is the page's own visibility report (occluded, minimised,
	// another Space). WebKit throttles timers of such a page, so its heartbeats
	// may legitimately stall; windowHidden only covers hide-to-tray.
	webviewHidden atomic.Bool
	// recoveryPending is set by a watchdog reload and cleared by the first
	// heartbeat after it: the "UI restarted" notice is sent only for a reload
	// that actually brought the UI back.
	recoveryPending atomic.Bool
}

func NewApp() *App {
	return &App{container: bootstrap.NewContainer(version, variant, buildHash)}
}

func (a *App) setStartupParams(trayIcon []byte, startHidden bool) {
	a.trayIcon = trayIcon
	a.stateMu.Lock()
	a.windowHidden = startHidden
	a.stateMu.Unlock()
	a.container.SetUIHidden(startHidden)
}

func (a *App) setWebviewGpuDisabled(disabled bool) {
	a.webviewGpuDisabled = disabled
}

func (a *App) setSingleInstanceListener(listener net.Listener) {
	a.singleInstanceListener = listener
}

func (a *App) setPreviousSession(previous platform.PreviousSession) {
	a.previous = previous
}

// vpnWanted maps a status to "the VPN should be up" for the session marker.
// Error is left out: the manager is still deciding (reconnect or give up).
func vpnWanted(status types.VPNStatus) (wanted, known bool) {
	switch status {
	case types.StatusConnected, types.StatusConnectedNoInternet, types.StatusConnecting:
		return true, true
	case types.StatusDisconnected, types.StatusDisconnecting:
		return false, true
	}
	return false, false
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	_ = platform.ListenForSecondInstance(ctx, a.singleInstanceListener, func(args []string) {
		targets := collectOpenTargets(args)
		for _, target := range targets {
			runtime.EventsEmit(a.ctx, "app:open-target", target)
		}
		a.showMainWindow()
	})

	a.container.SetContext(ctx)

	a.container.Runtime().SetWindowCallbacks(
		a.shouldMinimizeToTray,
		a.hideMainWindow,
		a.quitApplication,
	)
	trayConfig := tray.Config{
		Icon:        a.trayIcon,
		OnShow:      a.showMainWindow,
		OnToggleVPN: a.toggleVPNFromTray,
		OnQuit:      a.quitApplication,
	}
	if goruntime.GOOS == "windows" {
		trayConfig.OnToggleGPU = a.toggleWebviewGpuFromTray
		trayConfig.GPUDisabled = a.webviewGpuDisabled
	}
	a.container.InitTray(trayConfig)
	a.container.SetVPNStatusCallback(func(status types.VPNStatus) {
		a.syncTrayStatus(status)
		if wanted, known := vpnWanted(status); known {
			platform.SetSessionConnected(wanted)
		}
	})
	a.syncTrayStatus(a.container.VPNManager().GetStatus())
	a.queueOpenTargets(os.Args[1:])

	runtime.EventsOn(ctx, "app:webview-visibility", func(data ...interface{}) {
		visible := true
		if len(data) > 0 {
			if v, ok := data[0].(bool); ok {
				visible = v
			}
		}
		a.webviewHidden.Store(!visible)
		// Switching back to the short timeout must not judge the silence that
		// built up while the page was throttled.
		a.lastHeartbeat.Store(time.Now().UnixMilli())
	})
	a.lastHeartbeat.Store(time.Now().UnixMilli())
	go a.runWebviewWatchdog(ctx)

	go func() {
		defer platform.RecoverAndLog("deep-links-register")
		if platform.IsDevBuild() {
			return
		}
		if res := a.container.SystemHandler().EnableProtocolHandler(); !res.Success {
			platform.LogCrashEvent("deep links: failed to register beam:// - %s", res.Error)
		}
	}()

	go func() {
		defer platform.RecoverAndLog("auto-connect")
		// The previous run died with the VPN up: its kill switch rules died
		// with it. Pause the internet first (if the kill switch is on), then
		// bring the tunnel back.
		restore := a.previous.Crashed && a.previous.WasConnected
		if restore {
			a.container.VPNManager().EngageKillSwitchAfterCrash()
		}
		time.Sleep(1500 * time.Millisecond)
		if !restore && !a.container.SettingsService().GetApplication().AutoConnect {
			return
		}
		// At boot Wi-Fi gets its default route seconds after logon, later
		// than an autostarted Beam. Connecting before that builds a core
		// with no physical interface to leave through. Connect anyway on
		// timeout: the tunnel re-pins itself once the network shows up.
		const networkWait = 30 * time.Second
		if !a.container.VPNManager().WaitForNetwork(ctx, networkWait) {
			if ctx.Err() != nil {
				return
			}
			platform.LogCrashEvent("auto-connect: no network after %s, connecting anyway", networkWait)
		}
		err := a.container.VPNManager().Connect()
		if restore {
			platform.LogCrashEvent("session: reconnect after crash: err=%v", err)
			runtime.EventsEmit(a.ctx, "app:restored-after-crash", err == nil)
		}
	}()

	go func() {
		defer platform.RecoverAndLog("update-check")
		if platform.IsDevBuild() {
			return
		}
		// At startup, then every few hours: Beam lives in the tray for
		// days, a single check at launch would miss most releases.
		const recheckEvery = 6 * time.Hour
		delay := 2 * time.Second
		for {
			select {
			case <-ctx.Done():
				return
			case <-time.After(delay):
			}
			delay = recheckEvery
			result := a.container.UpdateHandler().CheckForUpdates()
			if !result.Success {
				platform.LogCrashEvent("update check failed: %s", result.Error)
				continue
			}
			if result.Data.Available {
				runtime.EventsEmit(a.ctx, "update:available", result.Data)
			}
		}
	}()

	go a.container.ProfileManager().RunAutoRefreshLoop(ctx)
}

func (a *App) Heartbeat() {
	a.lastHeartbeat.Store(time.Now().UnixMilli())
	if a.recoveryPending.CompareAndSwap(true, false) {
		runtime.EventsEmit(a.ctx, "app:recovered-from-crash")
	}
}

func (a *App) DevEmulateStatus(status string) types.APIResponse[bool] {
	if !platform.IsDevBuild() {
		return types.APIResponse[bool]{Success: false, Error: "not available in release builds"}
	}
	allowed := map[string]bool{
		"disconnected":          true,
		"connecting":            true,
		"connected":             true,
		"connected_no_internet": true,
		"disconnecting":         true,
		"error":                 true,
	}
	if !allowed[status] {
		return types.APIResponse[bool]{Success: false, Error: "Unknown status"}
	}
	runtime.EventsEmit(a.ctx, "vpn:status", status)
	if status == "error" {
		runtime.EventsEmit(a.ctx, "vpn:error", "[DEV] Emulated connection error")
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (a *App) runWebviewWatchdog(ctx context.Context) {
	const (
		checkInterval       = 2 * time.Second
		missTimeout         = 15 * time.Second
		hiddenMissTimeout   = 3 * time.Minute
		startupGrace        = 12 * time.Second
		maxReloadBackoff    = 10 * time.Minute
		suspendGapThreshold = 5 * time.Second
	)

	defer platform.RecoverAndLog("webview-watchdog")

	select {
	case <-ctx.Done():
		return
	case <-time.After(startupGrace):
	}

	ticker := time.NewTicker(checkInterval)
	defer ticker.Stop()

	lastTick := time.Now()
	reloadBackoff := startupGrace

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			now := time.Now()
			schedulingGap := now.Sub(lastTick)
			lastTick = now

			if schedulingGap > suspendGapThreshold {
				platform.LogCrashEvent("webview watchdog: detected system suspend (%s gap since last check), skipping crash detection", schedulingGap.Round(time.Second))
				a.lastHeartbeat.Store(now.UnixMilli())
				continue
			}

			last := a.lastHeartbeat.Load()
			if last == 0 {
				continue
			}

			a.stateMu.RLock()
			hidden := a.windowHidden
			a.stateMu.RUnlock()
			if hidden {
				a.lastHeartbeat.Store(now.UnixMilli())
				continue
			}

			// A hidden page still gets checked, only loosely: macOS can kill
			// the WebContent process of a background window, and that white
			// page must still be reloaded eventually.
			timeout := missTimeout
			pageHidden := a.webviewHidden.Load()
			if pageHidden {
				timeout = hiddenMissTimeout
			}

			silence := now.Sub(time.UnixMilli(last))
			if silence < timeout {
				continue
			}

			// A reload that brought heartbeats back resets the backoff; one
			// that did not doubles it, so a page that never answers cannot
			// put the app into a reload loop.
			if !a.recoveryPending.Load() {
				reloadBackoff = startupGrace
			}

			platform.LogCrashEvent("webview watchdog: no heartbeat for %s (page hidden: %t), forcing WindowReload, next check in %s", silence.Round(time.Second), pageHidden, reloadBackoff)
			a.recoveryPending.Store(true)
			runtime.WindowReload(a.ctx)
			a.lastHeartbeat.Store(time.Now().UnixMilli())

			select {
			case <-ctx.Done():
				return
			case <-time.After(reloadBackoff):
			}
			reloadBackoff = min(reloadBackoff*2, maxReloadBackoff)
			lastTick = time.Now()
		}
	}
}

func (a *App) shutdown(ctx context.Context) {
	const disconnectGrace = 5 * time.Second

	done := make(chan struct{})
	go func() {
		defer platform.RecoverAndLog("shutdown-disconnect")
		defer close(done)
		a.container.VPNHandler().Disconnect()
	}()

	select {
	case <-done:
		a.container.FlushAnalytics()
		platform.EndSession()
	case <-time.After(disconnectGrace):
		platform.LogCrashEvent("shutdown: disconnect did not finish in %s, forcing exit", disconnectGrace)
		a.container.FlushAnalytics()
		platform.EndSession()
		os.Exit(0)
	}
}

func (a *App) beforeClose(ctx context.Context) bool {
	a.stateMu.RLock()
	quitRequested := a.quitRequested
	a.stateMu.RUnlock()
	if quitRequested {
		return false
	}
	if a.shouldMinimizeToTray() {
		a.hideMainWindow()
		return true
	}
	return false
}

func (a *App) shouldMinimizeToTray() bool {
	if goruntime.GOOS == "darwin" {
		return false
	}
	tray := a.container.TrayManager()
	settings := a.container.SettingsService().GetApplication()
	return tray != nil && settings.MinimizeToTray
}

func (a *App) showMainWindow() {
	runtime.WindowUnminimise(a.ctx)
	runtime.WindowShow(a.ctx)
	runtime.Show(a.ctx)
	a.stateMu.Lock()
	a.windowHidden = false
	a.stateMu.Unlock()

	a.container.SetUIHidden(false)
	runtime.EventsEmit(a.ctx, "app:activated")
}

func (a *App) hideMainWindow() {
	runtime.WindowHide(a.ctx)
	a.stateMu.Lock()
	a.windowHidden = true
	a.stateMu.Unlock()

	a.container.SetUIHidden(true)
	runtime.EventsEmit(a.ctx, "app:hidden")

	go debug.FreeOSMemory()

	// Пока окно в трее, страницы WebView2 простаивают — вытесняем их из
	// рабочих наборов (своего процесса и ТОЛЬКО своих дочерних
	// msedgewebview2). Первый трим с задержкой: дать анимации скрытия
	// доиграть, чтобы не поднимать страницы обратно сразу после сброса.
	// Дальше — каждые 5 минут, пока окно скрыто: фоновые таймеры
	// renderer'а понемногу надувают его обратно.
	go func() {
		timer := time.NewTimer(3 * time.Second)
		defer timer.Stop()
		<-timer.C
		for {
			a.stateMu.RLock()
			hidden := a.windowHidden
			a.stateMu.RUnlock()
			if !hidden {
				return
			}
			platform.TrimMemory()
			time.Sleep(5 * time.Minute)
		}
	}()
}

func (a *App) quitApplication() {
	a.stateMu.Lock()
	if a.quitRequested {
		a.stateMu.Unlock()
		return
	}
	a.quitRequested = true
	a.stateMu.Unlock()
	tray := a.container.TrayManager()
	if tray != nil {
		tray.Quit()
	}
	go runtime.Quit(a.ctx)

	go func() {
		const forceExitGrace = 10 * time.Second
		time.Sleep(forceExitGrace)
		platform.LogCrashEvent("quit: process still alive %s after quit request, forcing exit", forceExitGrace)
		platform.EndSession()
		os.Exit(0)
	}()
}

// toggleWebviewGpuFromTray is the way out of a black window: the window may
// show nothing to click, but the tray menu still works.
func (a *App) toggleWebviewGpuFromTray() {
	if err := platform.SetWebviewGpuDisabled(!a.webviewGpuDisabled, "tray menu"); err != nil {
		platform.LogCrashEvent("webview: failed to store GPU choice: %s", err.Error())
		return
	}
	if err := platform.RelaunchAfterExit(); err != nil {
		platform.LogCrashEvent("webview: %s", err.Error())
		return
	}
	a.quitApplication()
}

func (a *App) syncTrayStatus(status types.VPNStatus) {
	tray := a.container.TrayManager()
	if tray != nil {
		tray.Sync(status)
	}
}

func (a *App) toggleVPNFromTray() {
	status := a.container.VPNManager().GetStatus()
	switch status {
	case types.StatusDisconnected, types.StatusError:
		_ = a.container.VPNManager().Connect()
	case types.StatusConnected, types.StatusConnectedNoInternet:
		_ = a.container.VPNManager().Disconnect()
	}
}

func (a *App) queueOpenTargets(args []string) {
	targets := collectOpenTargets(args)
	a.container.TargetService().Queue(targets)
}

func collectOpenTargets(args []string) []string {
	targets := make([]string, 0, len(args))
	for _, arg := range args {
		trimmed := strings.TrimSpace(arg)
		if target.Supports(trimmed) {
			targets = append(targets, trimmed)
		}
	}
	return targets
}
