#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

usage() {
    cat <<'USAGE'
Usage: scripts/linux/install.sh [options]

  --prefix DIR   Install location (default ~/.local, or $BEAM_PREFIX)
  --no-build     Skip the build, use the existing build/bin/Beam
  --no-setcap    Do not grant capabilities (the app requests them at startup)
  -h, --help     This help
USAGE
}

PREFIX="${BEAM_PREFIX:-$HOME/.local}"
DO_BUILD=1
DO_SETCAP=1

while [ $# -gt 0 ]; do
    case "$1" in
        --prefix)
            if [ $# -lt 2 ]; then
                echo "ERROR: --prefix requires a path" >&2
                exit 1
            fi
            PREFIX="$2"
            shift 2
            ;;
        --no-build)  DO_BUILD=0; shift ;;
        --no-setcap) DO_SETCAP=0; shift ;;
        -h|--help)   usage; exit 0 ;;
        *)
            echo "ERROR: unknown argument: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [ "$(id -u)" = "0" ] && [ "${BEAM_ALLOW_ROOT:-0}" != "1" ]; then
    echo "ERROR: do not run install.sh as root. Root is only needed for setcap and the script requests it itself." >&2
    echo "       If this is intentional (for example --prefix /usr/local): BEAM_ALLOW_ROOT=1 $0 ..." >&2
    exit 1
fi

SRC_BIN="$ROOT/build/bin/Beam"
SRC_ICON="$ROOT/build/appicon.png"
BIN_DIR="$PREFIX/bin"
BIN="$BIN_DIR/beam"
ICON="$PREFIX/share/beam/icon.png"
DESKTOP="$PREFIX/share/applications/beam.desktop"

if [ "$DO_BUILD" = "1" ]; then
    "$ROOT/scripts/linux/build.sh"
fi

if [ ! -f "$SRC_BIN" ]; then
    echo "ERROR: $SRC_BIN not found - build the project (drop --no-build)." >&2
    exit 1
fi

if command -v pgrep &> /dev/null && pgrep -x beam &> /dev/null; then
    echo "Beam is running - stopping it before replacing the binary..."
    pkill -x beam || true
    sleep 1
fi

echo "Installing to $PREFIX ..."
install -Dm755 "$SRC_BIN" "$BIN"

if [ -f "$SRC_ICON" ]; then
    install -Dm644 "$SRC_ICON" "$ICON"
else
    echo "WARNING: $SRC_ICON not found - the launcher will have no icon." >&2
    ICON="beam"
fi

EXEC="$BIN"
case "$EXEC" in
    *[[:space:]]*) EXEC="\"$EXEC\"" ;;
esac

mkdir -p "$(dirname "$DESKTOP")"
cat > "$DESKTOP" <<EOF
[Desktop Entry]
Type=Application
Name=BEAM
Comment=Fast VPN client
Exec=$EXEC
Icon=$ICON
Terminal=false
StartupNotify=false
StartupWMClass=beam
Categories=Network;
EOF
chmod 644 "$DESKTOP"

if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$(dirname "$DESKTOP")" || true
fi

# --- capabilities ---------------------------------------------------------
if [ "$DO_SETCAP" = "1" ]; then
    FSTYPE="$(stat -f -c %T "$BIN_DIR" 2>/dev/null || echo unknown)"
    case "$FSTYPE" in
        v9fs|9p|vboxsf|fuseblk|ntfs|msdos|vfat|exfat|smb*|nfs*|cifs|overlayfs)
            echo "WARNING: $BIN_DIR lives on filesystem '$FSTYPE', which does not store file capabilities." >&2
            echo "         Install Beam on a regular ext4/btrfs partition, otherwise TUN will not work." >&2
            DO_SETCAP=0
            ;;
    esac
fi

if [ "$DO_SETCAP" = "1" ]; then
    SETCAP=""
    for candidate in setcap /usr/sbin/setcap /sbin/setcap; do
        if command -v "$candidate" &> /dev/null; then
            SETCAP="$candidate"
            break
        fi
    done

    if [ -z "$SETCAP" ]; then
        echo "WARNING: setcap not found (libcap2-bin / libcap package) - the app will request privileges at startup." >&2
    else
        echo "Granting cap_net_admin,cap_net_raw (requires root)..."
        if command -v sudo &> /dev/null; then
            sudo "$SETCAP" cap_net_admin,cap_net_raw+eip "$BIN"
        elif command -v pkexec &> /dev/null; then
            pkexec "$SETCAP" cap_net_admin,cap_net_raw+eip "$BIN"
        else
            echo "WARNING: neither sudo nor pkexec found - the app will request privileges at startup." >&2
        fi
    fi
fi

case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *)
        echo ""
        echo "WARNING: $BIN_DIR is not in PATH - the 'beam' command will not be found in a terminal." >&2
        echo "         Add to ~/.bashrc or ~/.zshrc: export PATH=\"\$HOME/.local/bin:\$PATH\"" >&2
        ;;
esac

echo ""
echo "Done."
echo "  Binary:   $BIN"
echo "  Launcher: $DESKTOP"
echo ""
echo "Run: beam (or from the application menu)"
echo "Uninstall: scripts/linux/uninstall.sh"
echo ""
echo "Note: capabilities are bound to a specific file, not to its name."
echo "They must be granted again after every reinstall or binary update -"
echo "this script does it for you; on a manual replace the app asks via pkexec."
