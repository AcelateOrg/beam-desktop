//go:build darwin

package system

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type ProtocolService struct{}

func NewProtocolService() *ProtocolService {
	return &ProtocolService{}
}

func (s *ProtocolService) IsEnabled() bool {
	bundle, err := macBundlePath()
	if err != nil {
		return false
	}
	plist, err := os.ReadFile(filepath.Join(bundle, "Contents", "Info.plist"))
	if err != nil {
		return false
	}
	return strings.Contains(string(plist), "beam")
}

const lsregisterPath = "/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister"

func (s *ProtocolService) Enable() error {
	bundle, err := macBundlePath()
	if err != nil {
		return nil
	}
	return exec.Command(lsregisterPath, "-f", bundle).Run()
}

func (s *ProtocolService) Disable() error { return nil }

func (s *ProtocolService) Fix() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to resolve path: %w", err)
	}
	_ = s.Enable()
	return exe, nil
}

func macBundlePath() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	exe, err = filepath.EvalSymlinks(exe)
	if err != nil {
		return "", err
	}
	for dir := filepath.Dir(exe); dir != "/" && dir != "."; dir = filepath.Dir(dir) {
		if strings.HasSuffix(dir, ".app") {
			return dir, nil
		}
	}
	return "", fmt.Errorf("not running from a .app bundle")
}
