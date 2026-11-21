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
    echo "ERROR: do not run build.sh with sudo - the app elevates itself at startup (see internal/platform/privilege_darwin.go)."
    echo "       sudo here only leaves frontend/dist and frontend/wailsjs root-owned and breaks the next normal build."
    exit 1
fi

require_tool wails || exit 1
require_tool bun || exit 1
require_tool go || exit 1

# create-dmg (sindresorhus/create-dmg, `npm install --global create-dmg`) —
HAVE_CREATE_DMG=1
if ! command -v create-dmg &> /dev/null; then
    HAVE_CREATE_DMG=0
    echo "NOTE: create-dmg not found in PATH - DMG will not be built (npm install --global create-dmg)"
fi

VERSION=$(bun -e "try { console.log(require('./wails.json').Info.productVersion) } catch(e) { console.log('dev') }" 2>/dev/null)
if [ -z "$VERSION" ]; then
    VERSION="dev"
fi

BUILDHASH=$(openssl rand -hex 4 2>/dev/null)
if [ -z "$BUILDHASH" ]; then
    BUILDHASH="unknown"
fi

# Auto-update needs nothing from the build: the feed URL and its public key
# live in code (internal/application/update/ota). Publishing is a separate
# step - see docs/ota.md.

WAILS_LDFLAGS="-X main.version=${VERSION} -X main.variant=release -X main.buildHash=${BUILDHASH}"
RELAY_LDFLAGS="-X main.variant=release"
PLATFORM="${BEAM_MAC_PLATFORM:-darwin/universal}"

build_relay() {
    local out="$1"
    if [ "$PLATFORM" = "darwin/universal" ]; then
        local tmp_amd64 tmp_arm64
        tmp_amd64="$(mktemp)"
        tmp_arm64="$(mktemp)"
        GOOS=darwin GOARCH=amd64 go build -trimpath -ldflags "${RELAY_LDFLAGS}" -o "$tmp_amd64" ./cmd/beam-relay || return 1
        GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags "${RELAY_LDFLAGS}" -o "$tmp_arm64" ./cmd/beam-relay || return 1
        lipo -create -output "$out" "$tmp_amd64" "$tmp_arm64"
        local lipo_status=$?
        rm -f "$tmp_amd64" "$tmp_arm64"
        return $lipo_status
    fi
    GOOS=darwin GOARCH="${PLATFORM#darwin/}" go build -trimpath -ldflags "${RELAY_LDFLAGS}" -o "$out" ./cmd/beam-relay
}

echo "Building Beam (macOS, ${PLATFORM})..."
echo "Version: ${VERSION}"
echo "Build hash: ${BUILDHASH}"
wails build -trimpath -clean -platform "${PLATFORM}" -ldflags "${WAILS_LDFLAGS}" "$@"
build_status=$?
if [ $build_status -ne 0 ]; then
    exit $build_status
fi

APP_PATH="build/bin/Beam.app"
if [ -d "$APP_PATH" ]; then
    RELAY_PATH="${APP_PATH}/Contents/MacOS/beam-relay"
    if build_relay "$RELAY_PATH"; then
        chmod +x "$RELAY_PATH"
    else
        echo "WARNING: beam-relay build failed - auto-update will not work in this build"
        rm -f "$RELAY_PATH"
    fi

    if ! codesign --force --deep --sign - "$APP_PATH"; then
        echo "WARNING: ad-hoc codesign failed (not critical for a local run)"
    fi
    echo ""
    echo "App bundle ready: ${APP_PATH}"

    # The OTA payload on macOS is the zipped bundle; beam-relay swaps it in.
    ZIP_PATH="build/bin/Beam.zip"
    rm -f "$ZIP_PATH"
    if ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"; then
        OTA_TARGET="darwin-universal"
        if [ "$PLATFORM" != "darwin/universal" ]; then
            OTA_TARGET="darwin-${PLATFORM#darwin/}"
        fi
        echo "Update zip ready: ${ZIP_PATH}"
        echo "Releases are normally built and shipped by CI: push tag v${VERSION} (see docs/ota.md)."
        echo "To ship this local build by hand instead:"
        echo "  go run ./cmd/beam-ota publish -target ${OTA_TARGET} -live -file Beam.zip=${ZIP_PATH} -notes release-notes/${VERSION}.ru.txt"
    else
        echo "WARNING: failed to build ${ZIP_PATH} - nothing to serve for auto-update, the .app itself is fine"
    fi

    if [ "$HAVE_CREATE_DMG" = "1" ]; then
        rm -f build/bin/*.dmg
        if create-dmg --overwrite --no-code-sign "$APP_PATH" "build/bin"; then
            DMG_PATH=$(ls -t build/bin/*.dmg 2>/dev/null | head -1)
            if [ -n "$DMG_PATH" ]; then
                echo "DMG ready: ${DMG_PATH}"
            else
                echo "WARNING: create-dmg exited without an error but no .dmg was found in build/bin"
            fi
        else
            echo "WARNING: create-dmg failed - the .app is still built and working, just without a DMG"
        fi
    fi
else
    echo "WARNING: ${APP_PATH} not found after the build"
fi
