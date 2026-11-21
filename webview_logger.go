package main

import (
	"strings"
	"sync/atomic"

	"beam-app/internal/platform"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

// webviewLogger keeps Wails' own output and copies errors into crash.log, so
// a black window leaves a trace there. When the WebView2 GPU process dies
// (COREWEBVIEW2_PROCESS_FAILED_KIND_GPU_PROCESS_EXITED = 6) the next launch
// runs WebView2 without the GPU.
type webviewLogger struct {
	logger.Logger
	gpuDisabled atomic.Bool
}

func newWebviewLogger(gpuDisabled bool) *webviewLogger {
	l := &webviewLogger{Logger: logger.NewDefaultLogger()}
	l.gpuDisabled.Store(gpuDisabled)
	return l
}

func (l *webviewLogger) Error(message string) {
	l.Logger.Error(message)
	platform.LogCrashEvent("wails: %s", message)

	// Wails logs it as "WebVie2wProcess failed with kind %d".
	if strings.HasSuffix(strings.TrimSpace(message), "failed with kind 6") && l.gpuDisabled.CompareAndSwap(false, true) {
		_ = platform.SetWebviewGpuDisabled(true, "WebView2 GPU process crashed")
	}
}

func (l *webviewLogger) Fatal(message string) {
	platform.LogCrashEvent("wails fatal: %s", message)
	l.Logger.Fatal(message)
}
