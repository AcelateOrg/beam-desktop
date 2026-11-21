package main

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"beam-app/internal/application/update/ota"
)

type multiFlag []string

func (m *multiFlag) String() string     { return strings.Join(*m, ", ") }
func (m *multiFlag) Set(v string) error { *m = append(*m, v); return nil }

type publishOpts struct {
	keyPath, target, version, channel, repo, commitish string
	notesRU, notesEN, minSupported, baseURL, outDir    string
	files, urls                                        multiFlag
	upload, live, mandatory, force                     bool
}

// staged is one file ready to become a release asset.
type staged struct {
	name, path string
	size       int64
}

// stageResult is everything publish produced for one target, in upload
// order: binaries first, then the release manifest, the pointer last.
type stageResult struct {
	dir                        string
	binaries, release, pointer []staged
}

func (s *stageResult) all() []staged {
	return slices.Concat(s.binaries, s.release, s.pointer)
}

func defaultRepo() string {
	if v := os.Getenv("GITHUB_REPOSITORY"); v != "" {
		return v
	}
	return "AcelateOrg/beam-desktop"
}

func runPublish(args []string) error {
	var o publishOpts
	fs := flag.NewFlagSet("publish", flag.ExitOnError)
	fs.StringVar(&o.keyPath, "key", defaultKeyPath(), "ed25519 signing key file (env BEAM_OTA_KEY)")
	fs.StringVar(&o.target, "target", "", "windows-amd64 | windows-arm64 | linux-amd64 | linux-arm64 | darwin-amd64 | darwin-arm64 | darwin-universal (required)")
	fs.StringVar(&o.version, "version", "", "X.Y.Z (default: Info.productVersion from ./wails.json); the release tag is v{version}")
	fs.StringVar(&o.channel, "channel", ota.DefaultChannel, "update channel")
	fs.Var(&o.files, "file", "installPath=localFile, repeatable (e.g. Beam.exe=build/bin/Beam.exe)")
	fs.StringVar(&o.repo, "repo", defaultRepo(), "GitHub repo whose releases hold the feed (may be private; env GITHUB_REPOSITORY)")
	fs.StringVar(&o.commitish, "commitish", os.Getenv("GITHUB_SHA"), "commit for a new tag (default: env GITHUB_SHA, else the default branch)")
	fs.StringVar(&o.baseURL, "base-url", ota.DefaultBaseURL, "public URL of the OTA proxy; downloads go to {base-url}/v1/assets/{tag}/{asset}")
	fs.Var(&o.urls, "url", "extra mirror URL template, repeatable, tried after the proxy; placeholders {tag} {version} {target} {asset}")
	fs.BoolVar(&o.upload, "upload", false, "upload to the GitHub release v{version} with the gh CLI (created as a draft if missing)")
	fs.BoolVar(&o.live, "live", false, "after uploading, publish the draft release - this is the moment clients see the update (implies -upload)")
	fs.StringVar(&o.notesRU, "notes", "", "changelog file in Russian, one change per line")
	fs.StringVar(&o.notesEN, "notes-en", "", "changelog file in English, one change per line")
	fs.BoolVar(&o.mandatory, "mandatory", false, "users cannot postpone this update")
	fs.StringVar(&o.minSupported, "min-supported", "", "X.Y.Z: older installs must update")
	fs.StringVar(&o.outDir, "out", filepath.Join("build", "ota"), "where to stage the assets")
	fs.BoolVar(&o.force, "force", false, "allow replacing files of an already published version / publishing an older version")
	_ = fs.Parse(args)

	if o.live {
		o.upload = true
	}
	res, err := stage(&o)
	if err != nil {
		return err
	}
	fmt.Printf("Staged %d file(s) in %s\n", len(res.all()), res.dir)
	if !o.upload {
		fmt.Println("Not uploaded (pass -upload, or -live to also publish the release).")
		return nil
	}
	gh := &ghClient{repo: o.repo}
	if err := gh.upload(&o, res); err != nil {
		return err
	}
	if o.live {
		return gh.goLive(ota.ReleaseTag(o.version))
	}
	fmt.Printf("Uploaded to the draft release %s. Publish it with -live, or: gh release edit %s -R %s --draft=false\n",
		ota.ReleaseTag(o.version), ota.ReleaseTag(o.version), o.repo)
	return nil
}

