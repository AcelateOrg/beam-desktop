//go:build darwin

package platform

import "os/exec"

// wallpaperCandidates спрашивает картинку текущего рабочего стола у System Events.
// Динамические обои (.heic) WebKit отображает сам.
func wallpaperCandidates() []string {
	return []string{
		wallpaperCommand("osascript", "-e", `tell application "System Events" to get picture of current desktop`),
	}
}

func hideWallpaperCommandWindow(*exec.Cmd) {}
