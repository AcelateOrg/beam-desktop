#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'USAGE'
Usage: scripts/linux/uninstall.sh [options]

  --prefix DIR   Uninstall location (default ~/.local, or $BEAM_PREFIX)
  --purge        Also remove application data (configs, profiles, logs)
  -h, --help     This help
USAGE
}

PREFIX="${BEAM_PREFIX:-$HOME/.local}"
PURGE=0

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
        --purge)   PURGE=1; shift ;;
        -h|--help) usage; exit 0 ;;
        *)
            echo "ERROR: unknown argument: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

XDG_DATA="${XDG_DATA_HOME:-$HOME/.local/share}"
XDG_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}"

if command -v pgrep &> /dev/null && pgrep -x beam &> /dev/null; then
    echo "Stopping Beam..."
    pkill -x beam || true
    sleep 1
fi

remove() {
    if [ -e "$1" ]; then
        rm -rf "$1"
        echo "  removed: $1"
    fi
}

echo "Removing Beam..."

remove "$PREFIX/bin/beam"
remove "$PREFIX/share/beam"
remove "$PREFIX/share/applications/beam.desktop"

remove "$XDG_DATA/applications/beam-app.desktop"
remove "$XDG_CONFIG/autostart/beam-app.desktop"
remove "$XDG_CONFIG/autostart/beam-app-Dev.desktop"

if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$XDG_DATA/applications" || true
fi

if [ "$PURGE" = "1" ]; then
    remove "$XDG_CONFIG/Beam"
    remove "$XDG_CONFIG/Beam-Dev"
else
    echo ""
    echo "Application data kept: $XDG_CONFIG/Beam"
    echo "Remove it too: $0 --purge"
fi

echo ""
echo "Done."
