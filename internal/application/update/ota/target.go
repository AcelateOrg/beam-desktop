package ota

import (
	"fmt"
	"runtime"
	"strconv"
	"strings"
)

// Target is a platform build: "windows-amd64", "linux-arm64",
// "darwin-universal". Versions are tracked per target, so Linux can stay on
// 2.0.0 while Windows is already on 2.1.0.
type Target struct {
	OS   string
	Arch string
}

var targetArchs = map[string][]string{
	"windows": {"amd64", "arm64"},
	"linux":   {"amd64", "arm64"},
	// universal: one fat .app for both CPUs (the default macOS build).
	"darwin": {"amd64", "arm64", "universal"},
}

func (t Target) String() string { return t.OS + "-" + t.Arch }

// Validate reports whether the target is one Beam is built for.
func (t Target) Validate() error {
	archs, ok := targetArchs[t.OS]
	if !ok {
		return fmt.Errorf("unknown target OS %q (want windows, linux or darwin)", t.OS)
	}
	for _, a := range archs {
		if a == t.Arch {
			return nil
		}
	}
	return fmt.Errorf("unknown arch %q for %s (want one of %s)", t.Arch, t.OS, strings.Join(archs, ", "))
}

// ParseTarget parses "os-arch".
func ParseTarget(s string) (Target, error) {
	osName, arch, ok := strings.Cut(strings.TrimSpace(s), "-")
	if !ok {
		return Target{}, fmt.Errorf("target %q: want os-arch, e.g. windows-amd64", s)
	}
	t := Target{OS: osName, Arch: arch}
	if err := t.Validate(); err != nil {
		return Target{}, err
	}
	return t, nil
}

// CandidateTargets lists the targets this binary accepts updates for, most
// specific first: on macOS an arch-specific build wins over the universal one.
func CandidateTargets() []Target {
	return candidateTargets(runtime.GOOS, runtime.GOARCH)
}

func candidateTargets(goos, goarch string) []Target {
	var out []Target
	if t := (Target{OS: goos, Arch: goarch}); t.Validate() == nil {
		out = append(out, t)
	}
	if goos == "darwin" {
		out = append(out, Target{OS: "darwin", Arch: "universal"})
	}
	return out
}

// Version is a strict MAJOR.MINOR.PATCH.
type Version [3]int

// ParseVersion accepts only plain "X.Y.Z" (digits, no prefix/suffix): the
// feed is machine-written, anything else is a publishing mistake.
func ParseVersion(s string) (Version, error) {
	var v Version
	parts := strings.Split(s, ".")
	if len(parts) != 3 {
		return v, fmt.Errorf("version %q: want MAJOR.MINOR.PATCH", s)
	}
	for i, p := range parts {
		if p == "" || (len(p) > 1 && p[0] == '0') {
			return v, fmt.Errorf("version %q: bad component %q", s, p)
		}
		for _, c := range p {
			if c < '0' || c > '9' {
				return v, fmt.Errorf("version %q: bad component %q", s, p)
			}
		}
		n, err := strconv.Atoi(p)
		if err != nil {
			return v, fmt.Errorf("version %q: %w", s, err)
		}
		v[i] = n
	}
	return v, nil
}

// Compare returns -1, 0 or 1.
func (v Version) Compare(o Version) int {
	for i := range v {
		if v[i] != o[i] {
			if v[i] < o[i] {
				return -1
			}
			return 1
		}
	}
	return 0
}

// LooseVersion parses the running app's own version, which may come with a
// "v" prefix or a "-beta"/"+meta" suffix. Unparseable parts count as 0, so a
// "dev" build compares as 0.0.0 (older than anything).
func LooseVersion(s string) Version {
	var out Version
	s = strings.TrimPrefix(strings.TrimSpace(s), "v")
	if i := strings.IndexAny(s, "-+"); i >= 0 {
		s = s[:i]
	}
	parts := strings.SplitN(s, ".", 3)
	for i := 0; i < len(parts) && i < 3; i++ {
		n, _ := strconv.Atoi(strings.TrimSpace(parts[i]))
		out[i] = n
	}
	return out
}
