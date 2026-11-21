//go:build darwin

package tray

import "fyne.io/systray"

func startSystray(t *beamTray) {
	systray.Register(t.onReady, t.onExit)
}
