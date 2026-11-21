package handlers

import (
	"os"

	"beam-bridge/core/types"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// SaveProTunFile saves a .protun schema through the native "Save as" dialog,
// the same way profiles are exported to .beam. Returns the chosen path or ""
// when the user cancelled.
func (h *WindowHandler) SaveProTunFile(content string, suggestedName string) types.APIResponse[string] {
	ctx := h.rt.Context()
	if ctx == nil {
		return types.APIResponse[string]{Success: false, Error: "the application context is not ready yet"}
	}

	path, err := runtime.SaveFileDialog(ctx, runtime.SaveDialogOptions{
		Title:                "Save ProTun schema",
		DefaultFilename:      ensureExt(suggestedName, ".protun"),
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{DisplayName: "ProTun schema (*.protun)", Pattern: "*.protun"},
		},
	})
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	if path == "" {
		return types.APIResponse[string]{Success: true, Data: ""}
	}

	path = ensureExt(path, ".protun")
	if err := os.WriteFile(path, []byte(content), 0600); err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[string]{Success: true, Data: path}
}
