//go:build darwin

package platform

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/user"
	"strings"
	"time"
)

const reexecGrace = 700 * time.Millisecond

const (
	sudoPath      = "/usr/bin/sudo"
	visudoPath    = "/usr/sbin/visudo"
	osascriptPath = "/usr/bin/osascript"
	installPath   = "/usr/bin/install"
)

func sudoersFile() string {
	return "/etc/sudoers.d/beam-app" + variantSuffix()
}

func EnsureElevated() {
	if os.Geteuid() == 0 {
		return
	}

	self, err := resolveSelfExecutable()
	if err != nil {
		LogCrashEvent("EnsureElevated: failed to resolve own path: %v", err)
		return
	}

	if reexecAsRoot(self) {
		return
	}

	if err := installSudoersRule(self); err != nil {
		LogCrashEvent("EnsureElevated: failed to install the sudoers rule: %v", err)
		return
	}

	if reexecAsRoot(self) {
		return
	}

	LogCrashEvent("EnsureElevated: sudo -n still fails after installing the rule")
}

func reexecAsRoot(self string) bool {
	args := os.Args[1:]
	execArgv := append([]string{"-n", self}, args...)

	cmd := exec.Command(sudoPath, execArgv...)
	cmd.Env = os.Environ()
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return false
	}

	exited := make(chan struct{})
	go func() {
		_ = cmd.Wait()
		close(exited)
	}()

	select {
	case <-exited:
		return false
	case <-time.After(reexecGrace):
		os.Exit(0)
		panic("unreachable")
	}
}

func installSudoersRule(self string) error {
	digest, err := sha256File(self)
	if err != nil {
		return fmt.Errorf("failed to compute the binary sha256: %w", err)
	}

	u, err := user.Current()
	if err != nil {
		return fmt.Errorf("failed to resolve the current user: %w", err)
	}

	rule := fmt.Sprintf(
		"# Managed by Beam. Regenerated automatically on install/update - do not edit by hand.\n%s ALL=(root) NOPASSWD: sha256:%s %s\n",
		u.Username, digest, self,
	)

	tmp, err := os.CreateTemp("", "beam-sudoers-*")
	if err != nil {
		return fmt.Errorf("failed to create a temp file: %w", err)
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)

	if _, err := tmp.WriteString(rule); err != nil {
		tmp.Close()
		return fmt.Errorf("failed to write the temp file: %w", err)
	}
	tmp.Close()

	if err := exec.Command(visudoPath, "-c", "-f", tmpPath).Run(); err != nil {
		return fmt.Errorf("the sudoers draft failed the syntax check (visudo -c): %w", err)
	}

	dest := sudoersFile()
	installCmd := fmt.Sprintf(
		"%s -m 0440 -o root -g wheel %s %s",
		shQuote(installPath), shQuote(tmpPath), shQuote(dest),
	)
	script := fmt.Sprintf(
		`do shell script "%s" with administrator privileges with prompt "Beam needs one-time administrator access so it can turn the VPN on later without asking for your password again."`,
		asQuote(installCmd),
	)

	if err := exec.Command(osascriptPath, "-e", script).Run(); err != nil {
		return fmt.Errorf("cancelled by the user or an authorization error: %w", err)
	}

	return nil
}

func sha256File(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func shQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

func asQuote(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `"`, `\"`)
	return s
}