// stage validates the inputs and writes the renamed binaries plus the signed
// release manifest and pointer into one directory, named as release assets.
func stage(o *publishOpts) (*stageResult, error) {
	target, err := ota.ParseTarget(o.target)
	if err != nil {
		return nil, fmt.Errorf("-target: %w", err)
	}
	if err := ota.ValidateChannel(o.channel); err != nil {
		return nil, err
	}
	if o.version == "" {
		if o.version, err = wailsVersion("wails.json"); err != nil {
			return nil, fmt.Errorf("-version not given and %w", err)
		}
	}
	if _, err := ota.ParseVersion(o.version); err != nil {
		return nil, err
	}
	if len(o.files) == 0 {
		return nil, errors.New("at least one -file is required")
	}
	tag := ota.ReleaseTag(o.version)

	keyText, err := loadKey(o.keyPath)
	if err != nil {
		return nil, err
	}
	key, err := ota.ParsePrivateKey(keyText)
	if err != nil {
		return nil, err
	}
	if pub := ota.PublicKeyString(key); !slices.Contains(ota.TrustedPublicKeys, pub) {
		return nil, fmt.Errorf("the signing key is not in ota.TrustedPublicKeys - apps would reject this release.\nAdd %s to internal/application/update/ota/sign.go, ship a build with it, then publish", pub)
	}

	notes := map[string][]string{}
	for lang, file := range map[string]string{"ru": o.notesRU, "en": o.notesEN} {
		if file == "" {
			continue
		}
		lines, err := readNotes(file)
		if err != nil {
			return nil, err
		}
		if len(lines) > 0 {
			notes[lang] = lines
		}
	}
	if len(notes) == 0 {
		fmt.Println("NOTE: no -notes given - the update dialog will say the changelog is unavailable.")
	}

	res := &stageResult{dir: filepath.Join(o.outDir, o.version, target.String())}
	if err := os.RemoveAll(res.dir); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(res.dir, 0o755); err != nil {
		return nil, err
	}

	now := time.Now().UTC().Truncate(time.Second)
	release := &ota.Release{
		JSONSchema:          ota.SchemaURL(o.baseURL, ota.ReleaseSchemaFile),
		SchemaVersion:       ota.SchemaVersion,
		Kind:                ota.KindRelease,
		Target:              target.String(),
		Version:             o.version,
		ReleasedAt:          now,
		Mandatory:           o.mandatory,
		MinSupportedVersion: o.minSupported,
		Notes:               notes,
	}
	for _, spec := range o.files {
		installPath, local, ok := strings.Cut(spec, "=")
		if !ok {
			return nil, fmt.Errorf("-file %q: want installPath=localFile", spec)
		}
		if err := ota.ValidateFilePath(installPath); err != nil {
			return nil, fmt.Errorf("-file %q: %w", spec, err)
		}
		name := target.String() + "-" + path.Base(installPath)
		dst := filepath.Join(res.dir, name)
		size, sum, err := copyAndHash(local, dst)
		if err != nil {
			return nil, fmt.Errorf("-file %q: %w", spec, err)
		}
		res.binaries = append(res.binaries, staged{name: name, path: dst, size: size})

		urls := []string{ota.AssetURL(o.baseURL, tag, name)}
		vars := map[string]string{"tag": tag, "version": o.version, "target": target.String(), "asset": name}
		for _, tmpl := range o.urls {
			urls = append(urls, expand(tmpl, vars))
		}
		release.Files = append(release.Files, ota.File{Path: installPath, Size: size, SHA256: sum, URLs: urls})
	}
	releaseJSON, err := ota.Marshal(release)
	if err != nil {
		return nil, fmt.Errorf("release manifest: %w", err)
	}

	pointer := &ota.Pointer{
		JSONSchema:    ota.SchemaURL(o.baseURL, ota.PointerSchemaFile),
		SchemaVersion: ota.SchemaVersion,
		Kind:          ota.KindPointer,
		Channel:       o.channel,
		Target:        target.String(),
		Version:       o.version,
		Manifest:      ota.ReleasePath(target, o.version),
		PublishedAt:   now,
	}
	pointerJSON, err := ota.Marshal(pointer)
	if err != nil {
		return nil, fmt.Errorf("pointer: %w", err)
	}

	if res.release, err = writeSigned(res.dir, ota.ReleaseAssetName(target), releaseJSON, key); err != nil {
		return nil, err
	}
	if res.pointer, err = writeSigned(res.dir, ota.PointerAssetName(o.channel, target), pointerJSON, key); err != nil {
		return nil, err
	}
	// The proxy hands these to every client on every check; keep them far
	// below the ~16 KB after which some Russian networks freeze a connection.
	if len(releaseJSON) > 8<<10 {
		fmt.Printf("WARNING: %s is %d bytes - over 8 KB, some networks may stall on it. Shorten the notes.\n", ota.ReleaseAssetName(target), len(releaseJSON))
	}
	return res, nil
}

