import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { types } from "@wailsjs/go/models"
import { GetCoreLogging, SetCoreLogging, GetLogLevel, SetLogLevel } from "@wailsjs/go/handlers/SettingsHandler"
import { OpenLogsFolder } from "@wailsjs/go/handlers/SystemHandler"
import {
    ArrowDown,
    Check,
    Code,
    Copy,
    Expand,
    FolderOpen,
    List,
    MoreHorizontal,
    RefreshCw,
    ScrollText,
    Search,
    Trash2,
    X,
} from "lucide-react"

import ConnectionsView from "@/components/logs/ConnectionsView"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useConnections, type ActiveConnection } from "@/hooks/useConnections"
import { useLogs } from "@/hooks/useLogs"
import { formatTime as formatClock } from "@/i18n/intl"
import { formatBytes } from "@/lib/format"
import { cn } from "@/lib/utils"
import { t } from "@/i18n"

type LogEntry = types.LogEntry
type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal"

const levelConfig: Record<string, { color: string; dot: string }> = {
    trace: { color: "text-muted-foreground", dot: "bg-muted-foreground" },
    debug: { color: "text-muted-foreground", dot: "bg-muted-foreground" },
    info: { color: "text-primary", dot: "bg-primary" },
    warn: { color: "text-yellow-500", dot: "bg-yellow-500" },
    error: { color: "text-destructive", dot: "bg-destructive" },
    fatal: { color: "text-destructive font-bold", dot: "bg-destructive" },
}

function formatTime(timestamp: number): string {
    return formatClock(timestamp, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

function formatRawLog(log: LogEntry): string {
    const time = formatTime(log.timestamp)
    const level = (log.level || "info").toUpperCase().padEnd(5)
    const source = log.source ? `[${log.source}] ` : ""
    return `${time} ${level} ${source}${log.message}`
}

function Highlight({ text, search }: { text: string; search: string }) {
    if (!search.trim()) return <>{text}</>

    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === search.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-400/30 text-foreground rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <button
            onClick={handleCopy}
            className="absolute end-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-muted"
            title={t("common.action.copy")}
        >
            {copied ? (
                <Check className="h-3 w-3 text-green-500" />
            ) : (
                <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            )}
        </button>
    )
}

function SearchInput({
                         isOpen,
                         onClose,
                         value,
                         onChange,
                         wide = false,
                     }: {
    isOpen: boolean
    onClose: () => void
    value: string
    onChange: (v: string) => void
    wide?: boolean
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className={cn("flex items-center gap-2 animate-in slide-in-from-right-2 rtl:slide-in-from-left-2 duration-200", wide && "w-full")}>
            <div className={cn("relative", wide && "min-w-0 flex-1")}>
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={t("common.action.searchPlaceholder")}
                    className={cn("h-8 text-xs", wide ? "w-full" : "w-48")}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            onChange("")
                            onClose()
                        }
                    }}
                />
                {value && (
                    <button
                        onClick={() => onChange("")}
                        className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    )
}

function LogEntryRow({ log, search, compact = false }: { log: LogEntry; search: string; compact?: boolean }) {
    const level = log.level || "info"
    const config = levelConfig[level] || levelConfig.info

    // Узкое окно: мета-строка сверху, сообщение под ней на всю ширину.
    if (compact) {
        return (
            <div className="group relative flex flex-col gap-0.5 border-b border-border/40 px-3 py-1.5 transition-colors hover:bg-muted/50 last:border-0">
                <div className="flex min-w-0 items-center gap-2 pe-6">
                    <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} />
                    <span className="text-[10px] tabular-nums text-muted-foreground font-mono">
                        {formatTime(log.timestamp)}
                    </span>
                    <span className={cn("text-[10px] font-medium uppercase", config.color)}>{level}</span>
                    {log.source && (
                        <Badge variant="secondary" className="h-4 min-w-0 truncate px-1.5 text-[9px] font-normal">
                            {log.source}
                        </Badge>
                    )}
                </div>
                <span className="break-all text-xs leading-relaxed text-foreground/80">
                    <Highlight text={log.message} search={search} />
                </span>
                <CopyButton text={formatRawLog(log)} />
            </div>
        )
    }

    return (
        <div className="group relative flex items-start gap-3 border-b border-border/40 px-3 py-1.5 transition-colors hover:bg-muted/50 last:border-0">
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
                <div className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                <span className="w-16 text-[10px] tabular-nums text-muted-foreground font-mono">
                    {formatTime(log.timestamp)}
                </span>
            </div>

            <span className={cn("w-10 shrink-0 pt-0.5 text-[10px] font-medium uppercase", config.color)}>
                {level}
            </span>

            {log.source && (
                <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[9px] font-normal">
                    {log.source}
                </Badge>
            )}

            <span className="break-all text-xs leading-relaxed text-foreground/80 pe-8">
                <Highlight text={log.message} search={search} />
            </span>

            <CopyButton text={formatRawLog(log)} />
        </div>
    )
}

