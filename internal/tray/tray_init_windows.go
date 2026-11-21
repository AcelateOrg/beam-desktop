//go:build windows

package tray

import (
	"runtime"
	"time"

	"fyne.io/systray"
	"beam-app/internal/platform"
)

const maxTrayRestarts = 5

const trayRestartDelay = 2 * time.Second

func startSystray(t *beamTray) {
	enableDarkContextMenus()
	go t.runMessageLoop()
}

func (t *beamTray) runMessageLoop() {
	runtime.LockOSThread()

	for attempt := 1; attempt <= maxTrayRestarts; attempt++ {
		func() {
			defer func() {
				if r := recover(); r != nil {
					buf := make([]byte, 8192)
					n := runtime.Stack(buf, false)
					platform.LogCrashEvent("panic in tray-message-loop (attempt %d/%d): %v\n%s", attempt, maxTrayRestarts, r, buf[:n])
				}
			}()
			systray.Run(t.onReady, t.onExit)
		}()

		if t.quitting.Load() {
			return
		}

		if attempt < maxTrayRestarts {
			time.Sleep(trayRestartDelay)
		}
	}
}
