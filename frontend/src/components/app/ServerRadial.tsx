import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import ReactCountryFlag from "@/components/ui/country-flag"
import { Globe2, LayoutGrid } from "lucide-react"

import { useNodes } from "@/hooks/useNodes"
import { parseNodeName } from "@/lib/nodeName"
import { getServerUsage } from "@/lib/serverUsage"
import { cn } from "@/lib/utils"
import { useVPNStore, type PingMap } from "@/stores/vpnStore"
import { t } from "@/i18n"

// Радиальное меню серверов вокруг кнопки подключения.
// Зажал → потянул к серверу → отпустил. Сектор выбирается по направлению,
// целиться не нужно. Отпустил в центре или Esc — отмена. ПКМ открывает
// то же меню «по клику» — для тех, кому неудобно держать.

export const RADIAL_HOLD_MS = 280
const DRAG_OPEN_PX = 14
const MAX_SLOTS = 8
const CLOSE_MS = 160

type RadialItem =
    | { kind: "node"; id: string; name: string; countryCode: string | null; current: boolean }
    | { kind: "more"; id: "@more"; rest: number }

interface Geometry {
    cx: number
    cy: number
    btnR: number
    ringR: number
}

type Mode = "hold" | "sticky"

function buildItems(
    categories: ReturnType<typeof useNodes>["categories"],
    selectedId: string | null,
): RadialItem[] {
    const all = categories.flatMap((c) => c.nodes)
    if (all.length === 0) return []

    // Закреплённые, потом самые частые, потом как у провайдера. По пингу не сортируем:
    // он скачет, а рука запоминает направление к серверу.
    const usage = getServerUsage()
    const byUse = (list: typeof all) =>
        list
            .map((n, i) => ({ n, i, u: usage[n.id] ?? 0 }))
            .sort((a, b) => b.u - a.u || a.i - b.i)
            .map((x) => x.n)
    const ordered = [...byUse(all.filter((n) => n.isPinned)), ...byUse(all.filter((n) => !n.isPinned))]
    let picked = ordered
    let rest = 0
    if (ordered.length > MAX_SLOTS) {
        picked = ordered.slice(0, MAX_SLOTS - 1)
        const current = ordered.find((n) => n.id === selectedId)
        if (current && !picked.includes(current)) picked[picked.length - 1] = current
        rest = ordered.length - picked.length
    }

    const items: RadialItem[] = picked.map((n) => {
        const { countryCode, displayName } = parseNodeName(decodeURIComponent(n.name))
        return { kind: "node", id: n.id, name: displayName, countryCode, current: n.id === selectedId }
    })
    if (rest > 0) items.push({ kind: "more", id: "@more", rest })
    return items
}

function pingOf(map: PingMap, id: string): number | null {
    const r = map[id]
    return r && r.status === "ok" && r.latency > 0 ? r.latency : null
}

function pingClass(ms: number) {
    if (ms < 150) return "text-emerald-400"
    if (ms < 300) return "text-amber-400"
    return "text-red-400"
}

/** Угол слота: 0 — сверху, дальше по часовой. */
const slotAngle = (i: number, n: number) => (i / n) * Math.PI * 2

/** Клин от центра до радиуса r с центром сверху — мягкий «прожектор» на выбранный сервер. */
function wedgePath(r: number, half: number): string {
    const p = (a: number) => `${(Math.sin(a) * r).toFixed(2)} ${(-Math.cos(a) * r).toFixed(2)}`
    return `M 0 0 L ${p(-half)} A ${r} ${r} 0 0 1 ${p(half)} Z`
}

function Flag({ code, size }: { code: string | null; size: number }) {
    return (
        <span
            className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted"
            style={{ width: size, height: size }}
        >
            {code ? (
                <ReactCountryFlag
                    countryCode={code}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    className="absolute inset-0"
                />
            ) : (
                <Globe2 className="text-muted-foreground" style={{ width: size * 0.6, height: size * 0.6 }} />
            )}
        </span>
    )
}

// ── жест ──────────────────────────────────────────────────────────────────────

