import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Ban,
    ChevronRight,
    Clock,
    Cpu,
    Info,
    Plug,
    X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAppIcons } from "@/hooks/useAppIcons"
import type { ActiveConnection } from "@/hooks/useConnections"
import { cn } from "@/lib/utils"
import { CloseConnections } from "@wailsjs/go/handlers/VPNHandler"
import { Trans } from "react-i18next"
import { formatNumber } from "@/i18n/intl"
import { t } from "@/i18n"
import { formatBytesShort } from "@/lib/format"

// ── форматирование ──────────────────────────────────────────────────────────

const fmtBytes = formatBytesShort

function fmtSpeed(bps: number): string {
    return bps >= 1 ? t("logs.connections.unit.perSecond", { value: fmtBytes(bps) }) : "—"
}

function fmtDuration(seconds: number): string {
    if (seconds < 60) return t("common.duration.seconds", { value: Math.max(0, Math.round(seconds)) })
    const m = Math.floor(seconds / 60)
    if (m < 60) return t("common.duration.minutes", { value: m })
    const h = Math.floor(m / 60)
    return m % 60 ? t("common.duration.hoursMinutes", { h, m: m % 60 }) : t("common.duration.hours", { h })
}

function fmtAgo(ms: number): string {
    const s = Math.max(0, Math.round((Date.now() - ms) / 1000))
    return s < 60 ? t("common.duration.secondsAgo", { value: s }) : t("common.duration.minutesAgo", { value: Math.floor(s / 60) })
}

function appTitle(name: string): string {
    return name.replace(/\.exe$/i, "")
}

const PROTOCOLS: Record<string, string> = {
    tls: "TLS",
    http1: "HTTP",
    http: "HTTP",
    http2: "HTTP/2",
    quic: "QUIC",
    bittorrent: "BitTorrent",
}

// ── маршрут и правило ────────────────────────────────────────────────────────

type Route = "proxy" | "direct" | "block" | "dns"

function routeOf(c: ActiveConnection): Route {
    if (c.route === "proxy" || c.route === "direct" || c.route === "block" || c.route === "dns") return c.route
    if (c.outbound === "block") return "block"
    if (c.outbound?.startsWith("direct")) return "direct"
    return "proxy"
}

const ROUTE_STYLE: Record<Route, { labelKey: "vpn" | "direct" | "block" | "dns"; className: string }> = {
    proxy: { labelKey: "vpn", className: "bg-primary/12 text-primary" },
    direct: { labelKey: "direct", className: "bg-emerald-500/12 text-emerald-500" },
    block: { labelKey: "block", className: "bg-destructive/12 text-destructive" },
    dns: { labelKey: "dns", className: "bg-muted text-muted-foreground" },
}

function RouteBadge({ route, extra, className }: { route: Route | "mixed"; extra?: string; className?: string }) {
    const style =
        route === "mixed"
            ? { label: t("logs.connections.route.mixed"), className: "bg-amber-500/12 text-amber-500" }
            : { label: t(`logs.connections.route.${ROUTE_STYLE[route].labelKey}`), className: ROUTE_STYLE[route].className }
    return (
        <span
            className={cn(
                "inline-flex max-w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                style.className,
                className,
            )}
        >
            {style.label}
            {extra && <span className="truncate opacity-80">· {extra}</span>}
        </span>
    )
}

/** Почему соединение пошло туда, куда пошло. Тег правила: "<kind>|<n>|<label>". */
function ruleText(c: ActiveConnection): string {
    const [kind, , label] = (c.rule || "").split("|")
    if (kind === "user") return label ? t("logs.connections.rule.user", { label }) : t("logs.connections.rule.routing")
    if (kind === "lan") return t("logs.connections.rule.lan")
    if (kind === "dns") return t("logs.connections.rule.dns")
    if (kind === "final") return t("logs.connections.rule.final")
    switch (c.ruleKind) {
        case "app":
            return t("logs.connections.rule.app")
        case "lan":
            return t("logs.connections.rule.lan")
        case "dns":
            return t("logs.connections.rule.dns")
        case "rules":
            return t("logs.connections.rule.routing")
        case "default":
            return t("logs.connections.rule.final")
    }
    return ""
}

