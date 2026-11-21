#!/bin/zsh
# Release build for macOS, same steps as the macos job in .github/workflows/release.yml.
# Pull beam-desktop first (the script does not update itself), then run:
#   git pull --ff-only && ./scripts/macos/release.sh
set -euo pipefail
setopt null_glob

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PARENT="$(dirname "$ROOT")"
cd "$ROOT"

if [ "$(id -u)" = "0" ]; then
    echo "ERROR: do not run with sudo"
    exit 1
fi

for tool in wails bun go lipo codesign ditto create-dmg; do
    command -v "$tool" > /dev/null || { echo "ERROR: $tool not found in PATH (create-dmg: npm i -g create-dmg)"; exit 1; }
done

for repo in xray-core-beam beam-tun beam-bridge; do
    echo "Updating $repo..."
    git -C "$PARENT/$repo" pull --ff-only origin main
done

VERSION=$(bun -e "console.log(require('./wails.json').Info.productVersion)")
BUILDHASH=$(git rev-parse HEAD | cut -c1-8)
APP=build/bin/Beam.app
echo "Version: $VERSION"
echo "Build hash: $BUILDHASH"

wails build -trimpath -clean -platform darwin/universal -ldflags "-X main.version=$VERSION -X main.variant=release -X main.buildHash=$BUILDHASH"
[ -d "$APP" ] || { echo "ERROR: $APP not found after the build"; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
GOOS=darwin GOARCH=amd64 go build -trimpath -ldflags "-X main.variant=release" -o "$TMP/relay-amd64" ./cmd/beam-relay
GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags "-X main.variant=release" -o "$TMP/relay-arm64" ./cmd/beam-relay
lipo -create -output "$APP/Contents/MacOS/beam-relay" "$TMP/relay-amd64" "$TMP/relay-arm64"
chmod +x "$APP/Contents/MacOS/beam-relay"

for bin in "$APP"/Contents/MacOS/*; do
    archs="$(lipo -archs "$bin")"
    echo "$(basename "$bin"): $archs"
    [[ "$archs" == *x86_64* && "$archs" == *arm64* ]] || { echo "ERROR: $bin is not universal"; exit 1; }
done

codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"

ZIP=build/bin/Beam.zip
DMG="build/bin/Beam-$VERSION-macos-universal.dmg"
rm -f "$ZIP" build/bin/*.dmg
ditto -c -k --keepParent "$APP" "$ZIP"

# create-dmg exits 2 when the DMG is built but left unsigned.
create-dmg --overwrite --no-code-sign "$APP" build/bin || [ $? -eq 2 ]
dmgs=(build/bin/*.dmg(Nom))
BUILT_DMG="${dmgs[1]:-}"
[ -n "$BUILT_DMG" ] || { echo "ERROR: create-dmg produced no .dmg"; exit 1; }
mv "$BUILT_DMG" "$DMG"

echo
ls -la "$ZIP" "$DMG"
shasum -a 256 "$ZIP" "$DMG"
echo
echo "Send these two files for publishing: $ROOT/$ZIP and $ROOT/$DMG"
