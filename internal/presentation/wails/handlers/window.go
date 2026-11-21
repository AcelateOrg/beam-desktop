package handlers

import (
	"path/filepath"
	goruntime "runtime"

	"beam-bridge/core/types"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type WindowHandler struct {
	rt *Runtime
}

func NewWindowHandler(rt *Runtime) *WindowHandler {
	return &WindowHandler{rt: rt}
}

func (h *WindowHandler) MinimizeWindow() types.APIResponse[bool] {
	ctx := h.rt.Context()
	if ctx == nil {
		return types.APIResponse[bool]{Success: false, Error: "the application context is not ready yet"}
	}

	if h.rt.ShouldMinimizeToTray() {
		h.rt.HideWindow()
		return types.APIResponse[bool]{Success: true, Data: true}
	}

	runtime.WindowMinimise(ctx)
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *WindowHandler) CloseWindow() types.APIResponse[bool] {
	if h.rt.Context() == nil {
		return types.APIResponse[bool]{Success: false, Error: "the application context is not ready yet"}
	}

	if h.rt.ShouldMinimizeToTray() {
		h.rt.HideWindow()
		return types.APIResponse[bool]{Success: true, Data: true}
	}

	h.rt.QuitApp()
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *WindowHandler) PickExecutable() types.APIResponse[string] {
	ctx := h.rt.Context()
	if ctx == nil {
		return types.APIResponse[string]{Success: false, Error: "the application context is not ready yet"}
	}

	isDarwin := goruntime.GOOS == "darwin"

	options := runtime.OpenDialogOptions{Title: "Select an executable"}
	if isDarwin {
		options.Title = "Select an application"
		options.Filters = []runtime.FileFilter{
			{DisplayName: "Applications (*.app)", Pattern: "*.app"},
			{DisplayName: "All files", Pattern: "*"},
		}
	} else {
		options.Filters = []runtime.FileFilter{
			{DisplayName: "Executable files (*.exe)", Pattern: "*.exe"},
			{DisplayName: "All files", Pattern: "*.*"},
		}
	}

	selectedPath, err := runtime.OpenFileDialog(ctx, options)
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}

	if selectedPath == "" {
		return types.APIResponse[string]{Success: true, Data: ""}
	}

	if isDarwin {
		return types.APIResponse[string]{Success: true, Data: selectedPath}
	}

	return types.APIResponse[string]{
		Success: true,
		Data:    filepath.Base(selectedPath),
	}
}