// writeSigned writes name and name.sig into dir.
func writeSigned(dir, name string, data []byte, key []byte) ([]staged, error) {
	sig := ota.Sign(data, key)
	var out []staged
	for _, f := range []struct {
		name string
		data []byte
	}{{name, data}, {name + ota.SignatureSuffix, sig}} {
		p := filepath.Join(dir, f.name)
		if err := os.WriteFile(p, f.data, 0o644); err != nil {
			return nil, err
		}
		out = append(out, staged{name: f.name, path: p, size: int64(len(f.data))})
	}
	return out, nil
}

// --- GitHub ------------------------------------------------------------------

type ghRelease struct {
	TagName      string `json:"tagName"`
	IsDraft      bool   `json:"isDraft"`
	IsPrerelease bool   `json:"isPrerelease"`
	Assets       []struct {
		Name string `json:"name"`
		Size int64  `json:"size"`
	} `json:"assets"`
}

func (r *ghRelease) asset(name string) (int64, bool) {
	for _, a := range r.Assets {
		if a.Name == name {
			return a.Size, true
		}
	}
	return 0, false
}

type ghClient struct{ repo string }

func (g *ghClient) view(tag string) (*ghRelease, error) {
	var stderr bytes.Buffer
	cmd := exec.Command("gh", "release", "view", tag, "-R", g.repo, "--json", "tagName,isDraft,isPrerelease,assets")
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		if strings.Contains(strings.ToLower(stderr.String()), "not found") {
			return nil, nil
		}
		return nil, fmt.Errorf("gh release view %s: %v: %s", tag, err, strings.TrimSpace(stderr.String()))
	}
	var r ghRelease
	if err := json.Unmarshal(out, &r); err != nil {
		return nil, fmt.Errorf("gh release view %s: %w", tag, err)
	}
	return &r, nil
}

// newestPublished returns the highest version among published releases.
func (g *ghClient) newestPublished() (string, error) {
	out, err := exec.Command("gh", "release", "list", "-R", g.repo, "--exclude-drafts", "--limit", "100", "--json", "tagName").Output()
	if err != nil {
		return "", fmt.Errorf("gh release list: %w", err)
	}
	var list []struct {
		TagName string `json:"tagName"`
	}
	if err := json.Unmarshal(out, &list); err != nil {
		return "", err
	}
	best, bestV := "", ota.Version{}
	for _, r := range list {
		v, err := ota.ParseVersion(strings.TrimPrefix(r.TagName, "v"))
		if err != nil {
			continue
		}
		if best == "" || v.Compare(bestV) > 0 {
			best, bestV = strings.TrimPrefix(r.TagName, "v"), v
		}
	}
	return best, nil
}

func (g *ghClient) upload(o *publishOpts, res *stageResult) error {
	if _, err := exec.LookPath("gh"); err != nil {
		return errors.New("gh CLI not found - install it (winget install GitHub.cli) and run \"gh auth login\", or upload the staged files by hand")
	}
	target, _ := ota.ParseTarget(o.target)
	tag := ota.ReleaseTag(o.version)

	if newest, err := g.newestPublished(); err != nil {
		return err
	} else if newest != "" && !o.force {
		nv, _ := ota.ParseVersion(newest)
		cur, _ := ota.ParseVersion(o.version)
		if nv.Compare(cur) > 0 {
			return fmt.Errorf("%s is already published; %s would never become current (the proxy serves the highest version). Bump the version, or -force", newest, o.version)
		}
	}

	rel, err := g.view(tag)
	if err != nil {
		return err
	}
	if rel == nil {
		args := []string{"release", "create", tag, "-R", g.repo, "--draft", "--title", "Beam " + o.version, "--notes", releaseBody(o)}
		if o.channel != ota.DefaultChannel {
			args = append(args, "--prerelease")
		}
		if o.commitish != "" {
			args = append(args, "--target", o.commitish)
		}
		fmt.Println("Creating draft release", tag, "in", g.repo)
		if err := run("gh", args...); err != nil {
			return err
		}
	} else if !rel.IsDraft {
		if _, ok := rel.asset(ota.ReleaseAssetName(target)); ok && !o.force {
			return fmt.Errorf("%s %s is already published. Releases are immutable: bump the version, or -force if nothing has shipped yet", target, o.version)
		}
		fmt.Printf("NOTE: %s is already published - %s goes live as soon as its pointer is uploaded.\n", tag, target)
	}

	// Binaries, then the manifest, then the pointer: on a published release
	// a client must never see a pointer before the files it leads to.
	for _, batch := range [][]staged{res.binaries, res.release, res.pointer} {
		args := []string{"release", "upload", tag, "-R", g.repo, "--clobber"}
		for _, f := range batch {
			args = append(args, f.path)
		}
		if err := run("gh", args...); err != nil {
			return err
		}
	}

	// gh exits 0 on success, but check what the release really holds.
	rel, err = g.view(tag)
	if err != nil {
		return err
	}
	if rel == nil {
		return fmt.Errorf("release %s vanished after the upload", tag)
	}
	var problems []string
	for _, f := range res.all() {
		size, ok := rel.asset(f.name)
		switch {
		case !ok:
			problems = append(problems, f.name+": missing")
		case size != f.size:
			problems = append(problems, fmt.Sprintf("%s: %d bytes on GitHub, %d staged", f.name, size, f.size))
		}
	}
	if len(problems) > 0 {
		return fmt.Errorf("release %s does not match the staged files:\n  %s", tag, strings.Join(problems, "\n  "))
	}
	fmt.Printf("Uploaded %d file(s) to %s %s\n", len(res.all()), g.repo, tag)
	return nil
}

