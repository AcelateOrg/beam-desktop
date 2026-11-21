//go:build linux

package update

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"

	"beam-app/internal/platform"
)

func (s *Service) ApplyUpdate(stagingDir string) error {
	dir, err := installDir()
	if err != nil {
		return err
	}

	self, err := os.Executable()
	if err != nil {
		return err
	}

	if err := ensureWritable(dir); err != nil {
		return err
	}

	type pendingSwap struct{ tmp, dest string }
	var pending []pendingSwap

	discard := func() {
		for _, p := range pending {
			_ = os.Remove(p.tmp)
		}
	}

	walkErr := filepath.WalkDir(stagingDir, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}

		rel, err := filepath.Rel(stagingDir, path)
		if err != nil {
			return err
		}

		dest := filepath.Join(dir, rel)
		if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
			return err
		}

		tmp, err := copyBesideTarget(path, dest, self)
		if err != nil {
			return err
		}

		pending = append(pending, pendingSwap{tmp: tmp, dest: dest})
		return nil
	})
	if walkErr != nil {
		discard()
		return walkErr
	}

	for _, p := range pending {
		if err := os.Rename(p.tmp, p.dest); err != nil {
			discard()
			return fmt.Errorf("failed to replace %s: %w", p.dest, err)
		}
	}

	_ = os.RemoveAll(stagingDir)

	return relaunchAfterExit(self)
}

func ensureWritable(dir string) error {
	probe, err := os.CreateTemp(dir, ".beam-update-probe-")
	if err != nil {
		return fmt.Errorf(
			"no write permission for %s - update Beam the same way you installed it (scripts/linux/install.sh or your package manager): %w",
			dir, err,
		)
	}

	name := probe.Name()
	_ = probe.Close()
	_ = os.Remove(name)
	return nil
}

func copyBesideTarget(src, dest, self string) (string, error) {
	mode := os.FileMode(0644)
	if info, err := os.Stat(dest); err == nil {
		mode = info.Mode().Perm()
	} else if dest == self {
		mode = 0755
	}

	in, err := os.Open(src)
	if err != nil {
		return "", err
	}
	defer in.Close()

	tmpPath := dest + ".beam-new"
	out, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, mode)
	if err != nil {
		return "", err
	}

	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		_ = os.Remove(tmpPath)
		return "", err
	}

	if err := out.Chmod(mode); err != nil {
		out.Close()
		_ = os.Remove(tmpPath)
		return "", err
	}
	if err := out.Sync(); err != nil {
		out.Close()
		_ = os.Remove(tmpPath)
		return "", err
	}
	if err := out.Close(); err != nil {
		_ = os.Remove(tmpPath)
		return "", err
	}

	return tmpPath, nil
}

func relaunchAfterExit(bin string) error {
	script := fmt.Sprintf(
		"i=0; while [ $i -lt 75 ]; do kill -0 %d 2>/dev/null || break; sleep 0.2; i=$((i+1)); done; exec %s",
		os.Getpid(),
		shellQuote(bin),
	)

	cmd := exec.Command("/bin/sh", "-c", script)
	cmd.Dir = filepath.Dir(bin)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}

	cmd.Env = platform.EnvWithoutPrivilegeGuard(os.Environ())

	return cmd.Start()
}

func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

func installDir() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Dir(exePath), nil
}
