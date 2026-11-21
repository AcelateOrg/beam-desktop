package platform

import (
	corePlatform "beam-bridge/core/platform"
)

func InstallCoreBridge() {
	corePlatform.Install(corePlatform.Provider{
		LogCrashEvent:           LogCrashEvent,
		RecoverAndLog:           RecoverAndLog,
		GetAppVersion:           GetAppVersion,
		GetOSVersion:            GetOSVersion,
		GetSystemLocale:         GetSystemLocale,
		DeviceOSLabel:           DeviceOSLabel,
		IsDevBuild:              IsDevBuild,
		ListRunningApplications: ListRunningApplications,
	})
}