func (g *ghClient) goLive(tag string) error {
	rel, err := g.view(tag)
	if err != nil {
		return err
	}
	if rel != nil && !rel.IsDraft {
		fmt.Println(tag, "is already published.")
		return nil
	}
	if err := run("gh", "release", "edit", tag, "-R", g.repo, "--draft=false"); err != nil {
		return err
	}
	fmt.Printf("Published %s. Clients pick it up on their next check; see: go run ./cmd/beam-ota verify\n", tag)
	return nil
}

func releaseBody(o *publishOpts) string {
	body := "Beam " + o.version
	if o.notesRU != "" {
		if lines, err := readNotes(o.notesRU); err == nil && len(lines) > 0 {
			body += "\n\n- " + strings.Join(lines, "\n- ")
		}
	}
	return body
}

// --- helpers -------------------------------------------------------------------

func expand(tmpl string, vars map[string]string) string {
	for k, v := range vars {
		tmpl = strings.ReplaceAll(tmpl, "{"+k+"}", v)
	}
	return tmpl
}

func wailsVersion(file string) (string, error) {
	data, err := os.ReadFile(file)
	if err != nil {
		return "", fmt.Errorf("cannot read %s: %w", file, err)
	}
	var cfg struct {
		Info struct {
			ProductVersion string `json:"productVersion"`
		} `json:"Info"`
	}
	if err := json.Unmarshal(data, &cfg); err != nil {
		return "", fmt.Errorf("%s: %w", file, err)
	}
	if cfg.Info.ProductVersion == "" {
		return "", fmt.Errorf("%s has no Info.productVersion", file)
	}
	return cfg.Info.ProductVersion, nil
}

// readNotes reads one change per line; blank lines, "#" comments and list
// bullets are dropped.
func readNotes(file string) ([]string, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var lines []string
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(strings.TrimPrefix(sc.Text(), "\ufeff"))
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		for _, bullet := range []string{"- ", "* ", "• "} {
			line = strings.TrimSpace(strings.TrimPrefix(line, bullet))
		}
		if line != "" {
			lines = append(lines, line)
		}
	}
	return lines, sc.Err()
}

func copyAndHash(src, dst string) (int64, string, error) {
	in, err := os.Open(src)
	if err != nil {
		return 0, "", err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return 0, "", err
	}
	h := sha256.New()
	n, err := io.Copy(io.MultiWriter(out, h), in)
	if cerr := out.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		return 0, "", err
	}
	if n == 0 {
		return 0, "", fmt.Errorf("%s is empty", src)
	}
	return n, hex.EncodeToString(h.Sum(nil)), nil
}

// checkURLs makes sure every mirror serves exactly the declared size.
func checkURLs(files []ota.File) error {
	client := &http.Client{Timeout: 30 * time.Second}
	var problems []string
	for _, f := range files {
		for _, u := range f.URLs {
			if err := checkURL(client, u, f.Size); err != nil {
				problems = append(problems, err.Error())
			}
		}
	}
	if len(problems) > 0 {
		return fmt.Errorf("download URLs are not ready:\n  %s", strings.Join(problems, "\n  "))
	}
	return nil
}

func checkURL(client *http.Client, u string, size int64) error {
	// A fresh asset can take a few seconds to show up; retry briefly.
	var last error
	for attempt := 0; attempt < 5; attempt++ {
		if attempt > 0 {
			time.Sleep(3 * time.Second)
		}
		resp, err := client.Head(u)
		if err != nil {
			last = fmt.Errorf("%s: %w", u, err)
			continue
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			last = fmt.Errorf("%s: %s", u, resp.Status)
			continue
		}
		if resp.ContentLength >= 0 && resp.ContentLength != size {
			return fmt.Errorf("%s: serves %d bytes, the build is %d", u, resp.ContentLength, size)
		}
		return nil
	}
	return last
}

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("%s %s: %w", name, strings.Join(args, " "), err)
	}
	return nil
}
