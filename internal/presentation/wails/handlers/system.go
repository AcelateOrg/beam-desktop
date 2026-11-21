package handlers

import (
	goruntime "runtime"

	"beam-app/internal/application/system"
	"beam-app/internal/platform"
	"beam-app/internal/presentation/wails/dto"
	"beam-bridge/core/types"
)

type BuildMetadata struct {
	Version string
	Variant string
	Hash    string
}

type SystemHandler struct {
	protocolService *system.ProtocolService
	targetService   *system.TargetService
	build           BuildMetadata
}

func NewSystemHandler(
	protocolService *system.ProtocolService,
	targetService *system.TargetService,
	build BuildMetadata,
) *SystemHandler {
	return &SystemHandler{
		protocolService: protocolService,
		targetService:   targetService,
		build:           build,
	}
}

func (h *SystemHandler) GetBuildInfo() types.APIResponse[types.BuildInfo] {
	return types.APIResponse[types.BuildInfo]{
		Success: true,
		Data: types.BuildInfo{
			Version:   h.build.Version,
			Variant:   h.build.Variant,
			BuildHash: h.build.Hash,
			IsDev:     platform.IsDevBuild(),
			BetaTag:   platform.GetBetaTag(),
			OS:        goruntime.GOOS,
		},
	}
}

func (h *SystemHandler) RevealInFolder(path string) types.APIResponse[bool] {
	if err := platform.RevealFile(path); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SystemHandler) OpenLogsFolder() types.APIResponse[bool] {
	if err := platform.OpenFolder(platform.GetLogsDir()); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SystemHandler) IsProtocolHandlerEnabled() types.APIResponse[bool] {
	return types.APIResponse[bool]{Success: true, Data: h.protocolService.IsEnabled()}
}

func (h *SystemHandler) EnableProtocolHandler() types.APIResponse[bool] {
	if err := h.protocolService.Enable(); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SystemHandler) DisableProtocolHandler() types.APIResponse[bool] {
	if err := h.protocolService.Disable(); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *SystemHandler) FixProtocolHandler() types.APIResponse[string] {
	path, err := h.protocolService.Fix()
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[string]{Success: true, Data: path}
}

func (h *SystemHandler) GetPendingOpenTargets() types.APIResponse[[]string] {
	targets := h.targetService.GetPending()
	return types.APIResponse[[]string]{Success: true, Data: targets}
}

func (h *SystemHandler) HandleExternalTarget(target string) types.APIResponse[*dto.ProfileData] {
	prof, err := h.targetService.Handle(target)
	if err != nil {
		return types.APIResponse[*dto.ProfileData]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[*dto.ProfileData]{Success: true, Data: dto.ToProfileData(prof)}
}
