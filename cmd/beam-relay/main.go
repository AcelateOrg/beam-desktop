//go:build windows

package main

import (
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unsafe"

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

	if platform.TrySendToRunningInstance(args) {
		return
	}

	beamExe := filepath.Join(filepath.Dir(selfPath()), "Beam.exe")
	launchElevated(beamExe, args)
}

func runApplyUpdate(stagingDir, installDir, parentPIDStr string) {
	if pid, err := strconv.Atoi(parentPIDStr); err == nil && pid > 0 {
		waitForProcessExit(pid, 15*time.Second)
	}

	_ = os.Remove(filepath.Join(installDir, "BeamRelay.exe.old"))
	_ = os.Remove(filepath.Join(installDir, "Beam.exe.old"))

	if err := moveUpdateFiles(stagingDir, installDir); err == nil {
		_ = os.RemoveAll(stagingDir)
	}

	beamExe := filepath.Join(installDir, "Beam.exe")
	cmd := exec.Command(beamExe)
	cmd.Dir = installDir
	if err := cmd.Start(); err != nil {
		launchElevated(beamExe, nil)
	}
}

func moveUpdateFiles(stagingDir, installDir string) error {
	return filepath.WalkDir(stagingDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}

		rel, err := filepath.Rel(stagingDir, path)
		if err != nil {
			return err
		}

		dest := filepath.Join(installDir, rel)
		if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
			return err
		}

		return replaceFileWithRetry(path, dest)
	})
}

func replaceFileWithRetry(src, dest string) error {
	var lastErr error
	oldPath := dest + ".old"
	for attempt := 0; attempt < 25; attempt++ {
		if attempt > 0 {
			time.Sleep(300 * time.Millisecond)
		}
		_ = os.Remove(oldPath)
		if err := os.Remove(dest); err != nil && !os.IsNotExist(err) {
			// Running executables (such as BeamRelay.exe itself) cannot be deleted
			// on Windows while mapped, but they CAN be renamed out of the way.
			_ = os.Rename(dest, oldPath)
		}
		if err := os.Rename(src, dest); err == nil {
			_ = os.Remove(oldPath)
			return nil
		} else {
			lastErr = err
		}
	}
	return lastErr
}

func waitForProcessExit(pid int, timeout time.Duration) {
	const (
		synchronize      = 0x00100000
		processTerminate = 0x0001
		waitTimeout      = 0x00000102
	)

	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	openProcess := kernel32.NewProc("OpenProcess")
	waitForSingleObject := kernel32.NewProc("WaitForSingleObject")
	terminateProcess := kernel32.NewProc("TerminateProcess")
	closeHandle := kernel32.NewProc("CloseHandle")

	h, _, _ := openProcess.Call(synchronize|processTerminate, 0, uintptr(pid))
	if h == 0 {
		h, _, _ = openProcess.Call(synchronize, 0, uintptr(pid))
		if h == 0 {
			return
		}
	}
	defer closeHandle.Call(h)

	r, _, _ := waitForSingleObject.Call(h, uintptr(timeout.Milliseconds()))
	if r == waitTimeout {
		// If the old Beam process is still stuck (e.g. minimized to tray in 2.0.1
		// or hung on shutdown), terminate it so its executable lock is released.
		terminateProcess.Call(h, 0)
		waitForSingleObject.Call(h, 3000)
	}
}

func selfPath() string {
	p, err := os.Executable()
	if err != nil {
		return "."
	}
	return p
}

func launchElevated(exePath string, args []string) {
	shell32 := syscall.NewLazyDLL("shell32.dll")
	shellExecuteW := shell32.NewProc("ShellExecuteW")

	verb, _ := syscall.UTF16PtrFromString("open")
	file, _ := syscall.UTF16PtrFromString(exePath)
	params, _ := syscall.UTF16PtrFromString(quoteArgs(args))
	dir, _ := syscall.UTF16PtrFromString(filepath.Dir(exePath))

	shellExecuteW.Call(0,
		uintptr(unsafe.Pointer(verb)),
		uintptr(unsafe.Pointer(file)),
		uintptr(unsafe.Pointer(params)),
		uintptr(unsafe.Pointer(dir)),
		1,
	)
}

func quoteArgs(args []string) string {
	quoted := make([]string, len(args))
	for i, a := range args {
		quoted[i] = `"` + strings.ReplaceAll(a, `"`, `\"`) + `"`
	}
	return strings.Join(quoted, " ")
}
