package handlers

import (
	"fmt"
	goruntime "runtime"
	"runtime/debug"

	"beam-app/internal/application/vpn"
	"beam-app/internal/platform"
	"beam-bridge/core/types"
)

type VPNHandler struct {
	service *vpn.Service
}

func NewVPNHandler(service *vpn.Service) *VPNHandler {
	return &VPNHandler{service: service}
}

func (h *VPNHandler) Connect() (result types.APIResponse[bool]) {
	defer func() {
		r := recover()
		if r == nil {
			return
		}
		buf := make([]byte, 32<<10)
		n := goruntime.Stack(buf, false)
		platform.LogCrashEvent("panic in VPNHandler.Connect: %v\n%s", r, buf[:n])
		result = types.APIResponse[bool]{Success: false, Error: fmt.Sprintf("internal error: %v", r)}
	}()
	if err := h.service.Connect(); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *VPNHandler) Disconnect() types.APIResponse[bool] {
	if err := h.service.Disconnect(); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	go debug.FreeOSMemory()
	return types.APIResponse[bool]{Success: true, Data: true}
}

// GetKillSwitchState — включён ли Kill Switch и не поставил ли он интернет на паузу.
func (h *VPNHandler) GetKillSwitchState() types.KillSwitchState {
	return h.service.KillSwitchState()
}

// ReleaseKillSwitch — кнопка «Вернуть интернет».
func (h *VPNHandler) ReleaseKillSwitch() types.APIResponse[bool] {
	if err := h.service.ReleaseKillSwitch(); err != nil {
		return types.APIResponse[bool]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *VPNHandler) GetStatus() string {
	return string(h.service.GetStatus())
}

func (h *VPNHandler) GetStats() types.ConnectionStats {
	return h.service.GetStats()
}

func (h *VPNHandler) GetLogs(afterID int64, limit int) types.APIResponse[[]types.LogEntry] {
	logs := h.service.GetLogs(afterID, limit)
	return types.APIResponse[[]types.LogEntry]{
		Success: true,
		Data:    logs,
	}
}

func (h *VPNHandler) GetActiveConnections() types.APIResponse[[]types.ActiveConnection] {
	conns, err := h.service.GetActiveConnections()
	if err != nil {
		return types.APIResponse[[]types.ActiveConnection]{
			Success: false,
			Data:    []types.ActiveConnection{},
			Error:   err.Error(),
		}
	}
	if conns == nil {
		conns = []types.ActiveConnection{}
	}
	return types.APIResponse[[]types.ActiveConnection]{
		Success: true,
		Data:    conns,
	}
}

// CloseConnections разрывает соединения по ID и возвращает, сколько закрыто.
func (h *VPNHandler) CloseConnections(ids []string) types.APIResponse[int] {
	return types.APIResponse[int]{Success: true, Data: h.service.CloseConnections(ids)}
}

func (h *VPNHandler) ClearLogs() types.APIResponse[bool] {
	h.service.ClearLogs()
	return types.APIResponse[bool]{Success: true, Data: true}
}

func (h *VPNHandler) GetActiveConfig() types.APIResponse[string] {
	config, err := h.service.GetActiveConfig()
	if err != nil {
		return types.APIResponse[string]{Success: false, Error: err.Error()}
	}
	return types.APIResponse[string]{Success: true, Data: config}
}
