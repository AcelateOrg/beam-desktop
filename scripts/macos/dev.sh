#!/bin/zsh

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1

require_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo "ERROR: Required tool not found in PATH: $1"
        return 1
    fi
    return 0
}

if [ "$(id -u)" = "0" ]; then
    echo "ERROR: do not run dev.sh with sudo - the app elevates itself at startup (see internal/platform/privilege_darwin.go)."
    echo "       sudo here only leaves frontend/dist and frontend/wailsjs root-owned and breaks the next normal build."
    exit 1
fi

require_tool wails || exit 1
require_tool bun || exit 1

VERSION=$(bun -e "try { console.log(require('./wails.json').Info.productVersion) } catch(e) { console.log('dev') }" 2>/dev/null)
if [ -z "$VERSION" ]; then
    VERSION="dev"
fi

BUILDHASH=$(openssl rand -hex 4 2>/dev/null)
if [ -z "$BUILDHASH" ]; then
    BUILDHASH="unknown"
fi

WAILS_LDFLAGS="-X main.version=${VERSION} -X main.variant=dev -X main.buildHash=${BUILDHASH}"

echo "Starting Wails dev..."
echo "Version: ${VERSION}"
echo "Build hash: ${BUILDHASH}"
wails dev -ldflags "${WAILS_LDFLAGS}" "$@"
