package handlers

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"beam-app/internal/application/profile"
	"beam-app/internal/presentation/wails/dto"
	oldProfile "beam-bridge/core/profile"
	"beam-bridge/core/types"
)

type ProfileHandler struct {
	service *profile.Service
	rt      *Runtime
}

func NewProfileHandler(service *profile.Service, rt *Runtime) *ProfileHandler {
	// Ping results stream to the UI one by one, so finished servers show up
	// while the rest are still being measured.
	service.SetPingObserver(func(result oldProfile.PingResult) {
		if ctx := rt.Context(); ctx != nil {
			runtime.EventsEmit(ctx, "ping:result", result)
		}
	})
	return &ProfileHandler{service: service, rt: rt}
}

func (h *ProfileHandler) GetProfiles() types.APIResponse[[]types.ProfileSummary] {
	profiles, err := h.service.GetAll()
	if err != nil {
		return types.APIResponse[[]types.ProfileSummary]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[[]types.ProfileSummary]{Success: true, Data: profiles}
}

func (h *ProfileHandler) GetActiveProfile() types.APIResponse[*dto.ProfileData] {
	prof, err := h.service.GetActive()
	if err != nil {
		return types.APIResponse[*dto.ProfileData]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*dto.ProfileData]{Success: true, Data: dto.ToProfileData(prof)}
}

func (h *ProfileHandler) SetActiveProfile(id string) types.APIResponse[bool] {
	if err := h.service.SetActive(id); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *ProfileHandler) DeleteProfile(id string) types.APIResponse[bool] {
	if err := h.service.Delete(id); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *ProfileHandler) ImportFromURL(url string) types.APIResponse[*dto.ProfileData] {
	prof, err := h.service.ImportFromURL(url)
	if err != nil {
		return types.APIResponse[*dto.ProfileData]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*dto.ProfileData]{Success: true, Data: dto.ToProfileData(prof)}
}

func (h *ProfileHandler) ImportFromBeam(data []byte) types.APIResponse[*dto.ProfileData] {
	prof, err := h.service.ImportFromBeam(data)
	if err != nil {
		return types.APIResponse[*dto.ProfileData]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*dto.ProfileData]{Success: true, Data: dto.ToProfileData(prof)}
}

func (h *ProfileHandler) RefreshProfile(id string) types.APIResponse[bool] {
	if err := h.service.Refresh(id); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *ProfileHandler) SetProfileAutoRefresh(id string, disabled bool) types.APIResponse[bool] {
	if err := h.service.SetAutoRefresh(id, disabled); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *ProfileHandler) SetProfileUpdateInterval(id string, hours int) types.APIResponse[bool] {
	if err := h.service.SetUpdateIntervalOverride(id, hours); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *ProfileHandler) ExportProfile(id string) types.APIResponse[string] {
	data, err := h.service.Export(id)
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[string]{Success: true, Data: data}
}

func (h *ProfileHandler) ExportProfileRawLinks(id string) types.APIResponse[[]types.ExportedLink] {
	links, err := h.service.ExportRawLinks(id)
	if err != nil {
		return types.APIResponse[[]types.ExportedLink]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[[]types.ExportedLink]{Success: true, Data: links}
}

func (h *ProfileHandler) SaveProfileBeamFile(id string, suggestedName string) types.APIResponse[string] {
	ctx := h.rt.Context()
	if ctx == nil {
		return types.APIResponse[string]{Success: false, Error: "the application context is not ready yet"}
	}

	data, err := h.service.ExportBytes(id)
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}

	path, err := runtime.SaveFileDialog(ctx, runtime.SaveDialogOptions{
		Title:                "Save profile",
		DefaultFilename:      ensureExt(suggestedName, ".beam"),
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{DisplayName: "Beam profile (*.beam)", Pattern: "*.beam"},
			{DisplayName: "All files", Pattern: "*.*"},
		},
	})
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	if path == "" {
		return types.APIResponse[string]{Success: true, Data: ""}
	}

	path = ensureExt(path, ".beam")

	if err := os.WriteFile(path, data, 0600); err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}

	return types.APIResponse[string]{Success: true, Data: path}
}

