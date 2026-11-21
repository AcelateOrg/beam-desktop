package platform

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"
)

var crashLogMu sync.Mutex

const maxCrashLogSize = 2 * 1024 * 1024

func LogCrashEvent(format string, args ...interface{}) {
	crashLogMu.Lock()
	defer crashLogMu.Unlock()

	dir := GetLogsDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return
	}
	path := filepath.Join(dir, "crash.log")

	if info, err := os.Stat(path); err == nil && info.Size() > maxCrashLogSize {
		_ = os.Remove(path)
	}

	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	line := fmt.Sprintf("[%s] %s\n", time.Now().Format("2006-01-02 15:04:05.000"), fmt.Sprintf(format, args...))
	_, _ = f.WriteString(line)
}

func RecoverAndLog(context string) {
	if r := recover(); r != nil {
		buf := make([]byte, 8192)
		n := runtime.Stack(buf, false)
		LogCrashEvent("panic in %s: %v\n%s", context, r, buf[:n])
	}
}
