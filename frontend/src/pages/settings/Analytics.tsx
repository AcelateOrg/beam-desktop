import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
    AppWindow,
    ArrowDown,
    Cpu,
    ArrowUp,
    BarChart3,
    Clock,
    FolderOpen,
    Info,
    Plug,
    Route,
    Server,
    Trash2,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Label, Pie, PieChart, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Trans } from "react-i18next"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatBytesShort } from "@/lib/format"
import { t } from "@/i18n"
import { formatDate, formatNumber } from "@/i18n/intl"
import { isWailsNative } from "@/lib/wails-safe"
import { useAppIcons } from "@/hooks/useAppIcons"
import { GetAnalytics, ResetAnalytics } from "@wailsjs/go/handlers/SettingsHandler"
import type { analytics } from "@wailsjs/go/models"

type Period = "today" | "week" | "month" | "all"

const PERIODS: { value: Period; label: string }[] = [
    { value: "today", get label() { return t("settings.analytics.period.today") } },
    { value: "week", get label() { return t("settings.analytics.period.week") } },
    { value: "month", get label() { return t("settings.analytics.period.month") } },
    { value: "all", get label() { return t("settings.analytics.period.all") } },
]

/** Статистика копится раз в 10 секунд — чаще опрашивать незачем. */
const REFRESH_MS = 10_000

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const OTHERS_COLOR = "var(--muted-foreground)"

const PROXY_APP = "@proxy"

// ── форматирование ──────────────────────────────────────────────────────────

const fmtBytes = formatBytesShort

function fmtTime(seconds: number): string {
    if (!seconds || seconds < 60) {
        return seconds > 0
            ? t("common.duration.seconds", { value: Math.round(seconds) })
            : t("common.duration.minutes", { value: 0 })
    }
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0) return t("common.duration.minutes", { value: m })
    if (h >= 100 || m === 0) return t("common.duration.hours", { h })
    return t("common.duration.hoursMinutes", { h, m })
}

function parseDay(key: string): Date {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
}

function bucketLabel(key: string, hourly: boolean): string {
    if (hourly) return `${key.padStart(2, "0")}:00`
    return formatDate(parseDay(key), { day: "2-digit", month: "2-digit" })
}

function bucketTitle(key: string, hourly: boolean): string {
    if (hourly) {
        const h = Number(key)
        return `${String(h).padStart(2, "0")}:00 – ${String((h + 1) % 24).padStart(2, "0")}:00`
    }
    return formatDate(parseDay(key), { day: "numeric", month: "long", weekday: "short" })
}

function appName(item: analytics.Item): string {
    if (item.id === PROXY_APP) return t("settings.analytics.apps.viaProxy")
    if (!item.name) return t("settings.analytics.apps.system")
    return item.name.replace(/\.exe$/i, "")
}

const total = (x: { up: number; down: number }) => (x.up || 0) + (x.down || 0)

// ── данные ──────────────────────────────────────────────────────────────────

function useAnalytics(period: Period) {
    const [report, setReport] = useState<analytics.Report | null>(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!isWailsNative()) {
            setLoading(false)
            return
        }
        try {
            const res = await GetAnalytics(period)
            if (res.success && res.data) setReport(res.data)
        } catch {
            // Статистика — не критичный экран: просто оставляем прошлые данные.
        } finally {
            setLoading(false)
        }
    }, [period])

    useEffect(() => {
        setLoading(true)
        void load()
        const timer = window.setInterval(() => {
            if (document.visibilityState === "visible") void load()
        }, REFRESH_MS)
        return () => window.clearInterval(timer)
    }, [load])

    return { report, loading, reload: load }
}

// ── мелкие компоненты ───────────────────────────────────────────────────────

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
                {/* TooltipContent — flex-контейнер: без обёртки <b> и текст разъезжаются в колонки. */}
                <p className="leading-snug">{children}</p>
            </TooltipContent>
        </Tooltip>
    )
}