function RawLogView({ logs }: { logs: LogEntry[] }) {
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [logs])

    return (
        <ScrollArea className="h-full">
            <pre className="whitespace-pre-wrap break-all p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
                {logs.map(formatRawLog).join("\n")}
            </pre>
            <div ref={endRef} />
        </ScrollArea>
    )
}

function formatConnDuration(seconds: number): string {
    if (seconds < 60) return t("common.duration.seconds", { value: seconds })
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return t("common.duration.minutes", { value: minutes })
    return t("common.duration.hoursMinutes", { h: Math.floor(minutes / 60), m: minutes % 60 })
}

function formatRawConnection(conn: ActiveConnection): string {
    const parts = [
        (conn.network || "tcp").toUpperCase(),
        conn.domain || conn.host || conn.destination,
        `→ ${conn.outbound || "?"}`,
        `↑${formatBytes(conn.upload)} ↓${formatBytes(conn.download)}`,
        formatConnDuration(conn.duration),
    ]
    if (conn.rule) parts.push(`[${conn.rule}]`)
    if (conn.process) parts.push(conn.process)
    if (conn.closed) parts.push(t("logs.raw.closed"))
    return parts.join(" ")
}

function MinSizeWarning() {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Expand className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1 text-center">
                <p className="text-sm font-medium">{t("logs.tooSmall.title")}</p>
                <p className="text-xs text-muted-foreground">
                    {t("logs.tooSmall.description")}
                </p>
            </div>
        </div>
    )
}

function EmptyState({
    type,
    loggingOff,
    onEnableLogging,
}: {
    type: "logs" | "connections" | "search"
    loggingOff?: boolean
    onEnableLogging?: () => void
}) {
    if (type === "logs" && loggingOff) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("logs.empty.loggingOff")}</p>
                    <p className="text-[11px] text-muted-foreground/70">{t("logs.empty.loggingOffHint")}</p>
                </div>
                {onEnableLogging && (
                    <Button size="sm" variant="secondary" className="h-7 gap-1.5 px-3 text-xs" onClick={onEnableLogging}>
                        {t("logs.empty.enableLogging")}
                    </Button>
                )}
            </div>
        )
    }

    const messages = {
        logs: t("logs.empty.logs"),
        connections: t("logs.empty.connections"),
        search: t("common.nothingFound"),
    }

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">{messages[type]}</p>
        </div>
    )
}

