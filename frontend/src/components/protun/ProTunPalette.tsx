import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react"
import { createPortal } from "react-dom"
import { GitMerge, Plus, StickyNote, X } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
    DESTINATION_ADD_OPTIONS,
    fixedOptionsOf,
    isResizableKind,
    NODE_META,
    SOURCE_ADD_OPTIONS,
    type ProTunRuleKind,
} from "@/lib/protun/meta"
import { RULE_NODE_DEFAULT_HEIGHT, RULE_NODE_DEFAULT_WIDTH } from "@/lib/protun/codec"
import type { ProTunLogicOp } from "@/lib/protun/types"
import { LOGIC_META } from "./nodes/LogicNode"
import { NodeCardDivider, NodeCardHeader, NodeCardNote, NodeCardShell } from "./nodes/NodeShell"
import { t } from "@/i18n"

export type PaletteItem =
    | { type: "rule"; kind: ProTunRuleKind }
    | { type: "logic"; op: ProTunLogicOp }
    | { type: "comment" }

type Point = { x: number; y: number }

// A card taken from the palette. "drag" follows the pressed pointer and lands
// on release; "click" follows the pointer until the canvas is clicked.
export type PalettePlacement = {
    item: PaletteItem
    mode: "drag" | "click"
    // Where the card was grabbed, in card pixels.
    grab: Point | null
    point: Point | null
}

// Palette cards are exactly as wide as canvas cards, so the grab point maps
// 1:1 onto the ghost.
const CARD_WIDTH = RULE_NODE_DEFAULT_WIDTH
const COMMENT_SIZE = { width: 220, height: 130 }
const PALETTE_WIDTH = CARD_WIDTH + 32
const DRAG_THRESHOLD = 4

// Class of a node that has just been placed from the palette (see style.css).
export const PROTUN_LANDING_CLASS = "protun-node-land"

function itemKey(item: PaletteItem): string {
    if (item.type === "rule") return item.kind
    if (item.type === "logic") return `logic-${item.op}`
    return "comment"
}

function CommentFrame({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("flex flex-col rounded-lg border border-dashed border-border bg-muted transition-colors", className)}>
            {children}
        </div>
    )
}

// Palette entry: the header of the card it creates.
function PaletteCard({ item, active }: { item: PaletteItem; active: boolean }) {
    if (item.type === "comment") {
        return (
            <CommentFrame className={active ? "border-primary ring-2 ring-primary" : "hover:border-muted-foreground"}>
                <NodeCardHeader icon={StickyNote} iconClassName="text-muted-foreground" title={t("protun.comment.title")} description={t("protun.comment.description")} />
            </CommentFrame>
        )
    }
    if (item.type === "logic") {
        const meta = LOGIC_META[item.op]
        return (
            <NodeCardShell selected={active} accentBar={meta.accentBar}>
                <NodeCardHeader icon={GitMerge} iconClassName={meta.accentText} title={meta.label} description={meta.description} />
            </NodeCardShell>
        )
    }
    const meta = NODE_META[item.kind]
    return (
        <NodeCardShell selected={active} accentBar={meta.accentBar}>
            <NodeCardHeader icon={meta.icon} iconClassName={meta.accentText} title={meta.label} description={meta.description} />
        </NodeCardShell>
    )
}

// Static copy of a freshly created card, shown while it is being placed.
function GhostCard({ item }: { item: PaletteItem }) {
    if (item.type === "comment") {
        return (
            <div style={COMMENT_SIZE}>
                <CommentFrame className="h-full w-full gap-1.5 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <StickyNote className="h-3 w-3" />
                        <span className="text-[10px] font-medium uppercase tracking-wide">{t("protun.comment.title")}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t("protun.comment.placeholder")}</p>
                </CommentFrame>
            </div>
        )
    }
    if (item.type === "logic") {
        const meta = LOGIC_META[item.op]
        return (
            <NodeCardShell accentBar={meta.accentBar}>
                <NodeCardHeader icon={GitMerge} iconClassName={meta.accentText} title={meta.label} description={meta.description} />
                <NodeCardDivider />
                <NodeCardNote dotClassName={meta.accentBar}>{meta.note}</NodeCardNote>
            </NodeCardShell>
        )
    }

    const meta = NODE_META[item.kind]
    const resizable = isResizableKind(item.kind)
    const fixedOptions = fixedOptionsOf(item.kind)
    let body: React.ReactNode
    if (fixedOptions) {
        body = (
            <div className="flex flex-col gap-1 p-2">
                {fixedOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2.5 rounded-md border border-transparent px-2.5 py-1.5">
                        <span className="h-3.5 w-3.5 shrink-0 rounded-[calc(var(--radius)*0.35)] border border-muted-foreground/50" />
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium leading-tight text-foreground">{option.label}</span>
                            <span className="block truncate text-[10px] leading-tight text-muted-foreground">{option.hint}</span>
                        </span>
                    </div>
                ))}
            </div>
        )
    } else if (resizable) {
        body = (
            <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2.5">
                <div className="mb-2 flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-border/70">
                    <p className="text-[10px] text-muted-foreground">{t("protun.palette.emptyList")}</p>
                </div>
                <div className="flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground">
                    <Plus className="h-3 w-3" />
                    {t("protun.palette.add")}
                </div>
            </div>
        )
    } else {
        body = <NodeCardNote dotClassName={meta.accentBar}>{meta.statusText}</NodeCardNote>
    }

    const card = (
        <NodeCardShell accentBar={meta.accentBar} className={resizable ? "h-full w-full" : undefined}>
            <NodeCardHeader icon={meta.icon} iconClassName={meta.accentText} title={meta.label} description={meta.description} />
            <NodeCardDivider />
            {body}
        </NodeCardShell>
    )
    return resizable ? <div style={{ width: RULE_NODE_DEFAULT_WIDTH, height: RULE_NODE_DEFAULT_HEIGHT }}>{card}</div> : card
}

function PaletteGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            {children}
        </div>
    )
}

export function ProTunPalette({
    open,
    hasOtherNode,
    active,
    onPick,
    onCancel,
    onQuickAdd,
    onClose,
}: {
    open: boolean
    hasOtherNode: boolean
    active: PaletteItem | null
    onPick: (placement: PalettePlacement) => void
    onCancel: () => void
    // Keyboard activation: the card goes straight to the middle of the canvas.
    onQuickAdd: (item: PaletteItem) => void
    onClose: () => void
}) {
    const activeKey = active ? itemKey(active) : null
    const cleanupRef = useRef<(() => void) | null>(null)
    useEffect(() => () => cleanupRef.current?.(), [])

    // A press becomes a drag once the pointer moves; a press released in place
    // picks the card up for click placement (or drops it if already picked).
    const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, item: PaletteItem) => {
        if (e.button !== 0) return
        e.preventDefault()
        cleanupRef.current?.()
        const rect = e.currentTarget.getBoundingClientRect()
        const grab = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const start = { x: e.clientX, y: e.clientY }
        const key = itemKey(item)

        const cleanup = () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", cleanup)
            cleanupRef.current = null
        }
        const onMove = (ev: PointerEvent) => {
            if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_THRESHOLD) return
            cleanup()
            onPick({ item, mode: "drag", grab, point: { x: ev.clientX, y: ev.clientY } })
        }
        const onUp = () => {
            cleanup()
            if (key === activeKey) onCancel()
            else onPick({ item, mode: "click", grab: null, point: null })
        }
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", cleanup)
        cleanupRef.current = cleanup
    }

    const entry = (item: PaletteItem, disabled = false, note?: string) => {
        const key = itemKey(item)
        return (
            <button
                key={key}
                type="button"
                disabled={disabled}
                title={note}
                className={cn(
                    "block rounded-lg text-start outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"
                )}
                style={{ width: CARD_WIDTH }}
                onPointerDown={disabled ? undefined : (e) => onPointerDown(e, item)}
                onClick={(e) => {
                    // Pointer presses are handled above; detail 0 is Enter/Space.
                    if (e.detail === 0) onQuickAdd(item)
                }}
            >
                <PaletteCard item={item} active={key === activeKey} />
            </button>
        )
    }

    return (
        <aside
            data-protun-palette
            aria-hidden={!open}
            inert={!open}
            className={cn(
                "app-backdrop-clear shrink-0 overflow-hidden bg-background transition-[width,border-color] duration-200 ease-out",
                open ? "border-s border-border" : "border-s border-transparent"
            )}
            style={{ width: open ? PALETTE_WIDTH : 0 }}
        >
            <div className="flex h-full flex-col" style={{ width: PALETTE_WIDTH }}>
                <div className="flex shrink-0 items-start gap-2 px-4 pb-3 pt-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{t("protun.palette.title")}</p>
                        <p className="pt-0.5 text-[11px] leading-snug text-muted-foreground">
                            {t("protun.palette.hint")}
                        </p>
                    </div>
                    <button
                        type="button"
                        title={t("protun.palette.hide")}
                        aria-label={t("protun.palette.hide")}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={onClose}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                <ScrollArea className="min-h-0 flex-1">
                    <div className="flex flex-col gap-4 px-4 pb-4">
                        <PaletteGroup label={t("protun.palette.group.sources")}>
                            {SOURCE_ADD_OPTIONS.map((kind) => entry({ type: "rule", kind }))}
                        </PaletteGroup>
                        <PaletteGroup label={t("protun.palette.group.fallback")}>
                            {entry({ type: "rule", kind: "other" }, hasOtherNode, hasOtherNode ? t("protun.palette.alreadyOnCanvas") : undefined)}
                        </PaletteGroup>
                        <PaletteGroup label={t("protun.palette.group.destinations")}>
                            {DESTINATION_ADD_OPTIONS.map((kind) => entry({ type: "rule", kind }))}
                        </PaletteGroup>
                        <PaletteGroup label={t("protun.palette.group.logic")}>
                            {entry({ type: "logic", op: "and" })}
                            {entry({ type: "logic", op: "or" })}
                        </PaletteGroup>
                        <PaletteGroup label={t("protun.palette.group.other")}>{entry({ type: "comment" })}</PaletteGroup>
                    </div>
                </ScrollArea>
            </div>
        </aside>
    )
}

