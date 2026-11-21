package profile

import (
	"encoding/base64"
	"time"

	infraProfile "beam-bridge/core/infrastructure/persistence/profile"
	"beam-bridge/core/profile"
	"beam-bridge/core/types"
)

type Service struct {
	repo       *infraProfile.FileRepository
	manager    *profile.Manager
	vpnStatus  func() types.VPNStatus
	vpnRestart func()
}

func NewService(repo *infraProfile.FileRepository, manager *profile.Manager) *Service {
	return &Service{
		repo:    repo,
		manager: manager,
	}
}

// SetPingObserver wires a callback that receives every ping result as soon as
// it is measured (see Manager.SetPingObserver).
func (s *Service) SetPingObserver(fn func(profile.PingResult)) {
	s.manager.SetPingObserver(fn)
}

func (s *Service) SetVPNStatusProvider(fn func() types.VPNStatus) {
	s.vpnStatus = fn
}

// SetVPNRestarter wires the live-session reload. The VPN manager decides
// itself whether a session is wanted; the call never blocks.
func (s *Service) SetVPNRestarter(fn func()) {
	s.vpnRestart = fn
}

func (s *Service) restartLiveVPN() {
	if s.vpnRestart != nil {
		s.vpnRestart()
	}
}

func (s *Service) GetAll() ([]types.ProfileSummary, error) {
	return s.manager.GetProfiles(), nil
}

func (s *Service) GetActive() (*types.Profile, error) {
	return s.manager.GetActiveProfile(), nil
}

func (s *Service) SetActive(id string) error {
	if err := s.manager.SetActive(id); err != nil {
		return err
	}
	s.restartLiveVPN()
	return nil
}

func (s *Service) Delete(id string) error {
	return s.manager.Delete(id)
}

func (s *Service) ImportFromURL(url string) (*types.Profile, error) {
	return s.manager.ImportFromURL(url)
}

func (s *Service) ImportFromBeam(data []byte) (*types.Profile, error) {
	return s.manager.ImportFromBeam(data)
}

func (s *Service) Refresh(id string) error {
	return s.manager.RefreshProfile(id)
}

func (s *Service) SetAutoRefresh(profileID string, disabled bool) error {
	return s.manager.SetAutoRefresh(profileID, disabled)
}

func (s *Service) SetUpdateIntervalOverride(profileID string, hours int) error {
	return s.manager.SetUpdateIntervalOverride(profileID, hours)
}

// ExportBytes отдаёт профиль в открытом .beam (v2). Запись шифрованных
// файлов (v3) убрана: псевдозащита паролем только путала пользователей.
// Чтение старых v3 при импорте остаётся до следующей мажорной версии.
func (s *Service) ExportBytes(id string) ([]byte, error) {
	return s.manager.ExportBeam(id)
}

func (s *Service) Export(id string) (string, error) {
	data, err := s.ExportBytes(id)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

func (s *Service) ExportRawLinks(id string) ([]types.ExportedLink, error) {
	return s.manager.ExportRawLinks(id)
}

func (s *Service) ImportRawConfig(name string, configJSON string) (*types.Profile, error) {
	return s.manager.ImportRawConfig(name, configJSON)
}

func (s *Service) GetNodes(profileID string) (*types.ProfileNodesResponse, error) {
	return s.manager.GetProfileNodes(profileID)
}

func (s *Service) SelectNode(profileID, nodeID string) error {
	if err := s.manager.SelectProfileNode(profileID, nodeID); err != nil {
		return err
	}
	s.restartLiveVPN()
	return nil
}

func (s *Service) GetNodeConfig(profileID, nodeID string) (*types.NodeConfig, error) {
	return s.manager.GetNodeConfig(profileID, nodeID)
}

func (s *Service) UpdateNodeConfig(profileID, nodeID string, update types.NodeConfigUpdate) (*types.NodeConfig, error) {
	return s.manager.UpdateNodeConfig(profileID, nodeID, update)
}

func (s *Service) isActiveProfileLive(profileID string) bool {
	if s.vpnStatus == nil {
		return false
	}
	if status := s.vpnStatus(); status != types.StatusConnected && status != types.StatusConnectedNoInternet {
		return false
	}
	active := s.manager.GetActiveProfile()
	return active != nil && active.ID == profileID
}

func (s *Service) PingNodes(profileID string, nodeIDs []string) ([]profile.PingResult, error) {
	return s.manager.PingProfileNodes(profileID, nodeIDs, 5*time.Second, s.isActiveProfileLive(profileID))
}

func (s *Service) PingCategoryNodes(profileID string, categoryID string) ([]profile.PingResult, error) {
	return s.manager.PingCategoryNodes(profileID, categoryID, 5*time.Second, s.isActiveProfileLive(profileID))
}