function Block({
    icon,
    title,
    hint,
    action,
    className,
    children,
}: {
    icon: ReactNode
    title: string
    hint?: ReactNode
    action?: ReactNode
    className?: string
    children: ReactNode
}) {
    return (
        <Card className={cn("animate-list-item gap-0 overflow-hidden bg-sidebar py-0", className)}>
            <div className="flex items-center gap-2.5 border-b border-border/40 bg-muted/10 px-4 py-3">
                <div className="rounded-lg bg-primary/10 p-1.5 text-primary">{icon}</div>
                <span className="text-sm font-medium">{title}</span>
                {hint && <Hint>{hint}</Hint>}
                {action && <div className="ms-auto">{action}</div>}
            </div>
            <div className="flex flex-1 flex-col p-4">{children}</div>
        </Card>
    )
}

function EmptyBlock({ text }: { text: string }) {
    return (
        <div className="flex min-h-32 flex-1 items-center justify-center text-center text-xs text-muted-foreground">
            {text}
        </div>
    )
}

function Segmented<T extends string>({
    value,
    options,
    onChange,
    size = "md",
    fill = false,
}: {
    value: T
    options: { value: T; label: string }[]
    onChange: (value: T) => void
    size?: "sm" | "md"
    /** Растянуть на всю ширину (второй этаж шапки в узком окне). */
    fill?: boolean
}) {
    return (
        <div className={cn("flex items-center rounded-lg bg-muted/60 p-0.5", fill && "w-full")}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "whitespace-nowrap rounded-md font-medium transition-all",
                        fill && "flex-1",
                        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
                        value === option.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

function Kpi({
    icon,
    label,
    value,
    sub,
    color,
}: {
    icon: ReactNode
    label: string
    value: string
    sub?: string
    color: string
}) {
    return (
        <Card className="animate-list-item min-w-0 gap-0 bg-sidebar px-4 py-3.5 @max-md:px-3 @max-md:py-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ color, backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)` }}
                >
                    {icon}
                </span>
                <span className="truncate">{label}</span>
            </div>
            <div className="mt-2 truncate whitespace-nowrap text-2xl font-semibold tabular-nums tracking-tight @max-md:text-xl" title={value}>
                {value}
            </div>
            <div className="mt-0.5 h-4 truncate text-[11px] text-muted-foreground" title={sub}>{sub}</div>
        </Card>
    )
}

function LegendRow({
    color,
    name,
    sub,
    value,
    share,
}: {
    color: string
    name: string
    sub?: string
    value: string
    share?: number
}) {
    return (
        <div className="flex items-center gap-2.5 py-1 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} />
            <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{name}</div>
                {sub && <div className="truncate text-[11px] text-muted-foreground">{sub}</div>}
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">{value}</span>
            {share !== undefined && (
                <span className="w-9 shrink-0 text-end tabular-nums font-medium">{Math.round(share)}%</span>
            )}
        </div>
    )
}

// ── блоки ───────────────────────────────────────────────────────────────────

const TRAFFIC_CONFIG = {
    down: { get label() { return t("settings.analytics.traffic.downloaded") }, color: "var(--chart-1)" },
    up: { get label() { return t("settings.analytics.traffic.uploaded") }, color: "var(--chart-2)" },
} satisfies ChartConfig

function TrafficBlock({ report }: { report: analytics.Report }) {
    const series = report.series ?? []
    const data = series.map((b) => ({ key: b.key, down: b.down || 0, up: b.up || 0 }))
    const hasData = data.some((b) => b.down + b.up > 0)

    return (
        <Block
            icon={<BarChart3 className="h-4 w-4" />}
            title={t("settings.analytics.traffic.title")}
            hint={report.hourly
                ? t("settings.analytics.traffic.hintHourly")
                : t("settings.analytics.traffic.hintDaily")}
            className="@3xl:col-span-3"
        >
            {hasData ? (
                <>
                    <ChartContainer config={TRAFFIC_CONFIG} className="aspect-auto h-52 w-full">
                        <BarChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="key"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={16}
                                tickFormatter={(key: string) => bucketLabel(key, report.hourly)}
                            />
                            <YAxis
                                width={60}
                                tickLine={false}
                                axisLine={false}
                                fontSize={11}
                                // Неразрывный пробел: иначе recharts переносит «МБ» на вторую строку.
                                tickFormatter={(v: number) => (v > 0 ? fmtBytes(v).replace(" ", "\u00a0") : "")}
                            />
                            <ChartTooltip
                                cursor={{ fillOpacity: 0.4 }}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(_, payload) => {
                                            const key = payload?.[0]?.payload?.key as string | undefined
                                            return key ? bucketTitle(key, report.hourly) : ""
                                        }}
                                        formatter={(value, name, item) => (
                                            <div className="flex w-full items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
                                                <span className="text-muted-foreground">
                                                    {TRAFFIC_CONFIG[name as keyof typeof TRAFFIC_CONFIG]?.label ?? name}
                                                </span>
                                                <span className="ms-auto font-medium tabular-nums">{fmtBytes(Number(value))}</span>
                                            </div>
                                        )}
                                    />
                                }
                            />
                            <Bar dataKey="down" stackId="t" fill="var(--color-down)" radius={[0, 0, 3, 3]} maxBarSize={28} />
                            <Bar dataKey="up" stackId="t" fill="var(--color-up)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ChartContainer>
                    <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-[2px] bg-(--chart-1)" /> {t("settings.analytics.traffic.downloaded")}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-[2px] bg-(--chart-2)" /> {t("settings.analytics.traffic.uploaded")}
                        </span>
                    </div>
                </>
            ) : (
                <EmptyBlock text={t("settings.analytics.traffic.empty")} />
            )}
        </Block>
    )
}

