//go:build !windows && !linux

package tray

import _ "embed"

//go:embed assets/trayicon.png
var Icon []byte
