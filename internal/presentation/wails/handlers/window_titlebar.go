package handlers

import (
	"beam-app/internal/platform"
	"beam-bridge/core/types"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// TitleBarDoubleClick does what the OS would do on a native caption
// double-click. Wails v2 swallows the second click on drag regions
// (dragTest bails on e.detail != 1), so the frontend forwards it here.
func (h *WindowHandler) TitleBarDoubleClick() types.APIResponse[string] {
	ctx := h.rt.Context()
	if ctx == nil {
		return types.APIResponse[string]{Success: false, Error: "the application context is not ready yet"}
	}

	if runtime.WindowIsFullscreen(ctx) {
		return types.APIResponse[string]{Success: true, Data: string(platform.TitleBarNone)}
	}

	action := platform.TitleBarDoubleClickAction()
	switch action {
	case platform.TitleBarMaximise:
		runtime.WindowToggleMaximise(ctx)
	case platform.TitleBarMinimise:
		runtime.WindowMinimise(ctx)
	}
	return types.APIResponse[string]{Success: true, Data: string(action)}
}
