package main

import (
	"embed"
	"net"
	"net/http"
	_ "net/http/pprof"
	"os"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"strings"

	"beam-app/internal/platform"
	"beam-app/internal/presentation/wails/media"
	"beam-app/internal/tray"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed internal/platform/assets/appicon.png
var appIcon []byte

var (
	version   = "dev"
	variant   = "dev"
	buildHash = "unknown"
	// betaTag is set by the build (-X main.betaTag=FD1) for closed-beta builds.
	betaTag = ""
)

func pprofAddr() string {
	return normalizePprofAddr(pprofRequest())
}

// pprofRequest is honoured by dev builds only: a heap profile is a dump of
// the elevated process's memory (keys, subscription links), so a release
// build never serves it, whatever the environment says.
func pprofRequest() string {
	if !platform.IsDevBuild() {
		return ""
	}

	if value := strings.TrimSpace(os.Getenv("BEAM_PPROF")); value != "" {
		return value
	}

	for _, arg := range os.Args[1:] {
		if arg == "--pprof" || arg == "-pprof" {
			return "1"
		}
		for _, prefix := range []string{"--pprof=", "-pprof="} {
			if strings.HasPrefix(arg, prefix) {
				return strings.TrimSpace(strings.TrimPrefix(arg, prefix))
			}
		}
	}

	for _, dir := range pprofMarkerDirs() {
		data, err := os.ReadFile(filepath.Join(dir, "pprof.on"))
		if err != nil {
			continue
		}
		if value := strings.TrimSpace(string(data)); value != "" {
			return value
		}
		return "1"
	}

	return ""
}

func pprofMarkerDirs() []string {
	dirs := []string{platform.GetAppDataDir()}
	if exe, err := os.Executable(); err == nil {
		dirs = append(dirs, filepath.Dir(exe))
	}
	return dirs
}

func normalizePprofAddr(value string) string {
	switch strings.ToLower(value) {
	case "", "0", "false", "off":
		return ""
	case "1", "true", "on":
		return "127.0.0.1:6060"
	}
	// Always loopback: only the port is taken from the request.
	if _, port, err := net.SplitHostPort(value); err == nil {
		value = port
	}
	if value == "" {
		return ""
	}
	return "127.0.0.1:" + value
}

func main() {
	platform.InstallCoreBridge()

	defer func() {
		if r := recover(); r != nil {
			platform.LogCrashEvent("fatal panic in main: %v", r)
			panic(r)
		}
	}()

	platform.SetBuildVariant(variant)
	platform.SetAppVersion(version)
	platform.SetBetaTag(betaTag)

	debug.SetGCPercent(60)
	// A soft ceiling: the GC works harder near it instead of letting a leak
	// grow until the OS kills the process (and the tunnel with it).
	if os.Getenv("GOMEMLIMIT") == "" {
		debug.SetMemoryLimit(1 << 30)
	}

	if addr := pprofAddr(); addr != "" {
		go func() {
			defer platform.RecoverAndLog("pprof")

			listener, err := net.Listen("tcp", addr)
			if err != nil {
				platform.LogCrashEvent("pprof: failed to bind %s: %s", addr, err.Error())
				return
			}

			platform.LogCrashEvent("pprof: listening on http://%s/debug/pprof/ (pid %d)", listener.Addr().String(), os.Getpid())
			_ = http.Serve(listener, nil)
		}()
	}

	// A restart from the tray waits here for the old process to let go of
	// the single-instance lock.
	args := platform.WaitForRelaunchParent(os.Args[1:])

	var singleInstanceListener net.Listener
	var previous platform.PreviousSession

	if !platform.IsBindingsBuild {
		if platform.TrySendToRunningInstance(args) {
			return
		}

		platform.EnsureElevated()

		listener, acquired := platform.AcquireSingleInstanceLock(args)
		if !acquired {
			return
		}
		singleInstanceListener = listener

		platform.InstallFatalOutput(version)
		previous = platform.BeginSession()
	}

	gpuDisabled := runtime.GOOS == "windows" && platform.WebviewGpuDisabled(args)
	if gpuDisabled {
		platform.LogCrashEvent("webview: starting without GPU acceleration")
	}

	app := NewApp()
	media.SetProfileMedia(app.container.ProfileManager().MediaFile)
	isDevRuntime := platform.IsDevBuild()
	startHidden := !isDevRuntime && platform.IsAutoStartLaunch(args)
	app.setStartupParams(tray.Icon, startHidden)
	app.setSingleInstanceListener(singleInstanceListener)
	app.setWebviewGpuDisabled(gpuDisabled)
	app.setPreviousSession(previous)

	title := "BEAM"
	if platform.IsDevBuild() {
		title = "BEAM (Dev)"
	}

	width, height := 900, 650
	minWidth, minHeight := 350, 520
	if runtime.GOOS == "darwin" {
		width, height = 800, 600
	}

	appOptions := &options.App{
		Title:     title,
		Width:     width,
		Height:    height,
		MinWidth:  minWidth,
		MinHeight: minHeight,
		Frameless:        runtime.GOOS == "windows",
		StartHidden:      startHidden,
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		Logger:           newWebviewLogger(gpuDisabled),
		Windows: &windows.Options{
			WebviewGpuIsDisabled: gpuDisabled,
		},
		AssetServer: &assetserver.Options{
			Assets:     assets,
			Middleware: media.BackdropMiddleware,
		},
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  true,
				HideTitleBar:               false,
				FullSizeContent:            true,
				UseToolbar:                 false,
				HideToolbarSeparator:       true,
			},
			About: &mac.AboutInfo{
				Title:   "Beam",
				Message: "© 2025 Blerk",
			},
		},
		OnStartup:     app.startup,
		OnShutdown:    app.shutdown,
		OnBeforeClose: app.beforeClose,
		Bind: []interface{}{
			app,
			app.container.ProfileHandler(),
			app.container.VPNHandler(),
			app.container.SettingsHandler(),
			app.container.SystemHandler(),
			app.container.WindowHandler(),
			app.container.UpdateHandler(),
		},
	}

	if runtime.GOOS == "linux" {
		appOptions.Linux = &linux.Options{
			Icon:             appIcon,
			ProgramName:      "beam",
			WebviewGpuPolicy: linux.WebviewGpuPolicyNever,
		}
	}

	if err := wails.Run(appOptions); err != nil {
		platform.LogCrashEvent("wails.Run returned error: %s", err.Error())
		println("Error:", err.Error())
	}
	platform.EndSession()
}