export default function LogsPage() {
    const [viewTab, setViewTab] = useState<string>("logs")
    const [viewMode, setViewMode] = useState<"parsed" | "raw">("parsed")
    const [autoScroll, setAutoScroll] = useState(true)
    const [isTooSmall, setIsTooSmall] = useState(false)
    const [narrow, setNarrow] = useState(() => window.innerWidth < 640)
    const [search, setSearch] = useState("")
    const [searchOpen, setSearchOpen] = useState(false)
    const [coreLogging, setCoreLogging] = useState(true)
    const [coreLoggingLoading, setCoreLoggingLoading] = useState(false)
    const [logLevel, setLogLevel] = useState<string>("info")
    const [logLevelLoading, setLogLevelLoading] = useState(false)

    useEffect(() => {
        GetCoreLogging()
            .then((r) => { if (r.success) setCoreLogging(r.data ?? true) })
            .catch(() => {})
        GetLogLevel()
            .then((r) => { if (r.success && r.data) setLogLevel(r.data) })
            .catch(() => {})
    }, [])

    const handleToggleLogging = async (checked: boolean) => {
        setCoreLoggingLoading(true)
        try {
            const r = await SetCoreLogging(checked)
            if (r.success) {
                setCoreLogging(checked)
                // Свитч и селектор — два взгляда на одну настройку: включение
                // записи возвращает уровень «Основные», выключение — «Выключены».
                const nextLevel = checked ? (logLevel === "off" ? "info" : logLevel) : "off"
                setLogLevel(nextLevel)
                SetLogLevel(nextLevel).catch(() => {})
            } else {
                toast.error(t("logs.toast.toggleFailed"), { description: r.error })
            }
        } finally {
            setCoreLoggingLoading(false)
        }
    }

    const handleLogLevelChange = async (value: string) => {
        setLogLevelLoading(true)
        try {
            const r = await SetLogLevel(value)
            if (r.success) {
                setLogLevel(value)
                setCoreLogging(value !== "off")
            } else {
                toast.error(t("logs.toast.levelFailed"), { description: r.error })
            }
        } finally {
            setLogLevelLoading(false)
        }
    }

    const { logs, loading, filter, setFilter, refresh, clear } = useLogs({
        autoRefresh: viewTab !== "connections",
        refreshInterval: 1000,
        maxLogs: 500,
    })

    const { connections } = useConnections(viewTab === "connections")

    const logsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkSize = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            setIsTooSmall(height < 320)
            setNarrow(width < 640)
        }

        checkSize()
        window.addEventListener("resize", checkSize)
        return () => window.removeEventListener("resize", checkSize)
    }, [])

    useEffect(() => {
        if (autoScroll && logs.length > 0 && viewTab === "logs" && viewMode === "parsed") {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [logs, autoScroll, viewTab, viewMode])

    const filteredLogs = useMemo(() => {
        if (!search.trim()) return logs
        const q = search.toLowerCase()
        return logs.filter(
            (l) =>
                l.message.toLowerCase().includes(q) ||
                l.source?.toLowerCase().includes(q)
        )
    }, [logs, search])

    const filteredConnections = useMemo(() => {
        if (!search.trim()) return connections
        const q = search.toLowerCase()
        return connections.filter(
            (c) =>
                (c.domain || "").toLowerCase().includes(q) ||
                c.host.toLowerCase().includes(q) ||
                c.destination.toLowerCase().includes(q) ||
                c.outbound.toLowerCase().includes(q) ||
                c.process.toLowerCase().includes(q) ||
                c.rule.toLowerCase().includes(q)
        )
    }, [connections, search])

    const handleFilterChange = (value: string) => {
        setFilter(value === "all" ? "" : (value as LogLevel))
    }

    const handleCopyAll = () => {
        const text =
            viewTab === "logs"
                ? filteredLogs.map(formatRawLog).join("\n")
                : filteredConnections.map(formatRawConnection).join("\n")
        navigator.clipboard.writeText(text)
    }

    const handleOpenLogsFolder = async () => {
        const result = await OpenLogsFolder()
        if (!result.success) {
            toast.error(t("logs.toast.openFolderFailed"), { description: result.error })
        }
    }

    const currentCount = viewTab === "logs" ? filteredLogs.length : filteredConnections.filter((c) => !c.closed).length
    const totalCount = viewTab === "logs" ? logs.length : connections.filter((c) => !c.closed).length

    // Узкое окно (мини-режим): вкладки на всю ширину, инструменты — в меню «…».
    const compactToolbar = searchOpen ? (
        <SearchInput
            isOpen
            wide
            onClose={() => setSearchOpen(false)}
            value={search}
            onChange={setSearch}
        />
    ) : (
        <div className="flex items-center gap-2">
            <TabsList className="h-8 min-w-0 flex-1 rounded-md bg-muted/50 p-0.5">
                <TabsTrigger value="logs" className="h-7 flex-1 gap-1 px-2 text-xs data-[state=active]:bg-background">
                    {t("logs.tabs.logs")}
                    {viewTab === "logs" && totalCount > 0 && (
                        <span className="tabular-nums text-muted-foreground">{totalCount}</span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="connections" className="h-7 flex-1 gap-1 px-2 text-xs data-[state=active]:bg-background">
                    {t("logs.tabs.connections")}
                    {viewTab === "connections" && totalCount > 0 && (
                        <span className="tabular-nums text-muted-foreground">{totalCount}</span>
                    )}
                </TabsTrigger>
            </TabsList>

            <div className="flex h-8 shrink-0 items-center rounded-md border border-border/60 bg-muted/40">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                    className="h-8 w-8 rounded-s-md rounded-e-none border-e border-border/60"
                    title={t("common.action.search")}
                >
                    <Search className="h-3.5 w-3.5" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-s-none rounded-e-md"
                            title={t("common.action.more")}
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        {viewTab === "logs" && (
                            <>
                                <DropdownMenuLabel className="text-xs text-muted-foreground">{t("logs.toolbar.show")}</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={filter || "all"} onValueChange={handleFilterChange}>
                                    <DropdownMenuRadioItem value="all">{t("logs.toolbar.all")}</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="info">Info</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="warn">Warn</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="error">Error</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={viewMode === "raw"}
                                    onCheckedChange={(v) => setViewMode(v ? "raw" : "parsed")}
                                >
                                    {t("logs.toolbar.rawView")}
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={autoScroll} onCheckedChange={(v) => setAutoScroll(!!v)}>
                                    {t("logs.toolbar.autoScroll")}
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled={loading} onSelect={() => void refresh()}>
                                    <RefreshCw />
                                    {t("common.action.refresh")}
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem onSelect={() => handleCopyAll()}>
                            <Copy />
                            {t("common.action.copyAll")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void handleOpenLogsFolder()}>
                            <FolderOpen />
                            {t("logs.toolbar.openFolder")}
                        </DropdownMenuItem>
                        {viewTab === "logs" && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => void clear()}>
                                    <Trash2 />
                                    {t("common.action.clear")}
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
            {isTooSmall && <MinSizeWarning />}

            <Tabs
                value={viewTab}
                onValueChange={setViewTab}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
                <PageHeader
                    icon={<ScrollText className="h-4 w-4" />}
                    title={t("logs.title")}
                    actions={
                        <>
                            <div className="flex items-center gap-1.5 pe-1">
                                {!narrow && <span className="text-xs text-muted-foreground">{t("logs.toolbar.recording")}</span>}
                                <Switch
                                    title={t("logs.toolbar.recording")}
                                    checked={coreLogging}
                                    disabled={coreLoggingLoading}
                                    onCheckedChange={handleToggleLogging}
                                />
                            </div>
                            <Select
                                value={logLevel}
                                onValueChange={handleLogLevelChange}
                                disabled={logLevelLoading}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className={cn("h-7 gap-1 px-2 text-xs", narrow ? "w-[116px]" : "w-[132px]")}
                                    title={t("logs.toolbar.levelHint")}
                                >
                                    <SelectValue placeholder={t("logs.toolbar.levelPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="off">{t("logs.level.off")}</SelectItem>
                                    <SelectItem value="error">{t("logs.level.error")}</SelectItem>
                                    <SelectItem value="info">{t("logs.level.info")}</SelectItem>
                                    <SelectItem value="debug">{t("logs.level.debug")}</SelectItem>
                                </SelectContent>
                            </Select>
                            {!narrow && (<>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenLogsFolder}
                                className="h-7 gap-1.5 px-2 text-xs"
                                title={t("logs.toolbar.openFolderHint")}
                            >
                                <FolderOpen className="h-3 w-3" />
                                {t("logs.toolbar.openFolder")}
                            </Button>
                            <Badge variant="secondary" className="text-xs">
                                {search && currentCount !== totalCount
                                    ? `${currentCount}/${totalCount}`
                                    : totalCount
                                }
                            </Badge>
                            </>)}
                        </>
                    }
                    toolbar={narrow ? compactToolbar : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <TabsList className="h-8 rounded-md bg-muted/50 p-0.5">
                                <TabsTrigger
                                    value="logs"
                                    className="h-7 px-3 text-xs data-[state=active]:bg-background"
                                >
                                    {t("logs.tabs.logs")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="connections"
                                    className="h-7 px-3 text-xs data-[state=active]:bg-background"
                                >
                                    {t("logs.tabs.connections")}
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                {!searchOpen ? (
                                    <div className="flex items-center gap-2">
                                        {viewTab === "logs" && (
                                            <Select
                                                value={filter || "all"}
                                                onValueChange={handleFilterChange}
                                            >
                                                <SelectTrigger
                                                    size="sm"
                                                    className="h-8 w-[108px] rounded-md border-border/60 bg-muted/40 text-xs shadow-none"
                                                >
                                                    <SelectValue placeholder={t("logs.toolbar.levelShort")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t("logs.toolbar.all")}</SelectItem>
                                                    <SelectItem value="info">Info</SelectItem>
                                                    <SelectItem value="warn">Warn</SelectItem>
                                                    <SelectItem value="error">Error</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}

                                        <div className="flex h-8 items-center rounded-md border border-border/60 bg-muted/40">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSearchOpen(true)}
                                                className="h-8 w-8 rounded-s-md rounded-e-none border-e border-border/60"
                                                title={t("common.action.search")}
                                            >
                                                <Search className="h-3 w-3" />
                                            </Button>

                                            {viewTab === "logs" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setViewMode(viewMode === "parsed" ? "raw" : "parsed")}
                                                    className={cn("h-8 w-8 rounded-none border-e border-border/60", viewMode === "raw" && "text-primary")}
                                                    title={viewMode === "parsed" ? t("logs.toolbar.showRaw") : t("logs.toolbar.showParsed")}
                                                >
                                                    {viewMode === "parsed" ? (
                                                        <Code className="h-3 w-3" />
                                                    ) : (
                                                        <List className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setAutoScroll(!autoScroll)}
                                                className={cn("h-8 w-8 rounded-none border-e border-border/60", autoScroll && "text-primary")}
                                                title={autoScroll ? t("logs.toolbar.autoScrollOn") : t("logs.toolbar.autoScrollOff")}
                                            >
                                                <ArrowDown className="h-3 w-3" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={refresh}
                                                disabled={loading}
                                                className={cn("h-8 w-8 rounded-none border-e border-border/60", loading && "text-primary")}
                                                title={t("common.action.refresh")}
                                            >
                                                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleCopyAll}
                                                className="h-8 w-8 rounded-none border-e border-border/60"
                                                title={t("common.action.copyAll")}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={clear}
                                                className="h-8 w-8 rounded-s-none rounded-e-md text-muted-foreground hover:text-destructive"
                                                title={t("common.action.clear")}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <SearchInput
                                        isOpen={searchOpen}
                                        onClose={() => setSearchOpen(false)}
                                        value={search}
                                        onChange={setSearch}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                />

                <TabsContent value="logs" className="m-0 flex-1 min-h-0 overflow-hidden">
                    {filteredLogs.length === 0 ? (
                        <EmptyState
                            type={search ? "search" : "logs"}
                            loggingOff={!search && !coreLogging}
                            onEnableLogging={() => handleToggleLogging(true)}
                        />
                    ) : viewMode === "raw" ? (
                        <RawLogView logs={filteredLogs} />
                    ) : (
                        <ScrollArea className="h-full">
                            <div>
                                {filteredLogs.map((log) => (
                                    <LogEntryRow key={log.id} log={log} search={search} compact={narrow} />
                                ))}
                                <div ref={logsEndRef} className="h-px" />
                            </div>
                        </ScrollArea>
                    )}
                </TabsContent>

                <TabsContent value="connections" className="m-0 flex-1 min-h-0 overflow-hidden">
                    <ConnectionsView connections={connections} search={search} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