export function useServerRadial({
    buttonRef,
    enabled,
    isConnected,
    onConnect,
}: {
    buttonRef: RefObject<HTMLButtonElement | null>
    enabled: boolean
    isConnected: boolean
    onConnect: () => void
}) {
    const navigate = useNavigate()
    const { categories, selectedNodeId, selectNode } = useNodes()
    const [open, setOpen] = useState(false)
    // Счётчики читаем на каждом открытии: за сессию они меняются.
    const items = useMemo(() => buildItems(categories, selectedNodeId), [categories, selectedNodeId, open])
    const usable = enabled && items.length >= 2

    const [closing, setClosing] = useState(false)
    const [mode, setMode] = useState<Mode>("hold")
    const [charging, setCharging] = useState(false)
    const [geom, setGeom] = useState<Geometry | null>(null)
    const [active, setActive] = useState(-1)

    const timerRef = useRef<number | null>(null)
    const startRef = useRef<{ x: number; y: number; id: number } | null>(null)
    const suppressClickRef = useRef(false)
    const openRef = useRef(false)
    const geomRef = useRef<Geometry | null>(null)
    const activeRef = useRef(-1)

    const clearTimer = () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current)
        timerRef.current = null
        setCharging(false)
    }

    const measure = useCallback((): Geometry | null => {
        const el = buttonRef.current
        if (!el) return null
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const btnR = r.width / 2
        // Кольцо не должно вылезать за окно: в мини-режиме оно наезжает на край кнопки.
        const maxH = Math.min(cx, window.innerWidth - cx) - 46
        const maxV = Math.min(cy, window.innerHeight - cy) - 40
        const ringR = Math.max(btnR * 0.78, Math.min(btnR + 62, maxH, maxV))
        return { cx, cy, btnR, ringR }
    }, [buttonRef])

    const pick = useCallback((x: number, y: number) => {
        const g = geomRef.current
        if (!g) return
        const dx = x - g.cx
        const dy = y - g.cy
        let next = -1
        if (Math.hypot(dx, dy) > Math.min(g.btnR * 0.38, g.ringR * 0.45)) {
            let a = Math.atan2(dx, -dy)
            if (a < 0) a += Math.PI * 2
            next = Math.round(a / ((Math.PI * 2) / items.length)) % items.length
        }
        if (next !== activeRef.current) {
            activeRef.current = next
            setActive(next)
        }
    }, [items.length])

    const openMenu = useCallback((m: Mode, at?: { x: number; y: number }) => {
        clearTimer()
        const g = measure()
        if (!g) return
        geomRef.current = g
        activeRef.current = -1
        openRef.current = true
        setGeom(g)
        setActive(-1)
        setMode(m)
        setClosing(false)
        setOpen(true)
        if (at) pick(at.x, at.y)
    }, [measure, pick])

    const close = useCallback(() => {
        openRef.current = false
        setClosing(true)
        window.setTimeout(() => {
            setOpen(false)
            setClosing(false)
        }, CLOSE_MS)
    }, [])

    const commit = useCallback((index: number) => {
        close()
        const item = items[index]
        if (!item) return
        if (item.kind === "more") {
            navigate("/nodes")
            return
        }
        void (async () => {
            if (!item.current) await selectNode(item.id)
            // Выбор сервера на выключенном VPN — это «подключись сюда».
            const status = useVPNStore.getState().status
            if (status === "disconnected" || status === "error") onConnect()
        })()
    }, [close, items, navigate, selectNode, onConnect])

    // Esc и смена размера окна закрывают меню.
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
            if (e.key === "Enter" && activeRef.current >= 0) commit(activeRef.current)
        }
        window.addEventListener("keydown", onKey)
        window.addEventListener("resize", close)
        window.addEventListener("blur", close)
        return () => {
            window.removeEventListener("keydown", onKey)
            window.removeEventListener("resize", close)
            window.removeEventListener("blur", close)
        }
    }, [open, close, commit])

    useEffect(() => () => clearTimer(), [])

    const handlers = {
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
            if (!usable || e.button !== 0 || openRef.current) return
            startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
            try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
            setCharging(true)
            timerRef.current = window.setTimeout(() => {
                timerRef.current = null
                const s = startRef.current
                openMenu("hold", s ? { x: s.x, y: s.y } : undefined)
            }, RADIAL_HOLD_MS)
        },
        onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
            if (openRef.current && mode === "hold") {
                pick(e.clientX, e.clientY)
                return
            }
            const s = startRef.current
            // Потянул сразу — намерение очевидно, ждать таймер не нужно.
            if (s && timerRef.current !== null && Math.hypot(e.clientX - s.x, e.clientY - s.y) > DRAG_OPEN_PX) {
                openMenu("hold", { x: e.clientX, y: e.clientY })
            }
        },
        onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
            startRef.current = null
            try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
            if (timerRef.current !== null) {
                clearTimer()
                return // обычный клик
            }
            if (openRef.current && mode === "hold") {
                suppressClickRef.current = true
                const idx = activeRef.current
                if (idx >= 0) commit(idx)
                else close()
            }
        },
        onPointerCancel: () => {
            startRef.current = null
            clearTimer()
            if (openRef.current) close()
        },
        onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault()
            if (!usable) return
            openMenu("sticky")
        },
    }

    /** Кнопка спрашивает перед toggle: клик после жеста — не клик. */
    const consumeClick = () => {
        if (suppressClickRef.current || openRef.current) {
            suppressClickRef.current = false
            return true
        }
        return false
    }

    const overlay = open && geom
        ? (
            <RadialOverlay
                geom={geom}
                items={items}
                active={active}
                mode={mode}
                closing={closing}
                isConnected={isConnected}
                onMove={pick}
                onCommit={commit}
                onClose={close}
            />
        )
        : null

    return { handlers, consumeClick, overlay, charging: charging && usable, usable }
}

