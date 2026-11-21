#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

require_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo "ERROR: Required tool not found in PATH: $1" >&2
        return 1
    fi
    return 0
}

if [ "$(id -u)" = "0" ]; then
    echo "ERROR: do not run dev.sh with sudo - the app elevates itself at startup (see internal/platform/privilege_linux.go)." >&2
    exit 1
fi

require_tool wails
require_tool bun

if command -v pkg-config &> /dev/null; then
    if ! pkg-config --exists webkit2gtk-4.1 && ! pkg-config --exists webkit2gtk-4.0; then
        echo "ERROR: webkit2gtk (4.1 or 4.0) not found - Wails will not build." >&2
        echo "  Debian/Ubuntu: sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libcap2-bin" >&2
        echo "  Fedora:        sudo dnf install gtk3-devel webkit2gtk4.1-devel libcap" >&2
        echo "  Arch:          sudo pacman -S gtk3 webkit2gtk-4.1 libcap" >&2
        exit 1
    fi
fi

if ! command -v setcap &> /dev/null && [ ! -x /usr/sbin/setcap ] && [ ! -x /sbin/setcap ]; then
    echo "WARNING: setcap not found - TUN will not come up (libcap2-bin / libcap package)." >&2
fi

VERSION=$(bun -e "try { console.log(require('./wails.json').Info.productVersion) } catch(e) { console.log('dev') }" 2>/dev/null || true)
if [ -z "$VERSION" ]; then
    VERSION="dev"
fi

if command -v openssl &> /dev/null; then
    BUILDHASH=$(openssl rand -hex 4)
else
    BUILDHASH=$(printf '%08x' "$RANDOM$RANDOM" 2>/dev/null || echo unknown)
fi

WAILS_LDFLAGS="-X main.version=${VERSION} -X main.variant=dev -X main.buildHash=${BUILDHASH}"

echo "Starting Wails dev..."
echo "Version: ${VERSION}"
echo "Build hash: ${BUILDHASH}"
wails dev -ldflags "${WAILS_LDFLAGS}" "$@"
