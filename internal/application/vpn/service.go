package vpn

import (
	"errors"

	oldVPN "beam-bridge/core/vpn"
	"beam-bridge/core/types"
)

type Service struct {
	manager *oldVPN.Manager
}

func NewService(manager *oldVPN.Manager) *Service {
	return &Service{
		manager: manager,
	}
}

func (s *Service) Connect() error {
	return s.manager.Connect()
}

func (s *Service) Disconnect() error {
	return s.manager.Disconnect()
}

func (s *Service) KillSwitchState() types.KillSwitchState {
	return s.manager.KillSwitchState()
}

func (s *Service) ReleaseKillSwitch() error {
	return s.manager.ReleaseKillSwitch()
}

func (s *Service) GetStatus() types.VPNStatus {
	return s.manager.GetStatus()
}

func (s *Service) GetStats() types.ConnectionStats {
	return s.manager.GetStats()
}

func (s *Service) GetLogs(afterID int64, limit int) []types.LogEntry {
	if limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	logBuffer := s.manager.GetLogBuffer()
	if logBuffer == nil {
		return []types.LogEntry{}
	}

	var logs []types.LogEntry
	if afterID > 0 {
		logs = logBuffer.GetSince(afterID, limit)
	} else {
		logs = logBuffer.GetFiltered("", "", limit)
	}

	if logs == nil {
		logs = []types.LogEntry{}
	}

	return logs
}

func (s *Service) GetActiveConnections() ([]types.ActiveConnection, error) {
	return s.manager.GetActiveConnections()
}

func (s *Service) CloseConnections(ids []string) int {
	return s.manager.CloseConnections(ids)
}

func (s *Service) GetActiveConfig() (string, error) {
	raw := s.manager.GetActiveConfigJSON()
	if raw == nil {
		return "", errors.New("no active profile")
	}
	return string(raw), nil
}

func (s *Service) ClearLogs() {
	logBuffer := s.manager.GetLogBuffer()
	if logBuffer != nil {
		logBuffer.Clear()
	}
}
