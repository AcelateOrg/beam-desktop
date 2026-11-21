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

	_ = moveUpdateFiles(stagingDir, installDir)
	_ = os.RemoveAll(stagingDir)

	cmd := exec.Command(filepath.Join(installDir, "Beam.exe"))
	cmd.Dir = installDir
	_ = cmd.Start()
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
	for attempt := 0; attempt < 10; attempt++ {
		if attempt > 0 {
			time.Sleep(300 * time.Millisecond)
		}
		_ = os.Remove(dest)
		if err := os.Rename(src, dest); err == nil {
			return nil
		} else {
			lastErr = err
		}
	}
	return lastErr
}

func waitForProcessExit(pid int, timeout time.Duration) {
	const synchronize = 0x00100000

	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	openProcess := kernel32.NewProc("OpenProcess")
	waitForSingleObject := kernel32.NewProc("WaitForSingleObject")
	closeHandle := kernel32.NewProc("CloseHandle")

	h, _, _ := openProcess.Call(synchronize, 0, uintptr(pid))
	if h == 0 {
		return
	}
	defer closeHandle.Call(h)

	waitForSingleObject.Call(h, uintptr(timeout.Milliseconds()))
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
