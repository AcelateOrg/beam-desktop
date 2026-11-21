package platform

import "strings"

// betaTag marks a closed-beta build ("FD1" - For Developers, first). Empty
// means a stable build. It is set at build time (-X main.betaTag=...), shown
// next to the version on the About page and does not affect the version
// itself, so updates keep comparing plain versions.
var betaTag string

const maxBetaTagLen = 16

func SetBetaTag(tag string) {
	tag = strings.Join(strings.Fields(tag), "")
	if len(tag) > maxBetaTagLen {
		tag = tag[:maxBetaTagLen]
	}
	betaTag = tag
}

func GetBetaTag() string {
	return betaTag
}
