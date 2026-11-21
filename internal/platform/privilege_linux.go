//go:build linux

package platform

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
)

const (
	capNetAdminBit = 12
	capNetRawBit   = 13

	reexecGuardEnv = "BEAM_PRIVILEGE_REEXEC"
)

func EnsureElevated() {
	if hasNetCapabilities() {
		return
	}

	if os.Getenv(reexecGuardEnv) != "" {
		LogCrashEvent("EnsureElevated: capability still unavailable after setcap, not retrying")
		return
	}

	self, err := resolveSelfExecutable()
	if err != nil {
		LogCrashEvent("EnsureElevated: failed to resolve own path: %v", err)
		return
	}

	if err := grantNetCapabilities(self); err != nil {
		LogCrashEvent("EnsureElevated: failed to set capabilities: %v", err)
		return
	}

	env := append(os.Environ(), reexecGuardEnv+"=1")
	if err := syscall.Exec(self, os.Args, env); err != nil {
		LogCrashEvent("EnsureElevated: self re-exec failed: %v", err)
	}
}

func hasNetCapabilities() bool {
	if os.Geteuid() == 0 {
		return true
	}

	f, err := os.Open("/proc/self/status")
	if err != nil {
		return false
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "CapEff:") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) != 2 {
			return false
		}
		mask, err := strconv.ParseUint(fields[1], 16, 64)
		if err != nil {
			return false
		}
		return mask&(1<<capNetAdminBit) != 0 && mask&(1<<capNetRawBit) != 0
	}
	return false
}

func grantNetCapabilities(self string) error {
	setcapPath, err := findSetcap()
	if err != nil {
		return err
	}

	capsSpec := "cap_net_admin,cap_net_raw+eip"

	var cmd *exec.Cmd
	if pkexecPath, err := exec.LookPath("pkexec"); err == nil {
		cmd = exec.Command(pkexecPath, setcapPath, capsSpec, self)
	} else if sudoPath, err := exec.LookPath("sudo"); err == nil {
		cmd = exec.Command(sudoPath, setcapPath, capsSpec, self)
	} else {
		return fmt.Errorf("neither pkexec nor sudo found for the one-time privilege request")
	}

	return cmd.Run()
}

func findSetcap() (string, error) {
	for _, candidate := range []string{"/usr/sbin/setcap", "/sbin/setcap", "/usr/bin/setcap"} {
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("setcap not found on the system (requires the libcap2-bin / libcap package)")
}

func EnvWithoutPrivilegeGuard(env []string) []string {
	out := make([]string, 0, len(env))
	for _, kv := range env {
		if strings.HasPrefix(kv, reexecGuardEnv+"=") {
			continue
		}
		out = append(out, kv)
	}
	return out
}