// Ghost of the card being placed: follows the pointer at canvas zoom with a
// marching dashed outline, and lands where it is released or clicked.
export function PalettePlacementLayer({
    placement,
    canvasRef,
    getZoom,
    onPlace,
    onCancel,
}: {
    placement: PalettePlacement | null
    canvasRef: RefObject<HTMLElement | null>
    getZoom: () => number
    // at is the screen position of the card's top-left corner.
    onPlace: (item: PaletteItem, at: Point) => void
    onCancel: () => void
}) {
    const ghostRef = useRef<HTMLDivElement>(null)
    // The canvas re-renders a lot; callbacks are read through a ref so the
    // pointer tracking below is set up once per placement.
    const handlers = useRef({ getZoom, onPlace, onCancel })
    handlers.current = { getZoom, onPlace, onCancel }

    useLayoutEffect(() => {
        if (!placement) return
        const getZoom = () => handlers.current.getZoom()
        const onPlace = (item: PaletteItem, at: Point) => handlers.current.onPlace(item, at)
        const onCancel = () => handlers.current.onCancel()
        const ghost = ghostRef.current
        const { item, mode } = placement
        const grab = placement.grab ?? { x: CARD_WIDTH / 2, y: 26 }
        let last = placement.point

        const inside = (p: Point) => {
            const r = canvasRef.current?.getBoundingClientRect()
            return !!r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom
        }
        const topLeft = (p: Point) => {
            const zoom = getZoom()
            return { x: p.x - grab.x * zoom, y: p.y - grab.y * zoom }
        }
        const render = () => {
            if (!ghost) return
            if (!last) {
                ghost.style.opacity = "0"
                return
            }
            const at = topLeft(last)
            ghost.style.transform = `translate(${at.x}px, ${at.y}px) scale(${getZoom()})`
            ghost.style.opacity = inside(last) ? "1" : mode === "drag" ? "0.45" : "0"
        }
        render()

        const root = document.documentElement
        root.classList.add(mode === "drag" ? "protun-placing-drag" : "protun-placing-click")

        const onMove = (e: PointerEvent) => {
            last = { x: e.clientX, y: e.clientY }
            render()
        }
        // Zooming with the wheel while a card is picked rescales the ghost.
        const onWheel = () => requestAnimationFrame(render)
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return
            e.preventDefault()
            e.stopPropagation()
            onCancel()
        }
        const onUp = (e: PointerEvent) => {
            const p = { x: e.clientX, y: e.clientY }
            if (inside(p)) onPlace(item, topLeft(p))
            else onCancel()
        }
        const onDown = (e: PointerEvent) => {
            const target = e.target as Element | null
            // The palette handles its own presses (switching or dropping the card).
            if (target?.closest("[data-protun-palette]")) return
            if (e.button !== 0) return
            const p = { x: e.clientX, y: e.clientY }
            if (!inside(p)) {
                onCancel()
                return
            }
            e.preventDefault()
            e.stopPropagation()
            onPlace(item, topLeft(p))
        }
        const onContextMenu = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            onCancel()
        }

        window.addEventListener("pointermove", onMove)
        window.addEventListener("wheel", onWheel, { passive: true })
        window.addEventListener("keydown", onKey, true)
        if (mode === "drag") {
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onCancel)
        } else {
            window.addEventListener("pointerdown", onDown, true)
            window.addEventListener("contextmenu", onContextMenu, true)
        }
        return () => {
            root.classList.remove("protun-placing-drag", "protun-placing-click")
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("wheel", onWheel)
            window.removeEventListener("keydown", onKey, true)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onCancel)
            window.removeEventListener("pointerdown", onDown, true)
            window.removeEventListener("contextmenu", onContextMenu, true)
        }
    }, [placement, canvasRef])

    if (!placement) return null
    return createPortal(
        <div
            ref={ghostRef}
            aria-hidden
            className="pointer-events-none fixed start-0 top-0 z-[60] origin-top-left transition-opacity duration-100"
            style={{ opacity: 0 }}
        >
            <div className={cn("relative", placement.mode === "click" ? "opacity-55" : "opacity-85")}>
                <GhostCard item={placement.item} />
            </div>
            <svg
                className="absolute -start-[5px] -top-[5px] h-[calc(100%+10px)] w-[calc(100%+10px)] overflow-visible text-primary"
                aria-hidden
            >
                <rect
                    x="1"
                    y="1"
                    rx="12"
                    ry="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    className="protun-march"
                />
            </svg>
        </div>,
        document.body
    )
}
