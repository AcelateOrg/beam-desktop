import { TitleBarDoubleClick } from "@wailsjs/go/handlers/WindowHandler"
import { isWailsNative } from "@/lib/wails-safe"

const DEFAULT_DRAG_PROPERTY = "--wails-draggable"
const DEFAULT_DRAG_VALUE = "drag"

type WailsFlags = { cssDragProperty?: string; cssDragValue?: string }

function isDragRegion(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false
    const flags = (window as unknown as { wails?: { flags?: WailsFlags } }).wails?.flags
    const property = flags?.cssDragProperty ?? DEFAULT_DRAG_PROPERTY
    const value = flags?.cssDragValue ?? DEFAULT_DRAG_VALUE
    return getComputedStyle(target).getPropertyValue(property).trim() === value
}

let installed = false

// Wails v2 starts a native drag on the first mousedown of a drag region and
// ignores later ones, so the OS never sees a caption double-click. The first
// click's mouseup is eaten by the native move loop, which makes `dblclick`
// unreliable; the second mousedown still arrives with detail === 2.
export function installTitleBarDoubleClick(): void {
    if (installed || !isWailsNative()) return
    installed = true

    window.addEventListener(
        "mousedown",
        (event) => {
            if (event.button !== 0 || event.detail !== 2) return
            if (!isDragRegion(event.target)) return
            event.preventDefault()
            TitleBarDoubleClick().catch((error) => {
                console.warn("[titlebar] double-click action failed:", error)
            })
        },
        { capture: true }
    )
}
