package tray

import (
	"beam-bridge/core/types"
)

type Manager interface {
	Sync(types.VPNStatus)
	Quit()
}

type Config struct {
	Icon        []byte
	OnShow      func()
	OnToggleVPN func()
	OnQuit      func()
	// OnToggleGPU restarts BEAM with WebView2 GPU acceleration flipped; nil
	// hides the menu item. GPUDisabled is the state the app runs with now.
	OnToggleGPU func()
	GPUDisabled bool
}

func New(config Config) Manager {
	return newManager(config)
}
