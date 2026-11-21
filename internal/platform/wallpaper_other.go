//go:build !windows && !linux && !darwin

package platform

import "os/exec"

func wallpaperCandidates() []string { return nil }

func hideWallpaperCommandWindow(*exec.Cmd) {}
