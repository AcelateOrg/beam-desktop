package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"beam-app/internal/application/update/ota"
)

var allTargets = []string{
	"windows-amd64", "windows-arm64",
	"linux-amd64", "linux-arm64",
	"darwin-amd64", "darwin-arm64", "darwin-universal",
}

func runVerify(args []string) error {
	fs := flag.NewFlagSet("verify", flag.ExitOnError)
	baseURL := fs.String("base-url", ota.DefaultBaseURL, "feed to read over HTTPS")
	stagedDir := fs.String("staged", "", "read files staged by publish (build/ota/{version}) instead of the live feed; implies -check-urls=false")
	channel := fs.String("channel", ota.DefaultChannel, "update channel")
	targetList := fs.String("target", "", "comma-separated targets (default: all)")
	pubkey := fs.String("pubkey", "", "verify with this base64 public key instead of the compiled-in ones")
	checkFiles := fs.Bool("check-urls", true, "HEAD every download URL and compare its size")
	_ = fs.Parse(args)

	var keysList []string
	if *pubkey != "" {
		keysList = []string{*pubkey}
	} else {
		keysList = ota.TrustedPublicKeys
	}
	keys, err := ota.ParsePublicKeys(keysList)
	if err != nil {
		return err
	}

	var source ota.Source = ota.HTTPSource{BaseURL: *baseURL, Client: &http.Client{Timeout: 20 * time.Second}, UserAgent: "beam-ota-verify"}
	where := *baseURL
	if *stagedDir != "" {
		source = stagedSource{root: *stagedDir}
		where = *stagedDir
		*checkFiles = false
	}
	feed := &ota.Feed{Source: source, Keys: keys}

	targets := allTargets
	if *targetList != "" {
		targets = strings.Split(*targetList, ",")
	}

	fmt.Printf("Feed %s, channel %s\n", where, *channel)
	ctx := context.Background()
	failed := 0
	for _, name := range targets {
		t, err := ota.ParseTarget(name)
		if err != nil {
			return err
		}
		p, err := feed.Pointer(ctx, *channel, []ota.Target{t})
		if errors.Is(err, ota.ErrNotFound) {
			fmt.Printf("  %-17s -  not published\n", t)
			continue
		}
		if err != nil {
			fmt.Printf("  %-17s X  %v\n", t, err)
			failed++
			continue
		}
		r, err := feed.Release(ctx, p)
		if err != nil {
			fmt.Printf("  %-17s X  %s: %v\n", t, p.Version, err)
			failed++
			continue
		}
		flags := ""
		if r.Mandatory {
			flags += " mandatory"
		}
		if r.MinSupportedVersion != "" {
			flags += " min=" + r.MinSupportedVersion
		}
		fmt.Printf("  %-17s OK %s (released %s, %d file(s))%s\n", t, r.Version, r.ReleasedAt.Format("2006-01-02 15:04"), len(r.Files), flags)
		if *checkFiles {
			if err := checkURLs(r.Files); err != nil {
				fmt.Printf("  %-17s X  %v\n", "", err)
				failed++
			}
		}
	}
	if failed > 0 {
		return fmt.Errorf("%d problem(s) found", failed)
	}
	return nil
}

// stagedSource serves build/ota/{version}/{target}/ the way the proxy serves
// release assets, so a release can be verified before it is uploaded.
type stagedSource struct{ root string }

func (s stagedSource) Fetch(_ context.Context, sitePath string) ([]byte, error) {
	name, suffix := sitePath, ""
	if strings.HasSuffix(name, ota.SignatureSuffix) {
		name, suffix = strings.TrimSuffix(name, ota.SignatureSuffix), ota.SignatureSuffix
	}
	parts := strings.Split(strings.TrimPrefix(strings.TrimSuffix(name, ".json"), "/"), "/")
	if len(parts) != 4 || parts[0] != "v1" {
		return nil, fmt.Errorf("%s: %w", sitePath, ota.ErrNotFound)
	}
	var file string
	switch parts[1] {
	case "channels": // /v1/channels/{channel}/{target}
		t, err := ota.ParseTarget(parts[3])
		if err != nil {
			return nil, fmt.Errorf("%s: %w", sitePath, ota.ErrNotFound)
		}
		file = filepath.Join(s.root, t.String(), ota.PointerAssetName(parts[2], t))
	case "releases": // /v1/releases/{target}/{version}
		t, err := ota.ParseTarget(parts[2])
		if err != nil || filepath.Base(s.root) != parts[3] {
			return nil, fmt.Errorf("%s: %w", sitePath, ota.ErrNotFound)
		}
		file = filepath.Join(s.root, t.String(), ota.ReleaseAssetName(t))
	default:
		return nil, fmt.Errorf("%s: %w", sitePath, ota.ErrNotFound)
	}
	data, err := os.ReadFile(file + suffix)
	if errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("%s: %w", file+suffix, ota.ErrNotFound)
	}
	return data, err
}