// ── скорость ────────────────────────────────────────────────────────────────────

type Rate = { up: number; down: number }

/** Скорость каждого соединения — по приросту байтов между опросами. */
function useRates(connections: ActiveConnection[]): Map<string, Rate> {
    const prev = useRef<{ at: number; bytes: Map<string, Rate> }>({ at: 0, bytes: new Map() })
    const [rates, setRates] = useState<Map<string, Rate>>(new Map())

    useEffect(() => {
        const now = performance.now()
        const dt = (now - prev.current.at) / 1000
        const bytes = new Map<string, Rate>()
        const next = new Map<string, Rate>()
        for (const c of connections) {
            if (c.closed) continue
            bytes.set(c.id, { up: c.upload, down: c.download })
            const before = prev.current.bytes.get(c.id)
            if (before && dt > 0.2) {
                next.set(c.id, {
                    up: Math.max(0, (c.upload - before.up) / dt),
                    down: Math.max(0, (c.download - before.down) / dt),
                })
            }
        }
        prev.current = { at: now, bytes }
        setRates(next)
    }, [connections])

    return rates
}

// ── группировка по приложениям ──────────────────────────────────────────────────

interface AppGroup {
    key: string
    name: string
    path: string
    live: ActiveConnection[]
    closed: ActiveConnection[]
    up: number
    down: number
    rate: Rate
    // Seconds the oldest live connection is open. Taken from the backend's
    // monotonic duration, not Date.now() - startedAt: changing the system
    // clock must not make it jump.
    uptime: number
    route: Route | "mixed"
    blocked: number
}

function groupByApp(connections: ActiveConnection[], rates: Map<string, Rate>, tunnel: boolean): AppGroup[] {
    const groups = new Map<string, AppGroup>()
    for (const c of connections) {
        const key = (c.processPath || c.process || "").toLowerCase()
        let g = groups.get(key)
        if (!g) {
            const name = c.process ? appTitle(c.process) : tunnel ? t("logs.connections.system") : t("logs.connections.all")
            g = { key, name, path: c.processPath || "", live: [], closed: [], up: 0, down: 0, rate: { up: 0, down: 0 }, uptime: 0, route: "proxy", blocked: 0 }
            groups.set(key, g)
        }
        g.up += c.upload || 0
        g.down += c.download || 0
        if (routeOf(c) === "block") g.blocked++
        if (c.closed) {
            g.closed.push(c)
            continue
        }
        g.live.push(c)
        const r = rates.get(c.id)
        if (r) {
            g.rate.up += r.up
            g.rate.down += r.down
        }
        if ((c.duration || 0) > g.uptime) g.uptime = c.duration
    }

    for (const g of groups.values()) {
        // Маршрут считаем по соединениям с данными: DNS и блоки не делают приложение «смешанным».
        const all = [...g.live, ...g.closed].map(routeOf)
        const carrying = new Set(all.filter((r) => r === "proxy" || r === "direct"))
        if (carrying.size > 1) g.route = "mixed"
        else if (carrying.size === 1) g.route = [...carrying][0]
        else if (all.includes("block")) g.route = "block"
        else g.route = all[0] ?? "proxy"
    }

    return [...groups.values()].sort((a, b) => {
        // Сначала те, у кого есть живые соединения, затем по трафику.
        if ((a.live.length > 0) !== (b.live.length > 0)) return a.live.length > 0 ? -1 : 1
        return b.up + b.down - (a.up + a.down)
    })
}

function matches(c: ActiveConnection, q: string): boolean {
    return [c.domain, c.host, c.destination, c.process, c.nodeName, ruleText(c)]
        .some((v) => v?.toLowerCase().includes(q))
}

// ── мелкие компоненты ──────────────────────────────────────────────────────────────

function Hint({ children }: { children: ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
                    aria-label={t("common.action.details")}
                >
                    <Info className="h-3.5 w-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64">
                <p className="leading-snug">{children}</p>
            </TooltipContent>
        </Tooltip>
    )
}

