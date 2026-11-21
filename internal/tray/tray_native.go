package tray

import (
	"fmt"
	"sync"
	"sync/atomic"

	"fyne.io/systray"
	"beam-app/internal/platform"
	"beam-bridge/core/types"
)

type beamTray struct {
	config     Config
	mu         sync.Mutex
	ready      bool
	quitting   atomic.Bool
	statusItem *systray.MenuItem
	vpnItem    *systray.MenuItem
}

func newManager(config Config) Manager {
	t := &beamTray{config: config}
	startSystray(t)
	return t
}

func (t *beamTray) onReady() {
	if len(t.config.Icon) > 0 {
		systray.SetIcon(t.config.Icon)
	}
	systray.SetTooltip(trayLabel())

	systray.SetOnTapped(func() {
		go func() {
			defer platform.RecoverAndLog("tray-icon-tap")
			if t.config.OnShow != nil {
				t.config.OnShow()
			}
		}()
	})

	t.statusItem = systray.AddMenuItem("Initializing...", "Current VPN status")
	t.statusItem.Disable()

	systray.AddSeparator()

	openItem := systray.AddMenuItem("Open BEAM", "Show the BEAM window")
	t.vpnItem = systray.AddMenuItem("Enable VPN", "Quick VPN control")

	systray.AddSeparator()

	var gpuItem *systray.MenuItem
	if t.config.OnToggleGPU != nil {
		if t.config.GPUDisabled {
			gpuItem = systray.AddMenuItem("Restart with GPU acceleration", "Render the BEAM window on the GPU again")
		} else {
			gpuItem = systray.AddMenuItem("Black window? Restart without GPU", "Render the BEAM window in software")
		}
	}

	quitItem := systray.AddMenuItem("Quit", "Close BEAM")

	t.mu.Lock()
	t.ready = true
	t.mu.Unlock()

	go func() {
		for range openItem.ClickedCh {
			func() {
				defer platform.RecoverAndLog("tray-open-click")
				if t.config.OnShow != nil {
					t.config.OnShow()
				}
			}()
		}
	}()

	go func() {
		for range t.vpnItem.ClickedCh {
			func() {
				defer platform.RecoverAndLog("tray-toggle-vpn-click")
				if t.config.OnToggleVPN != nil {
					t.config.OnToggleVPN()
				}
			}()
		}
	}()

	if gpuItem != nil {
		go func() {
			for range gpuItem.ClickedCh {
				func() {
					defer platform.RecoverAndLog("tray-toggle-gpu-click")
					t.config.OnToggleGPU()
				}()
			}
		}()
	}

	go func() {
		for range quitItem.ClickedCh {
			func() {
				defer platform.RecoverAndLog("tray-quit-click")
				if t.config.OnQuit != nil {
					t.config.OnQuit()
				}
			}()
		}
	}()

	t.Sync(types.StatusDisconnected)
}

func (t *beamTray) onExit() {}

func (t *beamTray) Quit() {
	t.quitting.Store(true)
	systray.Quit()
}

func (t *beamTray) Sync(status types.VPNStatus) {
	t.mu.Lock()
	defer t.mu.Unlock()

	if !t.ready || t.statusItem == nil || t.vpnItem == nil {
		return
	}

	statusLabel, tooltip, actionLabel, actionTooltip, busy, connected := describeStatus(status)

	t.statusItem.SetTitle(statusLabel)
	t.statusItem.SetTooltip(tooltip)

	t.vpnItem.SetTitle(actionLabel)
	t.vpnItem.SetTooltip(actionTooltip)

	if busy {
		t.vpnItem.Disable()
	} else {
		t.vpnItem.Enable()
	}

	if connected {
		t.vpnItem.Check()
	} else {
		t.vpnItem.Uncheck()
	}

	systray.SetTooltip(fmt.Sprintf("%s: %s", trayLabel(), tooltip))
}

func trayLabel() string {
	if platform.IsDevBuild() {
		return "BEAM (Dev)"
	}
	return "BEAM"
}

func describeStatus(status types.VPNStatus) (statusLabel, tooltip, actionLabel, actionTooltip string, busy, connected bool) {
	switch status {
	case types.StatusConnecting:
		return "VPN: connecting...", "Connecting", "Connecting...", "Wait until the connection is established", true, false
	case types.StatusDisconnecting:
		return "VPN: disconnecting...", "Disconnecting", "Disconnecting...", "Wait until the disconnect finishes", true, true
	case types.StatusConnected:
		return "VPN: connected", "Connected", "Disable VPN", "Disable the VPN in BEAM", false, true
	case types.StatusConnectedNoInternet:
		return "VPN: no internet", "Connected, but no internet", "Disable VPN", "Disable the VPN in BEAM", false, true
	default:
		return "VPN: disconnected", "Disconnected", "Enable VPN", "Enable the VPN in BEAM", false, false
	}
}