func (h *ProfileHandler) SaveProfileLinksFile(id string, suggestedName string) types.APIResponse[string] {
	ctx := h.rt.Context()
	if ctx == nil {
		return types.APIResponse[string]{Success: false, Error: "the application context is not ready yet"}
	}

	links, err := h.service.ExportRawLinks(id)
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	if len(links) == 0 {
		return types.APIResponse[string]{Success: false, Error: "this profile has no saved links"}
	}

	lines := make([]string, 0, len(links))
	for _, item := range links {
		lines = append(lines, item.Link)
	}

	path, err := runtime.SaveFileDialog(ctx, runtime.SaveDialogOptions{
		Title:                "Save links",
		DefaultFilename:      ensureExt(suggestedName, ".txt"),
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{DisplayName: "Text file (*.txt)", Pattern: "*.txt"},
			{DisplayName: "All files", Pattern: "*.*"},
		},
	})
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	if path == "" {
		return types.APIResponse[string]{Success: true, Data: ""}
	}

	path = ensureExt(path, ".txt")

	if err := os.WriteFile(path, []byte(strings.Join(lines, "\r\n")), 0600); err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}

	return types.APIResponse[string]{Success: true, Data: path}
}

func ensureExt(name string, ext string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		name = "Profile"
	}
	if strings.EqualFold(filepath.Ext(name), ext) {
		return name
	}
	return name + ext
}

func (h *ProfileHandler) ImportRawConfig(name string, configJSON string) types.APIResponse[*dto.ProfileData] {
	prof, err := h.service.ImportRawConfig(name, configJSON)
	if err != nil {
		return types.APIResponse[*dto.ProfileData]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*dto.ProfileData]{Success: true, Data: dto.ToProfileData(prof)}
}

func (h *ProfileHandler) GetProfileNodes(id string) types.APIResponse[*types.ProfileNodesResponse] {
	response, err := h.service.GetNodes(id)
	if err != nil {
		return types.APIResponse[*types.ProfileNodesResponse]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*types.ProfileNodesResponse]{Success: true, Data: response}
}

func (h *ProfileHandler) SelectProfileNode(profileID, nodeID string) types.APIResponse[bool] {
	if err := h.service.SelectNode(profileID, nodeID); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *ProfileHandler) GetNodeConfig(profileID, nodeID string) types.APIResponse[*types.NodeConfig] {
	config, err := h.service.GetNodeConfig(profileID, nodeID)
	if err != nil {
		return types.APIResponse[*types.NodeConfig]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*types.NodeConfig]{Success: true, Data: config}
}

func (h *ProfileHandler) UpdateNodeConfig(profileID, nodeID, name, overridesJSON string, pinned bool) types.APIResponse[*types.NodeConfig] {
	update := types.NodeConfigUpdate{Name: name, Pinned: pinned}

	if overridesJSON != "" {
		if err := json.Unmarshal([]byte(overridesJSON), &update.Overrides); err != nil {
			return types.APIResponse[*types.NodeConfig]{Success: false, Error: "invalid changes: " + err.Error()}
		}
	}

	config, err := h.service.UpdateNodeConfig(profileID, nodeID, update)
	if err != nil {
		return types.APIResponse[*types.NodeConfig]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*types.NodeConfig]{Success: true, Data: config}
}

func (h *ProfileHandler) PingProfileNodes(profileID string, nodeIDs []string) types.APIResponse[[]oldProfile.PingResult] {
	results, err := h.service.PingNodes(profileID, nodeIDs)
	if err != nil {
		return types.APIResponse[[]oldProfile.PingResult]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[[]oldProfile.PingResult]{Success: true, Data: results}
}

func (h *ProfileHandler) PingCategoryNodes(profileID string, categoryID string) types.APIResponse[[]oldProfile.PingResult] {
	results, err := h.service.PingCategoryNodes(profileID, categoryID)
	if err != nil {
		return types.APIResponse[[]oldProfile.PingResult]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[[]oldProfile.PingResult]{Success: true, Data: results}
}