function AppIcon({ group, icon, size = "md" }: { group: AppGroup; icon: string | null; size?: "md" | "lg" }) {
    const box = size === "lg" ? "h-11 w-11 rounded-xl" : "h-9 w-9 rounded-lg"
    const img = size === "lg" ? "h-7 w-7" : "h-5 w-5"
    if (icon) {
        return (
            <div className={cn("flex shrink-0 items-center justify-center bg-muted/40", box)}>
                <img src={icon} alt="" className={cn("object-contain", img)} draggable={false} />
            </div>
        )
    }
    return (
        <div className={cn("flex shrink-0 items-center justify-center bg-primary/10 text-sm font-semibold uppercase text-primary", box)}>
            {group.key === "" ? (group.name === t("logs.connections.system") ? <Cpu className="h-4 w-4" /> : <Plug className="h-4 w-4" />) : group.name.slice(0, 1)}
        </div>
    )
}

function Traffic({ up, down, className }: { up: number; down: number; className?: string }) {
    return (
        <div className={cn("flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground", className)}>
            <span className="flex items-center gap-0.5">
                <ArrowDown className="h-3 w-3" />
                {fmtBytes(down)}
            </span>
            <span className="flex items-center gap-0.5">
                <ArrowUp className="h-3 w-3" />
                {fmtBytes(up)}
            </span>
        </div>
    )
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="text-sm font-medium tabular-nums">{value}</span>
        </div>
    )
}

function Empty({ text, sub }: { text: string; sub?: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            </div>
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{text}</p>
                {sub && <p className="text-[11px] text-muted-foreground/70">{sub}</p>}
            </div>
        </div>
    )
}

async function closeConnections(ids: string[]) {
    if (ids.length === 0) return
    try {
        const res = await CloseConnections(ids)
        if (!res.success) toast.error(t("logs.toast.closeFailed"), { description: res.error })
        else if (ids.length > 1) toast.success(t("logs.toast.closedMany", { count: res.data }))
    } catch {
        toast.error(t("logs.toast.closeFailed"))
    }
}

// ── список приложений ───────────────────────────────────────────────────────────────

function AppRow({ group, icon, onOpen }: { group: AppGroup; icon: string | null; onOpen: () => void }) {
    const idle = group.live.length === 0
    const speed = group.rate.up + group.rate.down
    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                "animate-list-item group flex w-full items-center gap-3 rounded-xl border border-border/40 bg-sidebar px-3 py-2.5 text-start transition-colors hover:border-primary/40 hover:bg-primary/5",
                idle && "opacity-60",
            )}
        >
            <AppIcon group={group} icon={icon} />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">{group.name}</span>
                    <RouteBadge route={group.route} />
                    {group.blocked > 0 && group.route !== "block" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/12 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            <Ban className="h-2.5 w-2.5" />
                            {group.blocked}
                        </span>
                    )}
                </div>
                <div className="flex min-w-0 items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">
                        {idle ? t("logs.connections.group.idle") : t("logs.connections.group.active", { count: group.live.length })}
                    </span>
                    {!idle && group.uptime > 0 && (
                        <span className="flex items-center gap-1 tabular-nums">
                            <Clock className="h-3 w-3" />
                            {fmtDuration(group.uptime)}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={cn("text-xs font-medium tabular-nums", speed >= 1 ? "text-primary" : "text-muted-foreground")}>
                    {fmtSpeed(speed)}
                </span>
                <Traffic up={group.up} down={group.down} />
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </button>
    )
}

// ── соединения одного приложения ────────────────────────────────────────────────

// Высоты фиксированные: окно виртуального списка считается арифметикой.
const ROW_H = 52
const HEAD_H = 33
const GAP_H = 12
const OVERSCAN_PX = 400
// Сколько закрытых показываем: торрент за 2 минуты закрывает тысячи UDP-потоков.
const CLOSED_LIMIT = 300

