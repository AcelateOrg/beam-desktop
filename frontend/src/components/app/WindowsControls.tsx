import { createPortal } from "react-dom"
import { useRef, useEffect } from "react"
import { LuMinus, LuSquare, LuX } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { WindowToggleMaximise } from "@wailsjs/runtime/runtime"
import { CloseWindow, MinimizeWindow } from "@wailsjs/go/handlers/WindowHandler"
import { getPlatform } from "@/lib/platform"

export default function WindowControls() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new MutationObserver(() => {
            if (el.hasAttribute("inert")) el.removeAttribute("inert")
            if (el.getAttribute("aria-hidden") === "true") el.removeAttribute("aria-hidden")
        })

        observer.observe(el, { attributes: true, attributeFilter: ["inert", "aria-hidden"] })
        return () => observer.disconnect()
    }, [])

    if (getPlatform() !== 'windows') return null

    return createPortal(
        <div
            ref={ref}
            className="pointer-events-auto fixed top-0 end-0 z-[9999] flex gap-0.5 px-2 h-[var(--titlebar-height)] items-center"
            style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
        >
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-muted"
                onClick={() => void MinimizeWindow()}
            >
                <LuMinus className="h-3.5 w-3.5" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-muted"
                onClick={WindowToggleMaximise}
            >
                <LuSquare className="h-3 w-3" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => void CloseWindow()}
            >
                <LuX className="h-3.5 w-3.5" />
            </Button>
        </div>,
        document.body
    )
}
