package handlers

import (
	"beam-app/internal/presentation/wails/dto"
	"beam-bridge/core/profile"
	"beam-bridge/core/types"
)

// CheckProTunConflicts finds the contradictions of the graph open in the
// editor, so they are highlighted long before a connect attempt fails.
func (h *SettingsHandler) CheckProTunConflicts(graph types.ProTunGraph) types.APIResponse[[]types.ProTunConflict] {
	return types.APIResponse[[]types.ProTunConflict]{Success: true, Data: profile.DetectProTunConflicts(graph)}
}

// GetProTunRuleOrder lists the rules of the graph open in the editor in the
// order they are checked, so the editor shows the real priority of each card.
func (h *SettingsHandler) GetProTunRuleOrder(graph types.ProTunGraph) types.APIResponse[[]types.ProTunRuleInfo] {
	return types.APIResponse[[]types.ProTunRuleInfo]{Success: true, Data: profile.ProTunRuleOrder(graph)}
}

// proTunSources feed the per-profile ProTun layers.
type proTunSources struct {
	profiles func() ([]*types.Profile, error)
	activeID func() string
	preset   func(profileID string) (*types.ProTunGraph, bool)
}

// SetProTunProfiles wires the profile sources of the ProTun layers. A plain
// function, not a method, so Wails does not expose it to the frontend.
func SetProTunProfiles(
	h *SettingsHandler,
	profiles func() ([]*types.Profile, error),
	activeID func() string,
	preset func(profileID string) (*types.ProTunGraph, bool),
) {
	h.protun = proTunSources{profiles: profiles, activeID: activeID, preset: preset}
}

const proTunLockedError = "Правила этого профиля задаёт провайдер — редактирование недоступно"

func (h *SettingsHandler) profilePreset(profileID string) (*types.ProTunGraph, bool) {
	if h.protun.preset == nil {
		return nil, false
	}
	return h.protun.preset(profileID)
}

// GetProTunScopes lists the layers of the ProTun scope switcher: the global
// one and one per profile.
func (h *SettingsHandler) GetProTunScopes() types.APIResponse[dto.ProTunScopesData] {
	global := h.service.GetProTunGraph()
	data := dto.ProTunScopesData{
		Global:   len(global.Nodes) > 0,
		Profiles: []dto.ProTunScopeData{},
	}
	if h.protun.activeID != nil {
		data.ActiveID = h.protun.activeID()
	}
	if h.protun.profiles == nil {
		return types.APIResponse[dto.ProTunScopesData]{Success: true, Data: data}
	}
	profiles, err := h.protun.profiles()
	if err != nil {
		return types.APIResponse[dto.ProTunScopesData]{Success: false, Error: err.Error()}
	}

	owned := h.service.ProTunProfileIDs()
	known := make(map[string]bool, len(profiles))
	for _, p := range profiles {
		if p == nil {
			continue
		}
		known[p.ID] = true
		preset, locked := h.profilePreset(p.ID)
		data.Profiles = append(data.Profiles, dto.ProTunScopeData{
			ID:        p.ID,
			Name:      p.Name,
			HasRules:  owned[p.ID],
			HasPreset: preset != nil,
			Locked:    locked && preset != nil,
			Active:    p.ID == data.ActiveID,
		})
	}
	// Layers of deleted profiles are dead weight in settings.json.
	for id := range owned {
		if !known[id] {
			_ = h.service.SaveProTunProfileGraph(id, nil)
		}
	}
	return types.APIResponse[dto.ProTunScopesData]{Success: true, Data: data}
}

// GetProTunLayer returns the graph of a layer: scope "" is the global layer,
// otherwise a profile ID. A profile without its own rules shows the
// provider's preset; a locked preset always wins.
func (h *SettingsHandler) GetProTunLayer(scope string) types.APIResponse[dto.ProTunLayerData] {
	if scope == "" {
		return types.APIResponse[dto.ProTunLayerData]{
			Success: true,
			Data:    dto.ProTunLayerData{Graph: h.service.GetProTunGraph()},
		}
	}
	graph, ok := h.service.GetProTunProfileGraph(scope)
	if !ok {
		graph = types.DefaultProTunGraph()
	}
	data := dto.ProTunLayerData{Graph: graph}
	if preset, locked := h.profilePreset(scope); preset != nil {
		if locked || len(graph.Nodes) == 0 {
			data.Graph = *preset
			data.Preset = true
			data.Locked = locked
		}
	}
	return types.APIResponse[dto.ProTunLayerData]{Success: true, Data: data}
}

// SaveProTunLayer stores the graph of a layer (see GetProTunLayer). An empty
// profile graph removes the layer.
func (h *SettingsHandler) SaveProTunLayer(scope string, graph types.ProTunGraph) types.APIResponse[bool] {
	var err error
	if scope == "" {
		err = h.service.SaveProTunGraph(graph)
	} else {
		if preset, locked := h.profilePreset(scope); locked && preset != nil {
			return types.APIResponse[bool]{Success: false, Error: proTunLockedError}
		}
		err = h.service.SaveProTunProfileGraph(scope, &graph)
	}
	if err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}
