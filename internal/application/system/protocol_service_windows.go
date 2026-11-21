//go:build windows

package system

import (
	"fmt"
	"os"
	"path/filepath"

	"beam-app/internal/platform"

	"golang.org/x/sys/windows/registry"
)

type ProtocolService struct{}

func NewProtocolService() *ProtocolService {
	return &ProtocolService{}
}

func targetExePath() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to resolve exe path: %w", err)
	}
	if platform.IsDevBuild() {
		return exePath, nil
	}
	relay := filepath.Join(filepath.Dir(exePath), "BeamRelay.exe")
	if _, err := os.Stat(relay); err == nil {
		return relay, nil
	}
	return exePath, nil
}

func (s *ProtocolService) Enable() error {
	exePath, err := targetExePath()
	if err != nil {
		return err
	}

	key, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Classes\beam`, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer key.Close()

	key.SetStringValue("", "URL:Beam Protocol")
	key.SetStringValue("URL Protocol", "")

	cmdKey, _, err := registry.CreateKey(key, `shell\open\command`, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer cmdKey.Close()

	return cmdKey.SetStringValue("", `"`+exePath+`" "%1"`)
}

func (s *ProtocolService) Disable() error {
	_ = registry.DeleteKey(registry.CURRENT_USER, `Software\Classes\beam\shell\open\command`)
	_ = registry.DeleteKey(registry.CURRENT_USER, `Software\Classes\beam\shell\open`)
	_ = registry.DeleteKey(registry.CURRENT_USER, `Software\Classes\beam\shell`)
	_ = registry.DeleteKey(registry.CURRENT_USER, `Software\Classes\beam`)
	return nil
}

func (s *ProtocolService) IsEnabled() bool {
	key, err := registry.OpenKey(registry.CURRENT_USER, `Software\Classes\beam\shell\open\command`, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer key.Close()
	val, _, err := key.GetStringValue("")
	return err == nil && val != ""
}

func (s *ProtocolService) Fix() (string, error) {
	exePath, err := targetExePath()
	if err != nil {
		return "", err
	}
	s.Disable()
	if err := s.Enable(); err != nil {
		return "", err
	}
	return exePath, nil
}
