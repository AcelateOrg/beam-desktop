//go:build darwin

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"beam-app/internal/platform"
)

var variant = "release"

func main() {
	platform.SetBuildVariant(variant)

	args := os.Args[1:]
	if len(args) >= 4 && args[0] == "--apply-update" {
		runApplyUpdate(args[1], args[2], args[3])
		return
	}

	fmt.Fprintln(os.Stderr, "usage: beam-relay --apply-update <stagingDir> <bundlePath> <parentPID>")
	os.Exit(1)
}

func runApplyUpdate(stagingDir, bundlePath, parentPIDStr string) {
	if pid, err := strconv.Atoi(parentPIDStr); err == nil && pid > 0 {
		waitForProcessExit(pid, 15*time.Second)
	}

	if err := applyBundleSwap(stagingDir, bundlePath); err != nil {
		platform.LogCrashEvent("beam-relay: apply-update failed: %v", err)
	}

	_ = exec.Command("open", bundlePath).Start()
	_ = os.RemoveAll(stagingDir)
}

func applyBundleSwap(stagingDir, bundlePath string) error {
	zipPath, err := findUpdateZip(stagingDir)
	if err != nil {
		return err
	}

	installParent := filepath.Dir(bundlePath)
	scratchDir := filepath.Join(installParent, ".beam-update-tmp")
	_ = os.RemoveAll(scratchDir)
	if err := os.MkdirAll(scratchDir, 0755); err != nil {
		return fmt.Errorf("mkdir scratch: %w", err)
	}
	defer os.RemoveAll(scratchDir)

	if out, err := exec.Command("ditto", "-x", "-k", zipPath, scratchDir).CombinedOutput(); err != nil {
		return fmt.Errorf("ditto extract: %w (%s)", err, string(out))
	}

	newBundle, ok := findExtractedBundle(scratchDir)
	if !ok {
		return fmt.Errorf(".app not found in %s after extraction", scratchDir)
	}
	if !isLaunchableBundle(newBundle) {
		return fmt.Errorf("extracted bundle %s looks corrupted", newBundle)
	}

	oldBundle := bundlePath + ".old"
	_ = os.RemoveAll(oldBundle)

	if err := os.Rename(bundlePath, oldBundle); err != nil {
		return fmt.Errorf("rename current -> .old: %w", err)
	}

	if err := os.Rename(newBundle, bundlePath); err != nil {
		_ = os.Rename(oldBundle, bundlePath)
		return fmt.Errorf("rename new -> current (rolled back): %w", err)
	}

	_ = os.RemoveAll(oldBundle)
	return nil
}

func findUpdateZip(stagingDir string) (string, error) {
	matches, err := filepath.Glob(filepath.Join(stagingDir, "*.zip"))
	if err != nil {
		return "", err
	}
	if len(matches) == 0 {
		return "", fmt.Errorf("no update .zip found in staging dir %s", stagingDir)
	}
	return matches[0], nil
}

func findExtractedBundle(scratchDir string) (string, bool) {
	matches, err := filepath.Glob(filepath.Join(scratchDir, "*.app"))
	if err != nil || len(matches) != 1 {
		return "", false
	}
	return matches[0], true
}

func isLaunchableBundle(bundlePath string) bool {
	name, err := macBundleExecutableName(bundlePath)
	if err != nil {
		return false
	}
	info, err := os.Stat(filepath.Join(bundlePath, "Contents", "MacOS", name))
	if err != nil || info.IsDir() {
		return false
	}
	return info.Mode()&0111 != 0
}

func macBundleExecutableName(bundlePath string) (string, error) {
	out, err := exec.Command("/usr/bin/plutil", "-convert", "json", "-o", "-",
		filepath.Join(bundlePath, "Contents", "Info.plist")).Output()
	if err != nil {
		return "", err
	}
	var info struct {
		CFBundleExecutable string `json:"CFBundleExecutable"`
	}
	if err := json.Unmarshal(out, &info); err != nil {
		return "", err
	}
	if info.CFBundleExecutable == "" {
		return "", fmt.Errorf("CFBundleExecutable is empty")
	}
	return info.CFBundleExecutable, nil
}

func waitForProcessExit(pid int, timeout time.Duration) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if err := syscall.Kill(pid, 0); err == syscall.ESRCH {
			return
		}
		time.Sleep(200 * time.Millisecond)
	}
	_ = syscall.Kill(pid, syscall.SIGKILL)
	time.Sleep(300 * time.Millisecond)
}
