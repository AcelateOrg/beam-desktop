package platform

var appVersion = "dev"

func SetAppVersion(v string) {
	if v != "" {
		appVersion = v
	}
}

func GetAppVersion() string {
	return appVersion
}
