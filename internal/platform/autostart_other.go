//go:build !windows && !linux

package platform

func IsAutoStartLaunch(args []string) bool {
	return false
}

func IsLaunchOnStartupEnabled(appName string) (bool, error) {
	return false, nil
}

func SetLaunchOnStartup(appName string, enabled bool) error {
	return nil
}
