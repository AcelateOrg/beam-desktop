// Package ota describes Beam's over-the-air update feed: signed JSON files
// served under https://ota-updates.acelate.com.
//
// Layout (schema v1):
//
//	/v1/channels/{channel}/{os}-{arch}.json      Pointer: what is current
//	/v1/releases/{os}-{arch}/{version}.json      Release: full, immutable
//	/v1/assets/{tag}/{asset}                     a downloadable file
//	/v1/schema/{pointer,release}.schema.json     JSON Schema of both files
//
// Everything is stored as GitHub Release assets of tag v{version} (see
// PointerAssetName, ReleaseAssetName); a tiny stateless proxy (ota-proxy/)
// maps the paths above onto them, so the repository itself may stay private.
// The proxy is not trusted: the client checks every signature itself.
//
// Every JSON file has a detached ed25519 signature next to it ({file}.sig,
// base64 of the raw signature over the exact file bytes). The client only
// trusts files signed by a key from TrustedPublicKeys.
//
// The Go types below are the source of truth; the JSON Schema files in
// schema/ mirror them for editors and are published with the feed.
package ota

import "time"

const (
	// SchemaVersion of the files this client reads and writes. A breaking
	// change gets a new path prefix (/v2/...) so old clients keep reading v1.
	SchemaVersion = 1

	// DefaultBaseURL hosts the feed. Hardcoded on purpose: the old updater
	// took it from a build-time env var and silently shipped builds with
	// updates disabled whenever the variable got lost.
	DefaultBaseURL = "https://ota-updates.acelate.com"

	DefaultChannel = "stable"

	KindPointer = "beam.ota.pointer"
	KindRelease = "beam.ota.release"

	// SignatureSuffix is appended to a file path to get its signature.
	SignatureSuffix = ".sig"

	pathPrefix = "/v1"
)

// Pointer says which version is current for one channel + target. It is the
// only file that changes in place; it is small and read on every check.
type Pointer struct {
	JSONSchema    string    `json:"$schema,omitempty"`
	SchemaVersion int       `json:"schemaVersion"`
	Kind          string    `json:"kind"`
	Channel       string    `json:"channel"`
	Target        string    `json:"target"`
	Version       string    `json:"version"`
	Manifest      string    `json:"manifest"`
	PublishedAt   time.Time `json:"publishedAt"`
}

// Release is the full description of one version for one target. Once
// published it never changes: a fix is a new version.
type Release struct {
	JSONSchema    string    `json:"$schema,omitempty"`
	SchemaVersion int       `json:"schemaVersion"`
	Kind          string    `json:"kind"`
	Target        string    `json:"target"`
	Version       string    `json:"version"`
	ReleasedAt    time.Time `json:"releasedAt"`
	// Mandatory: the user cannot postpone this update.
	Mandatory bool `json:"mandatory"`
	// MinSupportedVersion: installs older than this must update (treated as
	// mandatory for them). Empty means no floor.
	MinSupportedVersion string `json:"minSupportedVersion,omitempty"`
	// Notes: changelog lines per language code ("ru", "en").
	Notes map[string][]string `json:"notes"`
	Files []File              `json:"files"`
}

// File is one file of the update.
type File struct {
	// Path is where the file goes, relative to the install dir, with forward
	// slashes ("Beam.exe", "BeamRelay.exe"). On macOS it is the bundle zip.
	Path   string `json:"path"`
	Size   int64  `json:"size"`
	SHA256 string `json:"sha256"`
	// URLs are mirrors of the same bytes, tried in order.
	URLs []string `json:"urls"`
}

// SchemaURL is the public location of a published JSON Schema file.
func SchemaURL(baseURL, name string) string {
	return trimSlash(baseURL) + pathPrefix + "/schema/" + name
}

const (
	PointerSchemaFile = "pointer.schema.json"
	ReleaseSchemaFile = "release.schema.json"
)

// PointerPath is the site path of the pointer for channel + target.
func PointerPath(channel string, target Target) string {
	return pathPrefix + "/channels/" + channel + "/" + target.String() + ".json"
}

// ReleasePath is the site path of the release manifest for target + version.
func ReleasePath(target Target, version string) string {
	return pathPrefix + "/releases/" + target.String() + "/" + version + ".json"
}

// ReleaseTag is the GitHub release that holds every file of a version.
func ReleaseTag(version string) string { return "v" + version }

// PointerAssetName is the release asset served at PointerPath. The proxy
// answers PointerPath with this asset from the newest (highest version)
// published release that has it, so unpublishing a release rolls back.
func PointerAssetName(channel string, target Target) string {
	return "ota-pointer-" + channel + "-" + target.String() + ".json"
}

// ReleaseAssetName is the asset of release ReleaseTag(version) served at
// ReleasePath(target, version).
func ReleaseAssetName(target Target) string {
	return "ota-release-" + target.String() + ".json"
}

// AssetURL is the download URL of a release asset behind the proxy.
func AssetURL(baseURL, tag, asset string) string {
	return trimSlash(baseURL) + pathPrefix + "/assets/" + tag + "/" + asset
}

func trimSlash(s string) string {
	for len(s) > 0 && s[len(s)-1] == '/' {
		s = s[:len(s)-1]
	}
	return s
}
