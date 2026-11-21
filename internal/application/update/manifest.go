package update

import (
	"os"
	"runtime"
	"strings"

	"beam-app/internal/application/update/ota"
)

type ProgressFunc func(stage, fileName string, bytesDone, bytesTotal int64)

// baseURL of the OTA feed. Hardcoded (see ota.DefaultBaseURL); the
// BEAM_OTA_BASE_URL env var points a build at a test feed. Signatures are
// checked either way, so the override cannot smuggle in foreign updates.
var baseURL = ota.DefaultBaseURL

type Service struct {
	baseURL   string
	channel   string
	userAgent string
}

func NewService(currentVersion string) *Service {
	url := baseURL
	if v := strings.TrimSpace(os.Getenv("BEAM_OTA_BASE_URL")); v != "" {
		url = v
	}
	return &Service{
		baseURL:   url,
		channel:   ota.DefaultChannel,
		userAgent: "Beam/" + currentVersion + " (" + runtime.GOOS + "; " + runtime.GOARCH + ")",
	}
}

// Update is a release newer than the running build.
type Update struct {
	Release *ota.Release
	// Mandatory: the release says so, or the running build is below its
	// minSupportedVersion.
	Mandatory bool
}

// evaluate decides whether rel is an update for currentVersion.
func evaluate(rel *ota.Release, currentVersion string) *Update {
	if rel == nil {
		return nil
	}
	latest, err := ota.ParseVersion(rel.Version)
	if err != nil {
		return nil
	}
	current := ota.LooseVersion(currentVersion)
	if latest.Compare(current) <= 0 {
		return nil
	}
	mandatory := rel.Mandatory
	if rel.MinSupportedVersion != "" {
		if minV, err := ota.ParseVersion(rel.MinSupportedVersion); err == nil && current.Compare(minV) < 0 {
			mandatory = true
		}
	}
	return &Update{Release: rel, Mandatory: mandatory}
}

// pickNotes returns the changelog in the preferred language: Russian, then
// English, then whatever is there.
func pickNotes(notes map[string][]string) []string {
	for _, lang := range []string{"ru", "en"} {
		if lines := notes[lang]; len(lines) > 0 {
			return lines
		}
	}
	best := ""
	for lang, lines := range notes {
		if len(lines) > 0 && (best == "" || lang < best) {
			best = lang
		}
	}
	return notes[best]
}

// Notes returns the changelog lines to show for an update.
func (u *Update) Notes() []string {
	if u == nil || u.Release == nil {
		return nil
	}
	return pickNotes(u.Release.Notes)
}
