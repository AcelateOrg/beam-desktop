package platform

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

const relaunchAfterFlag = "--relaunch-after="

// RelaunchAfterExit starts a new copy of BEAM that waits for this process to
// exit before taking the single-instance lock. The caller quits right after.
func RelaunchAfterExit() error {
	exe, err := resolveSelfExecutable()
	if err != nil {
		return err
	}
	cmd := exec.Command(exe, relaunchAfterFlag+strconv.Itoa(os.Getpid()))
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("relaunch: %w", err)
	}
	return cmd.Process.Release()
}

// WaitForRelaunchParent blocks until the process named by --relaunch-after
// has exited (bounded), and returns args without that flag.
func WaitForRelaunchParent(args []string) []string {
	const maxWait = 15 * time.Second

	rest := args[:0:0]
	for _, arg := range args {
		value, ok := strings.CutPrefix(arg, relaunchAfterFlag)
		if !ok {
			rest = append(rest, arg)
			continue
		}
		pid, err := strconv.Atoi(value)
		if err != nil || pid <= 0 {
			continue
		}
		proc, err := os.FindProcess(pid)
		if err != nil {
			continue
		}
		done := make(chan struct{})
		go func() {
			_, _ = proc.Wait()
			close(done)
		}()
		select {
		case <-done:
		case <-time.After(maxWait):
			LogCrashEvent("relaunch: process %d still alive after %s, starting anyway", pid, maxWait)
		}
	}
	return rest
}
