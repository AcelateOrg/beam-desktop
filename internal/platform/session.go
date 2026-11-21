package platform

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime/debug"
	"strings"
	"sync"
	"time"
)

// The core lives in this process, so a crash takes the tunnel and the kill
// switch rules with it. Two things make such a crash survivable:
//
//   - fatal.log: the runtime writes the trace of any crash Go cannot recover
//     from (unrecovered panic, concurrent map write, out of memory) there;
//   - the session marker: present while the app runs, removed on a clean
//     exit. Found at launch, it means the previous run died - and whether the
//     VPN was up at that moment, so the next launch can protect and reconnect.

const (
	sessionMarkerName = "session.run"
	fatalLogName      = "fatal.log"
	maxFatalLogSize   = 2 * 1024 * 1024
)

// PreviousSession describes how the last run ended.
type PreviousSession struct {
	Crashed      bool
	WasConnected bool
}

var (
	sessionMu        sync.Mutex
	sessionConnected bool
	sessionActive    bool
	fatalLog         *os.File
)

// InstallFatalOutput routes the runtime's crash traces to logs/fatal.log.
func InstallFatalOutput(version string) {
	dir := GetLogsDir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return
	}
	path := filepath.Join(dir, fatalLogName)
	if info, err := os.Stat(path); err == nil && info.Size() > maxFatalLogSize {
		_ = os.Remove(path)
	}
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		return
	}
	// The header dates whatever trace follows it; a clean run leaves only it.
	_, _ = fmt.Fprintf(f, "=== launch %s v%s pid %d\n", time.Now().Format(time.RFC3339), version, os.Getpid())
	if err := debug.SetCrashOutput(f, debug.CrashOptions{}); err != nil {
		_ = f.Close()
		return
	}
	fatalLog = f
}

// BeginSession reads what the previous run left behind and marks this run as
// live. Call once, by the instance that owns the app.
func BeginSession() PreviousSession {
	sessionMu.Lock()
	defer sessionMu.Unlock()

	path := sessionMarkerPath()
	var prev PreviousSession
	if data, err := os.ReadFile(path); err == nil {
		prev.Crashed = true
		prev.WasConnected = strings.Contains(string(data), "connected=1")
		LogCrashEvent("session: previous run did not exit cleanly (vpn was up: %v)", prev.WasConnected)
	}
	sessionActive = true
	sessionConnected = false
	writeSessionMarkerLocked()
	return prev
}

// SetSessionConnected records whether the VPN is up (or coming up), so a
// crash knows what to restore.
func SetSessionConnected(connected bool) {
	sessionMu.Lock()
	defer sessionMu.Unlock()
	if !sessionActive || sessionConnected == connected {
		return
	}
	sessionConnected = connected
	writeSessionMarkerLocked()
}

// EndSession marks a clean exit. Safe to call more than once.
func EndSession() {
	sessionMu.Lock()
	defer sessionMu.Unlock()
	if !sessionActive {
		return
	}
	sessionActive = false
	_ = os.Remove(sessionMarkerPath())
}

func writeSessionMarkerLocked() {
	dir := GetAppDataDir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return
	}
	flag := "0"
	if sessionConnected {
		flag = "1"
	}
	content := fmt.Sprintf("pid=%d\nconnected=%s\n", os.Getpid(), flag)
	tmp := sessionMarkerPath() + ".tmp"
	if err := os.WriteFile(tmp, []byte(content), 0o600); err != nil {
		return
	}
	_ = os.Rename(tmp, sessionMarkerPath())
}

func sessionMarkerPath() string {
	return filepath.Join(GetAppDataDir(), sessionMarkerName)
}
