package platform

import (
	"testing"

	corePlatform "beam-bridge/core/platform"
)

func TestInstallCoreBridgePopulatesEnvironmentInfo(t *testing.T) {
	InstallCoreBridge()

	values := []struct {
		name    string
		core    func() string
		desktop func() string
	}{
		{"app version", corePlatform.GetAppVersion, GetAppVersion},
		{"os version", corePlatform.GetOSVersion, GetOSVersion},
		{"locale", corePlatform.GetSystemLocale, GetSystemLocale},
		{"os label", corePlatform.DeviceOSLabel, DeviceOSLabel},
	}

	for _, value := range values {
		got, want := value.core(), value.desktop()
		if got != want {
			t.Errorf("%s: core sees %q, desktop sees %q", value.name, got, want)
		}
		if got == "" {
			t.Errorf("%s: empty - implementation was not installed", value.name)
		}
	}

	if _, err := corePlatform.ListRunningApplications(); err != nil {
		t.Errorf("ListRunningApplications returned an error: %v", err)
	}
}
