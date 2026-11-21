//go:build linux

package tray

import "fyne.io/systray"

func startSystray(t *beamTray) {
	go systray.Run(t.onReady, t.onExit)
}
