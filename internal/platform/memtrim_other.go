//go:build !windows

package platform

// TrimMemory на не-Windows платформах — no-op: там нет WebView2-процессов,
// а Go-кучу уже поджимает debug.FreeOSMemory в точке вызова.
func TrimMemory() {}