// ── отрисовка ─────────────────────────────────────────────────────────────────

function RadialOverlay({
    geom,
    items,
    active,
    mode,
    closing,
    isConnected,
    onMove,
    onCommit,
    onClose,
}: {
    geom: Geometry
    items: RadialItem[]
    active: number
    mode: Mode
    closing: boolean
    isConnected: boolean
    onMove: (x: number, y: number) => void
    onCommit: (index: number) => void
    onClose: () => void
}) {
    const pingMap = useVPNStore((s) => s.pingMap)
    const [shown, setShown] = useState(false)
    useEffect(() => {
        const id = requestAnimationFrame(() => setShown(true))
        return () => cancelAnimationFrame(id)
    }, [])
    const visible = shown && !closing

    const { cx, cy, btnR, ringR } = geom
    const n = items.length
    const step = (Math.PI * 2) / n
    const chip = ringR - btnR < 40 ? 38 : 44
    const centerR = Math.max(36, Math.min(btnR, ringR - chip / 2 - 10))
    const glowR = ringR + chip + 24
    const box = glowR * 2

    // Подсветка крутится кратчайшим путём: из слота 7 в 0 — вперёд, а не назад по кругу.
    const rotRef = useRef(0)
    if (active >= 0) {
        const target = (active * 360) / n
        const cur = rotRef.current
        let delta = ((target - cur) % 360 + 540) % 360 - 180
        if (Math.abs(delta) < 0.001) delta = 0
        rotRef.current = cur + delta
    }

    const current = active >= 0 ? items[active] : null
    const currentPing = current?.kind === "node" ? pingOf(pingMap, current.id) : null
    const accent = (pct: number) => `color-mix(in oklab, var(--sidebar-primary) ${pct}%, transparent)`
    const fg = (pct: number) => `color-mix(in oklab, var(--foreground) ${pct}%, transparent)`
    const spring = "cubic-bezier(0.2, 1.3, 0.3, 1)"

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-[70] select-none",
                mode === "sticky" ? "pointer-events-auto" : "pointer-events-none",
            )}
            onPointerMove={mode === "sticky" ? (e) => onMove(e.clientX, e.clientY) : undefined}
            onPointerDown={mode === "sticky" ? (e) => {
                if (e.button !== 0) return onClose()
                if (active >= 0) onCommit(active)
                else onClose()
            } : undefined}
            onContextMenu={(e) => { e.preventDefault(); onClose() }}
        >
            {/* Затемнение — то же стекло, что у попапов клиента */}
            <div
                className="absolute inset-0"
                style={{
                    opacity: visible ? 1 : 0,
                    background: "color-mix(in oklab, var(--background) 82%, transparent)",
                    backdropFilter: "blur(16px) saturate(1.1)",
                    transition: "opacity 200ms ease",
                }}
            />

            {/* Акцентное свечение под кольцом, как вокруг кнопки подключения */}
            <div
                className="pointer-events-none absolute rounded-full"
                style={{
                    left: cx - glowR,
                    top: cy - glowR,
                    width: glowR * 2,
                    height: glowR * 2,
                    background: `radial-gradient(closest-side, ${accent(active >= 0 ? 10 : 7)}, transparent 70%)`,
                    opacity: visible ? 1 : 0,
                    transform: `scale(${visible ? 1 : 0.6})`,
                    transition: `opacity 260ms ease, transform 420ms ${spring}, background 300ms ease`,
                }}
            />

            <div className="absolute" style={{ left: cx, top: cy, width: 0, height: 0 }}>
                {/* Направляющая и луч к выбранному серверу */}
                <svg
                    width={box}
                    height={box}
                    viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
                    className="pointer-events-none absolute overflow-visible"
                    style={{
                        left: -box / 2,
                        top: -box / 2,
                        opacity: visible ? 1 : 0,
                        transform: `scale(${visible ? 1 : 0.8}) rotate(${visible ? 0 : -25}deg)`,
                        transition: `opacity 220ms ease, transform 460ms ${spring}`,
                    }}
                >
                    <defs>
                        <radialGradient id="beam-radial-wedge" cx="0" cy="0" r={ringR + chip / 2 + 14} gradientUnits="userSpaceOnUse">
                            <stop offset={centerR / (ringR + chip / 2 + 14)} stopColor="var(--sidebar-primary)" stopOpacity="0" />
                            <stop offset="0.86" stopColor="var(--sidebar-primary)" stopOpacity="0.16" />
                            <stop offset="1" stopColor="var(--sidebar-primary)" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    <circle r={ringR} fill="none" stroke={fg(7)} strokeWidth={1} />

                    <g
                        style={{
                            transform: `rotate(${rotRef.current}deg)`,
                            transition: `transform 260ms ${spring}, opacity 180ms ease`,
                            opacity: active >= 0 ? 1 : 0,
                        }}
                    >
                        <path d={wedgePath(ringR + chip / 2 + 14, Math.min(step * 0.42, 0.5))} fill="url(#beam-radial-wedge)" />
                    </g>
                </svg>

                {/* Центр: стеклянный диск с превью выбора */}
                <div
                    className="absolute flex flex-col items-center justify-center rounded-full text-center"
                    style={{
                        width: centerR * 2,
                        height: centerR * 2,
                        left: -centerR,
                        top: -centerR,
                        background: "color-mix(in oklab, var(--card) 80%, transparent)",
                        boxShadow: `0 0 0 1px ${fg(7)}, 0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.05)`,
                        opacity: visible ? 1 : 0,
                        transform: `scale(${visible ? 1 : 0.9})`,
                        transition: `opacity 180ms ease, transform 300ms ${spring}, box-shadow 250ms ease`,
                    }}
                >
                    {current?.kind === "node" ? (
                        <div key={current.id} className="flex flex-col items-center gap-1.5 px-4 animate-in fade-in zoom-in-95 duration-150">
                            <span className="rounded-full" style={{ boxShadow: `0 0 0 1px ${fg(10)}, 0 6px 16px -6px rgba(0,0,0,0.5)` }}>
                                <Flag code={current.countryCode} size={Math.round(centerR * 0.44)} />
                            </span>
                            <span className="truncate text-sm font-semibold leading-tight tracking-tight" style={{ maxWidth: centerR * 1.55 }}>
                                {current.name}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                {currentPing !== null && (
                                    <span className={cn("font-mono font-semibold", pingClass(currentPing))}>{t("common.unit.ms", { value: currentPing })}</span>
                                )}
                                {current.current
                                    ? (isConnected ? t("home.radial.alreadyHere") : t("home.radial.connect"))
                                    : (isConnected ? t("home.radial.switch") : t("home.radial.connect"))}
                            </span>
                        </div>
                    ) : current?.kind === "more" ? (
                        <div key="more" className="flex flex-col items-center gap-1.5 px-4 animate-in fade-in zoom-in-95 duration-150">
                            <LayoutGrid className="text-sidebar-primary" style={{ width: centerR * 0.34, height: centerR * 0.34 }} />
                            <span className="text-sm font-semibold tracking-tight">{t("home.radial.allServers")}</span>
                            <span className="text-[11px] font-medium text-muted-foreground">{t("home.radial.more", { count: current.rest })}</span>
                        </div>
                    ) : (
                        <div key="idle" className="flex flex-col items-center gap-2 px-4 animate-in fade-in duration-150">
                            <span
                                aria-hidden
                                className="block bg-current text-foreground/20"
                                style={{
                                    width: centerR * 0.5,
                                    height: centerR * 0.5,
                                    WebkitMaskImage: "url(/beam.png)",
                                    maskImage: "url(/beam.png)",
                                    WebkitMaskSize: "contain",
                                    maskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    maskRepeat: "no-repeat",
                                    WebkitMaskPosition: "center",
                                    maskPosition: "center",
                                }}
                            />
                            <span className="text-xs font-medium text-muted-foreground">
                                {mode === "hold" ? t("home.radial.hintHold") : t("home.radial.hintClick")}
                            </span>
                        </div>
                    )}
                </div>

                {/* Серверы по кругу */}
                {items.map((item, i) => {
                    const a = slotAngle(i, n)
                    const x = Math.sin(a) * ringR
                    const y = -Math.cos(a) * ringR
                    const isActive = i === active
                    const dimmed = active >= 0 && !isActive
                    const labelAbove = Math.cos(a) > 0.35
                    const ping = item.kind === "node" ? pingOf(pingMap, item.id) : null
                    const delay = visible ? i * 20 : 0
                    return (
                        <div
                            key={item.id}
                            className="absolute start-0 top-0"
                            style={{
                                transform: visible
                                    ? `translate(${x}px, ${y}px)`
                                    : `translate(${x * 0.4}px, ${y * 0.4}px)`,
                                opacity: visible ? (dimmed ? 0.5 : 1) : 0,
                                transition: `transform 420ms ${spring} ${delay}ms, opacity 200ms ease ${active >= 0 ? 0 : delay}ms`,
                            }}
                        >
                            <div
                                className={cn("absolute start-0 top-0 flex items-center gap-1.5", labelAbove ? "flex-col-reverse" : "flex-col")}
                                style={{
                                    // Центр кружка — в точке слота, подпись смотрит наружу от кольца.
                                    transform: labelAbove
                                        ? `translate(-50%, calc(-100% + ${chip / 2}px))`
                                        : `translate(-50%, ${-chip / 2}px)`,
                                }}
                            >
                                <div
                                    className="relative flex shrink-0 items-center justify-center rounded-full"
                                    style={{
                                        width: chip,
                                        height: chip,
                                        background: isActive
                                            ? "color-mix(in oklab, var(--sidebar-primary) 14%, var(--card))"
                                            : "var(--card)",
                                        boxShadow: isActive
                                            ? `0 0 0 1.5px ${accent(85)}, 0 0 18px -4px ${accent(55)}`
                                            : `0 0 0 1px ${fg(8)}, 0 8px 18px -10px rgba(0,0,0,0.6)`,
                                        transform: `scale(${isActive ? 1.1 : 1})`,
                                        transition: `transform 260ms ${spring}, box-shadow 200ms ease, background 200ms ease`,
                                    }}
                                >
                                    {item.kind === "node" ? (
                                        <Flag code={item.countryCode} size={chip - 16} />
                                    ) : (
                                        <span className="flex flex-col items-center leading-none text-muted-foreground">
                                            <LayoutGrid className="h-4 w-4" />
                                            <span className="mt-0.5 text-[9px] font-bold">+{item.rest}</span>
                                        </span>
                                    )}
                                    {item.kind === "node" && item.current && (
                                        <span
                                            className="absolute bottom-0.5 end-0.5 h-2 w-2 rounded-full bg-sidebar-primary"
                                            style={{ boxShadow: "0 0 0 2px var(--card)" }}
                                        />
                                    )}
                                </div>
                                <div className="flex max-w-[88px] flex-col items-center text-center">
                                    <span
                                        className={cn(
                                            "w-full truncate text-[11px] leading-tight transition-colors duration-150",
                                            isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                                        )}
                                                                            >
                                        {item.kind === "node" ? item.name : t("home.radial.allShort")}
                                    </span>
                                    {ping !== null && (
                                        <span className={cn("font-mono text-[9.5px] font-semibold leading-tight", pingClass(ping))}>
                                            {t("common.unit.ms", { value: ping })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>,
        document.body,
    )
}
