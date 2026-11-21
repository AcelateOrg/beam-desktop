package dto

import "beam-bridge/core/types"

// ProTunScopeData is one entry of the ProTun scope switcher: a profile and
// the state of its routing layer.
type ProTunScopeData struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	// HasRules: the user has their own layer for the profile.
	HasRules bool `json:"hasRules"`
	// HasPreset: the provider ships routing with the profile.
	HasPreset bool `json:"hasPreset"`
	Locked    bool `json:"locked"`
	Active    bool `json:"active"`
}

type ProTunScopesData struct {
	ActiveID string            `json:"activeId"`
	Global   bool              `json:"global"` // the global layer has rules
	Profiles []ProTunScopeData `json:"profiles"`
}

// ProTunLayerData is the graph of one layer. Preset: the graph shown is the
// provider's preset (the user has no own layer yet, or it is locked).
type ProTunLayerData struct {
	Graph  types.ProTunGraph `json:"graph"`
	Locked bool              `json:"locked"`
	Preset bool              `json:"preset"`
}