function Donut({
    data,
    center,
    caption,
    format = fmtBytes,
}: {
    data: { name: string; value: number; fill: string }[]
    center: string
    caption: string
    format?: (value: number) => string
}) {
    const config = useMemo(
        () => Object.fromEntries(data.map((d) => [d.name, { label: d.name, color: d.fill }])) as ChartConfig,
        [data],
    )
    return (
        <ChartContainer config={config} className="mx-auto aspect-square h-40">
            <PieChart>
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            hideLabel
                            nameKey="name"
                            formatter={(value, name, item) => (
                                <div className="flex w-full items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: item.payload?.fill }} />
                                    <span className="text-muted-foreground">{name}</span>
                                    <span className="ms-auto font-medium tabular-nums">{format(Number(value))}</span>
                                </div>
                            )}
                        />
                    }
                />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="64%"
                    outerRadius="100%"
                    paddingAngle={data.length > 1 ? 2 : 0}
                    cornerRadius={4}
                    strokeWidth={0}
                    isAnimationActive={false}
                >
                    <Label
                        content={({ viewBox }) => {
                            if (!viewBox || !("cx" in viewBox)) return null
                            const { cx, cy } = viewBox as { cx: number; cy: number }
                            return (
                                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan x={cx} y={cy - 6} className="fill-foreground text-base font-semibold">
                                        {center}
                                    </tspan>
                                    <tspan x={cx} y={cy + 13} className="fill-muted-foreground text-[10px]">
                                        {caption}
                                    </tspan>
                                </text>
                            )
                        }}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
    )
}

