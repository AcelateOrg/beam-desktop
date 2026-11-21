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
    echo "ERROR: do not run build.sh with sudo - the app elevates itself at startup (see internal/platform/privilege_linux.go)." >&2
    exit 1
fi

require_tool wails
require_tool bun
require_tool go

WEBKIT_TAG=""
if command -v pkg-config &> /dev/null; then
    if pkg-config --exists webkit2gtk-4.1; then
        WEBKIT_TAG="webkit2_41"
    elif pkg-config --exists webkit2gtk-4.0; then
        WEBKIT_TAG=""
    else
        echo "ERROR: webkit2gtk (4.1 or 4.0) not found - Wails will not build." >&2
        echo "  Debian/Ubuntu: sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libcap2-bin" >&2
        echo "  Fedora:        sudo dnf install gtk3-devel webkit2gtk4.1-devel libcap" >&2
        echo "  Arch:          sudo pacman -S gtk3 webkit2gtk-4.1 libcap" >&2
        exit 1
    fi
else
    echo "WARNING: pkg-config not found - cannot check webkit2gtk, building without the webkit2_41 tag (webkit2gtk-4.0 by default)." >&2
fi

if ! command -v setcap &> /dev/null && [ ! -x /usr/sbin/setcap ] && [ ! -x /sbin/setcap ]; then
    echo "WARNING: setcap not found - the app cannot grant itself cap_net_admin/cap_net_raw and TUN will not come up (libcap2-bin / libcap package)." >&2
fi
if ! command -v pkexec &> /dev/null; then
    echo "WARNING: pkexec not found - the privilege request falls back to sudo without a GUI dialog (polkit package)." >&2
fi
if ! command -v xdg-mime &> /dev/null; then
    echo "WARNING: xdg-mime not found - beam:// links cannot be registered (xdg-utils package)." >&2
fi

ARCH="${BEAM_ARCH:-}"
if [ -z "$ARCH" ]; then
    case "$(uname -m)" in
        x86_64|amd64)  ARCH="amd64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        *)
            echo "ERROR: unknown architecture $(uname -m) - set BEAM_ARCH manually." >&2
            exit 1
            ;;
    esac
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

# Auto-update needs nothing from the build: the feed URL and its public key
# live in code (internal/application/update/ota). Publishing is a separate
# step - see docs/ota.md.

# The core needs no build tags of its own; only the WebKit variant is picked here.
BUILD_TAGS="${WEBKIT_TAG}"
WAILS_LDFLAGS="-X main.version=${VERSION} -X main.variant=release -X main.buildHash=${BUILDHASH}"

echo "Building Beam (linux/${ARCH})..."
echo "Version: ${VERSION}"
echo "Build hash: ${BUILDHASH}"
echo "Tags: ${BUILD_TAGS}"

if [ -n "$BUILD_TAGS" ]; then
    wails build -trimpath -clean -platform "linux/${ARCH}" -tags "${BUILD_TAGS}" -ldflags "${WAILS_LDFLAGS}" "$@"
else
    wails build -trimpath -clean -platform "linux/${ARCH}" -ldflags "${WAILS_LDFLAGS}" "$@"
fi

echo ""
echo "Binary ready: build/bin/"

echo ""
echo "Releases are normally built and shipped by CI: push tag v${VERSION} (see docs/ota.md)."
echo "To ship this local build by hand instead (the installed binary is named 'beam'):"
echo "  go run ./cmd/beam-ota publish -target linux-${ARCH} -live -file beam=build/bin/Beam -notes release-notes/${VERSION}.ru.txt"
