package handlers

import (
	"context"
	"time"

	"beam-app/internal/application/update"
	"beam-app/internal/application/update/ota"
	"beam-bridge/core/types"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type UpdateHandler struct {
	service        *update.Service
	currentVersion string
	rt             *Runtime

	lastUpdate     *update.Update
	lastStagingDir string
}

func NewUpdateHandler(service *update.Service, currentVersion string, rt *Runtime) *UpdateHandler {
	return &UpdateHandler{service: service, currentVersion: currentVersion, rt: rt}
}

func (h *UpdateHandler) CheckForUpdates() types.APIResponse[types.UpdateInfo] {
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	upd, err := h.service.CheckForUpdate(ctx, h.currentVersion)
	if err != nil {
		return types.APIResponse[types.UpdateInfo]{Success: false, Error: err.Error()}
	}

	h.lastUpdate = upd

	info := types.UpdateInfo{CurrentVersion: h.currentVersion}
	if upd != nil {
		rel := upd.Release
		info.Available = true
		info.LatestVersion = rel.Version
		info.Mandatory = upd.Mandatory
		info.ReleasedAt = rel.ReleasedAt.UTC().Format(time.RFC3339)
		info.Notes = upd.Notes()
		info.Files = toUpdateFileEntries(rel.Files)
	}

	return types.APIResponse[types.UpdateInfo]{Success: true, Data: info}
}

func (h *UpdateHandler) DownloadUpdate() types.APIResponse[bool] {
	ctx := h.rt.Context()
	if ctx == nil {
		return types.APIResponse[bool]{Success: false, Error: "the application context is not ready yet"}
	}

	if h.lastUpdate == nil {
		return types.APIResponse[bool]{Success: false, Error: "no update available"}
	}

	stagingDir, err := h.service.DownloadUpdate(h.lastUpdate.Release, func(stage, fileName string, bytesDone, bytesTotal int64) {
		runtime.EventsEmit(ctx, "update:progress", types.UpdateProgress{
			Stage:      stage,
			FileName:   fileName,
			BytesDone:  bytesDone,
			BytesTotal: bytesTotal,
		})
	})
	if err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}

	h.lastStagingDir = stagingDir
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *UpdateHandler) ApplyUpdate() types.APIResponse[bool] {
	if h.rt.Context() == nil {
		return types.APIResponse[bool]{Success: false, Error: "the application context is not ready yet"}
	}

	if h.lastStagingDir == "" {
		return types.APIResponse[bool]{Success: false, Error: "the update has not been downloaded yet"}
	}

	if err := h.service.ApplyUpdate(h.lastStagingDir); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}

	h.rt.QuitApp()

	return types.APIResponse[bool]{Success: true, Data: true}
}

func toUpdateFileEntries(files []ota.File) []types.UpdateFileEntry {
	out := make([]types.UpdateFileEntry, len(files))
	for i, f := range files {
		out[i] = types.UpdateFileEntry{Path: f.Path, URLs: append([]string(nil), f.URLs...), SHA256: f.SHA256, Size: f.Size}
	}
	return out
}