function RoutesBlock({ report }: { report: analytics.Report }) {
    const proxy = report.routes?.proxy || 0
    const direct = report.routes?.direct || 0
    const blocked = report.routes?.blocked || 0
    const sum = proxy + direct
    const data = [
        { name: t("settings.analytics.routes.proxy"), value: proxy, fill: "var(--chart-1)" },
        { name: t("settings.analytics.routes.direct"), value: direct, fill: "var(--chart-3)" },
    ].filter((d) => d.value > 0)

    return (
        <Block
            icon={<Route className="h-4 w-4" />}
            title={t("settings.analytics.routes.title")}
            hint={
                <Trans i18nKey="settings.analytics.routes.hint" components={{ b: <b /> }} />
            }
            className="@3xl:col-span-2"
        >
            {sum > 0 ? (
                <div className="flex flex-1 flex-col justify-center gap-3">
                    <Donut
                        data={data}
                        center={`${Math.round((proxy / sum) * 100)}%`}
                        caption={t("settings.analytics.routes.proxyCaption")}
                    />
                    <div>
                        <LegendRow color="var(--chart-1)" name={t("settings.analytics.routes.proxy")} value={fmtBytes(proxy)} share={(proxy / sum) * 100} />
                        <LegendRow color="var(--chart-3)" name={t("settings.analytics.routes.direct")} value={fmtBytes(direct)} share={(direct / sum) * 100} />
                        {blocked > 0 && (
                            <div className="mt-1.5 flex items-center justify-between rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs">
                                <span className="text-destructive">{t("settings.analytics.routes.blocked")}</span>
                                <span className="font-medium tabular-nums">
                                    {t("settings.analytics.routes.blockedCount", { count: blocked, value: formatNumber(blocked) })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <EmptyBlock text={t("settings.analytics.routes.empty")} />
            )}
        </Block>
    )
}

/** Топ-N и «Остальные» одной строкой. */
function topWithOthers(items: analytics.Item[], n: number, value: (i: analytics.Item) => number) {
    const sorted = [...items].sort((a, b) => value(b) - value(a)).filter((i) => value(i) > 0)
    const top = sorted.slice(0, n)
    const rest = sorted.slice(n)
    const others = rest.reduce((acc, i) => acc + value(i), 0)
    return { top, others, othersCount: rest.length }
}

function ProfilesBlock({ report }: { report: analytics.Report }) {
    const items = report.profiles ?? []
    const { top, others, othersCount } = topWithOthers(items, 4, total)
    const sum = top.reduce((acc, i) => acc + total(i), 0) + others

    const rows = top.map((item, index) => ({
        name: item.name || t("settings.analytics.untitled"),
        value: total(item),
        fill: PALETTE[index % PALETTE.length],
        seconds: item.seconds,
    }))
    if (others > 0) rows.push({ name: t("settings.analytics.others", { count: othersCount }), value: others, fill: OTHERS_COLOR, seconds: 0 })

    return (
        <Block
            icon={<FolderOpen className="h-4 w-4" />}
            title={t("settings.analytics.profiles.title")}
            hint={t("settings.analytics.profiles.hint")}
        >
            {sum > 0 ? (
                <div className="flex flex-1 flex-col gap-3">
                    <Donut data={rows} center={fmtBytes(sum)} caption={t("settings.analytics.totalCaption")} />
                    <div>
                        {rows.map((row) => (
                            <LegendRow
                                key={row.name}
                                color={row.fill}
                                name={row.name}
                                sub={row.seconds > 0 ? fmtTime(row.seconds) : undefined}
                                value={fmtBytes(row.value)}
                                share={(row.value / sum) * 100}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <EmptyBlock text={t("settings.analytics.empty.period")} />
            )}
        </Block>
    )
}

type NodeMetric = "traffic" | "time"

function NodesBlock({ report }: { report: analytics.Report }) {
    const [metric, setMetric] = useState<NodeMetric>("traffic")
    const value = metric === "traffic" ? total : (i: analytics.Item) => i.seconds || 0
    const format = metric === "traffic" ? fmtBytes : fmtTime
    const { top, others, othersCount } = topWithOthers(report.nodes ?? [], 5, value)
    const sum = top.reduce((acc, i) => acc + value(i), 0) + others

    const rows: { key: string; name: string; sub?: string; value: number; fill: string }[] = top.map((item, index) => ({
        key: item.id,
        name: item.name || t("settings.analytics.untitled"),
        sub: item.sub,
        value: value(item),
        fill: PALETTE[index % PALETTE.length],
    }))
    if (others > 0) {
        rows.push({ key: "others", name: t("settings.analytics.others", { count: othersCount }), sub: undefined, value: others, fill: OTHERS_COLOR })
    }

    return (
        <Block
            icon={<Server className="h-4 w-4" />}
            title={t("settings.analytics.nodes.title")}
            hint={t("settings.analytics.nodes.hint")}
            action={
                <Segmented
                    size="sm"
                    value={metric}
                    onChange={setMetric}
                    options={[
                        { value: "traffic", label: t("settings.analytics.nodes.byTraffic") },
                        { value: "time", label: t("settings.analytics.nodes.byTime") },
                    ]}
                />
            }
        >
            {sum > 0 ? (
                <div className="flex flex-1 flex-col gap-3">
                    <Donut data={rows} center={format(sum)} caption={t("settings.analytics.totalCaption")} format={format} />
                    <div>
                        {rows.map((row) => (
                            <LegendRow
                                key={row.key}
                                color={row.fill}
                                name={row.name}
                                sub={row.sub}
                                value={format(row.value)}
                                share={(row.value / sum) * 100}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <EmptyBlock text={t("settings.analytics.empty.period")} />
            )}
        </Block>
    )
}

const APPS_VISIBLE = 8

function AppsBlock({ report }: { report: analytics.Report }) {
    const [expanded, setExpanded] = useState(false)
    const items = report.apps ?? []
    const proxyOnly = items.length === 1 && items[0].id === PROXY_APP
    const { top, others, othersCount } = topWithOthers(items, expanded ? items.length : APPS_VISIBLE, total)
    const sum = items.reduce((acc, i) => acc + total(i), 0)
    const max = Math.max(1, ...top.map(total))
    const iconOf = useAppIcons(top.map((i) => i.path || ""))

    return (
        <Block
            icon={<AppWindow className="h-4 w-4" />}
            title={t("settings.analytics.apps.title")}
            hint={
                <>
                    {t("settings.analytics.apps.hint")}
                </>
            }
>
            {top.length > 0 ? (
                <div className="grid gap-x-8 gap-y-2.5 @2xl:grid-cols-2">
                    {top.map((item, index) => {
                        const v = total(item)
                        const icon = iconOf(item.path || "")
                        return (
                            <div key={item.id || "system"} className="flex items-center gap-3">
                                {icon ? (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                                        <img src={icon} alt="" className="h-5 w-5 object-contain" draggable={false} />
                                    </div>
                                ) : (
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold uppercase"
                                        style={{
                                            color: PALETTE[index % PALETTE.length],
                                            backgroundColor: `color-mix(in oklch, ${PALETTE[index % PALETTE.length]} 15%, transparent)`,
                                        }}
                                    >
                                        {item.id === PROXY_APP
                                            ? <Plug className="h-4 w-4" />
                                            : !item.name
                                                ? <Cpu className="h-4 w-4" />
                                                : appName(item).slice(0, 1)}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-baseline gap-2 text-xs">
                                        <span className="min-w-0 truncate font-medium">{appName(item)}</span>
                                        <span className="ms-auto shrink-0 tabular-nums text-muted-foreground">{fmtBytes(v)}</span>
                                        <span className="w-8 shrink-0 text-end text-[11px] tabular-nums text-muted-foreground">
                                            {sum > 0 ? `${Math.round((v / sum) * 100)}%` : ""}
                                        </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                                        <div
                                            className="h-full rounded-full transition-[width] duration-500"
                                            style={{
                                                width: `${Math.max(2, (v / max) * 100)}%`,
                                                backgroundColor: PALETTE[index % PALETTE.length],
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <EmptyBlock text={t("settings.analytics.empty.period")} />
            )}
            {proxyOnly && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                    {t("settings.analytics.apps.tunOnly")}
                </p>
            )}
            {(others > 0 || expanded) && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 self-center text-xs text-muted-foreground"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded ? t("settings.analytics.apps.collapse") : t("settings.analytics.apps.more", { count: othersCount, size: fmtBytes(others) })}
                </Button>
            )}
        </Block>
    )
}

// ── страница ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<Period>("week")
    const [confirmReset, setConfirmReset] = useState(false)
    const { report, loading, reload } = useAnalytics(period)
    const [narrow, setNarrow] = useState(() => window.innerWidth < 640)

    useEffect(() => {
        const onResize = () => setNarrow(window.innerWidth < 640)
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    const totals = report?.totals
    // since — первый день с данными вообще: пустой период при непустой истории
    // показывает блоки с их собственными заглушками.
    const isEmpty = !loading && !report?.since

    const handleReset = async () => {
        try {
            const res = await ResetAnalytics()
            if (!res.success) throw new Error(res.error || t("settings.analytics.toast.resetFailed"))
            toast.success(t("settings.analytics.toast.reset"))
            await reload()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t("settings.analytics.toast.resetFailed"))
        }
    }

    const sinceText = report?.since && period === "all"
        ? t("settings.analytics.kpi.since", { date: formatDate(parseDay(report.since), { day: "numeric", month: "long" }) })
        : undefined

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <PageHeader
                icon={<BarChart3 className="h-4 w-4" />}
                title={t("settings.analytics.title")}
                actions={
                    <>
                        {!narrow && <Segmented value={period} onChange={setPeriod} options={PERIODS} />}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setConfirmReset(true)}
                                    aria-label={t("settings.analytics.reset")}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t("settings.analytics.reset")}</TooltipContent>
                        </Tooltip>
                    </>
                }
                toolbar={narrow ? <Segmented value={period} onChange={setPeriod} options={PERIODS} fill /> : undefined}
            />

            <ScrollArea className="min-h-0 flex-1">
                <div className="@container space-y-3 p-3 pb-6 stagger-list">
                    {isEmpty ? (
                        <Card className="animate-list-item items-center gap-2 bg-sidebar px-6 py-12 text-center">
                            <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div className="text-sm font-medium">{t("settings.analytics.empty.title")}</div>
                            <div className="max-w-72 text-xs text-muted-foreground">
                                {t("settings.analytics.empty.description")}
                            </div>
                        </Card>
                    ) : report ? (
                        <>
                            <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
                                <Kpi
                                    icon={<ArrowDown className="h-3.5 w-3.5" />}
                                    label={t("settings.analytics.kpi.downloaded")}
                                    value={fmtBytes(totals?.down || 0)}
                                    sub={sinceText}
                                    color="var(--chart-1)"
                                />
                                <Kpi
                                    icon={<ArrowUp className="h-3.5 w-3.5" />}
                                    label={t("settings.analytics.kpi.uploaded")}
                                    value={fmtBytes(totals?.up || 0)}
                                    color="var(--chart-2)"
                                />
                                <Kpi
                                    icon={<Clock className="h-3.5 w-3.5" />}
                                    label={t("settings.analytics.kpi.time")}
                                    value={fmtTime(totals?.seconds || 0)}
                                    sub={period !== "today" && totals?.activeDays
                                        ? t("settings.analytics.kpi.activeDays", { count: totals.activeDays })
                                        : undefined}
                                    color="var(--chart-3)"
                                />
                                <Kpi
                                    icon={<Plug className="h-3.5 w-3.5" />}
                                    label={t("settings.analytics.kpi.sessions")}
                                    value={formatNumber(totals?.sessions || 0)}
                                    sub={totals?.sessions && totals.seconds
                                        ? t("settings.analytics.kpi.average", { time: fmtTime(totals.seconds / totals.sessions) })
                                        : undefined}
                                    color="var(--chart-4)"
                                />
                            </div>

                            <div className="grid gap-3 @3xl:grid-cols-5">
                                <TrafficBlock report={report} />
                                <RoutesBlock report={report} />
                            </div>

                            <div className="grid gap-3 @2xl:grid-cols-2">
                                <ProfilesBlock report={report} />
                                <NodesBlock report={report} />
                            </div>

                            <AppsBlock report={report} />
                        </>
                    ) : null}
                </div>
            </ScrollArea>

            <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("settings.analytics.resetDialog.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("settings.analytics.resetDialog.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.action.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => void handleReset()}
                        >
                            {t("settings.analytics.resetDialog.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
