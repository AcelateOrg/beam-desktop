package platform

var buildVariant = "dev"

func SetBuildVariant(v string) {
	if v == "release" {
		buildVariant = "release"
	} else {
		buildVariant = "dev"
	}
}

func IsDevBuild() bool { return buildVariant != "release" }

func variantSuffix() string {
	if buildVariant == "release" {
		return ""
	}
	return "-Dev"
}