const sameConn = (a: ActiveConnection, b: ActiveConnection) =>
    a === b ||
    (a.id === b.id &&
        a.upload === b.upload &&
        a.download === b.download &&
        a.duration === b.duration &&
        a.closed === b.closed &&
        a.endedAt === b.endedAt &&
        a.domain === b.domain &&
        a.host === b.host &&
        a.destination === b.destination &&
        a.route === b.route &&
        a.rule === b.rule &&
        a.ruleKind === b.ruleKind &&
        a.protocol === b.protocol &&
        a.network === b.network &&
        a.nodeName === b.nodeName)

interface ConnRowProps {
    conn: ActiveConnection
    up: number
    down: number
    last: boolean
    /** «закрыто … назад» считает родитель: строка обновится, только когда сменится текст. */
    ago: string
}

// Строка перерисовывается, только если поменялись её собственные данные.
const ConnRow = memo(function ConnRow({ conn, up, down, last, ago }: ConnRowProps) {
    const route = routeOf(conn)
    const name = conn.domain || conn.host || conn.destination || "—"
    const proto = PROTOCOLS[conn.protocol?.toLowerCase()] ?? ""
    const rule = ruleText(conn)
    const speed = up + down

    return (
        <div
            className={cn(
                "group flex items-center gap-3 border-x border-border/40 bg-sidebar px-4 transition-colors hover:bg-muted/40",
                last ? "rounded-b-xl border-b" : "border-b",
            )}
            style={{ height: ROW_H }}
        >
            <span
                className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    conn.closed ? "bg-muted-foreground/50" : route === "block" ? "bg-destructive" : "bg-emerald-500",
                )}
            />

            <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", conn.closed && "opacity-55")}>
                <span className="truncate text-xs font-medium text-foreground/90" title={name}>{name}</span>
                <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                    {conn.domain && conn.destination && (
                        <span className="truncate font-mono">{conn.destination}</span>
                    )}
                    <span className="shrink-0 uppercase">{conn.network || "tcp"}</span>
                    {proto && <span className="shrink-0">· {proto}</span>}
                </div>
            </div>

            <div className={cn("hidden w-44 shrink-0 flex-col items-start gap-0.5 md:flex", conn.closed && "opacity-55")}>
                <RouteBadge route={route} extra={route === "proxy" ? conn.nodeName : undefined} />
                {rule && <span className="max-w-full truncate text-[10px] text-muted-foreground" title={rule}>{rule}</span>}
            </div>

            <div className={cn("flex w-28 shrink-0 flex-col items-end gap-0.5", conn.closed && "opacity-55")}>
                <Traffic up={conn.upload} down={conn.download} />
                <span className="text-[10px] tabular-nums text-muted-foreground">
                    {conn.closed
                        ? t("logs.connections.row.closedAgo", { ago })
                        : speed >= 1
                            ? `${fmtSpeed(speed)} · ${fmtDuration(conn.duration)}`
                            : fmtDuration(conn.duration)}
                </span>
            </div>

            <div className="flex w-6 shrink-0 justify-end">
                {!conn.closed && route !== "block" && (
                    <button
                        type="button"
                        onClick={() => void closeConnections([conn.id])}
                        className="rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title={t("logs.connections.row.close")}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}, (a, b) => a.up === b.up && a.down === b.down && a.last === b.last && a.ago === b.ago && sameConn(a.conn, b.conn))

const SectionHead = memo(function SectionHead({ closed, count, total }: { closed: boolean; count: number; total: number }) {
    return (
        <div className="h-full overflow-hidden rounded-t-xl border border-border/40 bg-sidebar">
            <div className="flex h-full items-center gap-1.5 bg-muted/10 px-4 text-[11px] font-medium text-muted-foreground">
                {closed ? t("logs.connections.section.closed") : t("logs.connections.section.active")} · {count}
                {total > count && <span className="text-muted-foreground/70">{t("logs.connections.section.of", { total })}</span>}
                {closed && <Hint>{t("logs.connections.section.closedHint")}</Hint>}
            </div>
        </div>
    )
})

type VItem =
    | { kind: "head"; key: string; closed: boolean; count: number; total: number }
    | { kind: "row"; key: string; conn: ActiveConnection; last: boolean }
    | { kind: "gap"; key: string }

const itemHeight = (it: VItem) => (it.kind === "row" ? ROW_H : it.kind === "head" ? HEAD_H : GAP_H)

function AppDetail({
    group,
    icon,
    rates,
    onBack,
}: {
    group: AppGroup
    icon: string | null
    rates: Map<string, Rate>
    onBack: () => void
}) {
    const live = useMemo(() => [...group.live].sort((a, b) => b.download + b.upload - (a.download + a.upload)), [group.live])
    const closed = useMemo(
        () => [...group.closed].sort((a, b) => b.endedAt - a.endedAt).slice(0, CLOSED_LIMIT),
        [group.closed],
    )
    const closable = useMemo(() => live.filter((c) => routeOf(c) !== "block").map((c) => c.id), [live])
    const speed = group.rate.up + group.rate.down

    // Плоский список: заголовок секции, строки, отступ — с префиксными смещениями.
    const { items, offsets, total } = useMemo(() => {
        const items: VItem[] = []
        if (live.length > 0) {
            items.push({ kind: "head", key: "h-live", closed: false, count: live.length, total: live.length })
            live.forEach((c, i) => items.push({ kind: "row", key: c.id, conn: c, last: i === live.length - 1 }))
        }
        if (closed.length > 0) {
            if (items.length > 0) items.push({ kind: "gap", key: "gap" })
            items.push({ kind: "head", key: "h-closed", closed: true, count: closed.length, total: group.closed.length })
            closed.forEach((c, i) => items.push({ kind: "row", key: `c-${c.id}`, conn: c, last: i === closed.length - 1 }))
        }
        const offsets = new Array<number>(items.length)
        let y = 0
        items.forEach((it, i) => {
            offsets[i] = y
            y += itemHeight(it)
        })
        return { items, offsets, total: y }
    }, [live, closed, group.closed.length])

    const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [viewH, setViewH] = useState(0)
    useLayoutEffect(() => {
        if (!viewport) return
        let frame = 0
        const measure = () => setViewH(viewport.clientHeight)
        const onScroll = () => {
            if (frame) return
            frame = requestAnimationFrame(() => {
                frame = 0
                setScrollTop(viewport.scrollTop)
            })
        }
        measure()
        setScrollTop(viewport.scrollTop)
        const observer = new ResizeObserver(measure)
        observer.observe(viewport)
        viewport.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            if (frame) cancelAnimationFrame(frame)
            observer.disconnect()
            viewport.removeEventListener("scroll", onScroll)
        }
    }, [viewport])

    // Видимое окно — бинарным поиском по смещениям.
    const from = Math.max(0, scrollTop - OVERSCAN_PX)
    const to = scrollTop + viewH + OVERSCAN_PX
    let lo = 0
    let hi = items.length
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (offsets[mid] + itemHeight(items[mid]) <= from) lo = mid + 1
        else hi = mid
    }
    const windowed: number[] = []
    for (let i = lo; i < items.length && offsets[i] < to; i++) windowed.push(i)

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} title={t("common.action.back")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <AppIcon group={group} icon={icon} size="lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold">{group.name}</span>
                        <RouteBadge route={group.route} />
                    </div>
                    {group.path && (
                        <span className="truncate font-mono text-[10px] text-muted-foreground" title={group.path}>
                            {group.path}
                        </span>
                    )}
                </div>
                {closable.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5 text-xs hover:border-destructive/40 hover:text-destructive"
                        title={t("logs.connections.detail.closeAll")}
                        onClick={() => void closeConnections(closable)}
                    >
                        <X className="h-3.5 w-3.5" />
                        <span className="max-sm:hidden">{t("logs.connections.detail.closeAll")}</span>
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4">
                <Stat label={t("logs.connections.detail.speed")} value={fmtSpeed(speed)} />
                <Stat label={t("logs.connections.detail.downloaded")} value={fmtBytes(group.down)} />
                <Stat label={t("logs.connections.detail.uploaded")} value={fmtBytes(group.up)} />
                <Stat label={t("logs.connections.detail.uptime")} value={group.uptime ? fmtDuration(group.uptime) : "—"} />
            </div>

            {items.length === 0 ? (
                <Empty text={t("logs.connections.noConnections")} />
            ) : (
                <ScrollArea viewportRef={setViewport} className="min-h-0 flex-1" viewportClassName="[&>div]:!block">
                    <div className="px-4 pb-4">
                        <div className="relative w-full" style={{ height: total }}>
                            {windowed.map((i) => {
                                const it = items[i]
                                return (
                                    <div
                                        key={it.key}
                                        className="absolute start-0 end-0"
                                        style={{ top: offsets[i], height: itemHeight(it) }}
                                    >
                                        {it.kind === "row" ? (
                                            <ConnRow
                                                conn={it.conn}
                                                up={it.conn.closed ? 0 : rates.get(it.conn.id)?.up ?? 0}
                                                down={it.conn.closed ? 0 : rates.get(it.conn.id)?.down ?? 0}
                                                last={it.last}
                                                ago={it.conn.closed ? fmtAgo(it.conn.endedAt) : ""}
                                            />
                                        ) : it.kind === "head" ? (
                                            <SectionHead closed={it.closed} count={it.count} total={it.total} />
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </ScrollArea>
            )}
        </div>
    )
}

// ── вкладка целиком ────────────────────────────────────────────────────────────────

export default function ConnectionsView({ connections, search }: { connections: ActiveConnection[]; search: string }) {
    const [selected, setSelected] = useState<string | null>(null)
    const rates = useRates(connections)

    // В режиме прокси маршрут не заполняется: приложения не различить.
    const tunnel = connections.some((c) => c.route)

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return connections
        return connections.filter((c) => matches(c, q))
    }, [connections, search])

    const groups = useMemo(() => groupByApp(visible, rates, tunnel), [visible, rates, tunnel])
    const getIcon = useAppIcons(useMemo(() => groups.map((g) => g.path).filter(Boolean), [groups]))

    const current = selected !== null ? groups.find((g) => g.key === selected) : undefined
    // Приложение закрылось и выпало из окна истории — возвращаемся к списку.
    useEffect(() => {
        if (selected !== null && !current && !search) setSelected(null)
    }, [selected, current, search])

    if (current) {
        return <AppDetail group={current} icon={getIcon(current.path)} rates={rates} onBack={() => setSelected(null)} />
    }

    if (groups.length === 0) {
        return search
            ? <Empty text={t("common.nothingFound")} />
            : <Empty text={t("logs.connections.empty")} sub={t("logs.connections.emptyHint")} />
    }

    const liveCount = visible.filter((c) => !c.closed).length
    const totalRate = groups.reduce((sum, g) => ({ up: sum.up + g.rate.up, down: sum.down + g.rate.down }), { up: 0, down: 0 })

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/40 px-4 py-2.5 text-[11px] text-muted-foreground">
                <span>
                    <Trans
                        i18nKey="logs.connections.summary.apps"
                        values={{ count: groups.length }}
                        components={{ b: <span className="font-medium text-foreground tabular-nums" /> }}
                    />
                </span>
                <span>
                    <Trans
                        i18nKey="logs.connections.summary.connections"
                        count={liveCount}
                        components={{ b: <span className="font-medium text-foreground tabular-nums" /> }}
                    />
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                    <ArrowDown className="h-3 w-3" />
                    {fmtSpeed(totalRate.down)}
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                    <ArrowUp className="h-3 w-3" />
                    {fmtSpeed(totalRate.up)}
                </span>
                {!tunnel && (
                    <span className="ms-auto flex items-center gap-1">
                        {t("logs.connections.summary.noPerApp")}
                        <Hint>{t("logs.connections.summary.noPerAppHint")}</Hint>
                    </span>
                )}
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-2 p-4">
                    {groups.map((g) => (
                        <AppRow key={g.key || "@system"} group={g} icon={getIcon(g.path)} onOpen={() => setSelected(g.key)} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
