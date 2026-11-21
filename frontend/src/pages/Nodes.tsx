import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect, useId } from "react"
import { Direction } from "radix-ui"
import { toast } from "sonner"
import { useNodes } from "@/hooks/useNodes"
import { useVPNStore, type PingMap } from "@/stores/vpnStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/ui/page-header"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { NodeConfigDialog } from "@/components/app/NodeConfigDialog"
import {
    Check,
    Server,
    ChevronDown,
    Folder,
    Gamepad2,
    Play,
    Zap,
    Crown,
    Shield,
    Lock,
    Loader2,
    Wifi,
    Info,
    X,
    ExternalLink,
    Pencil,
    Pin,
    TriangleAlert,
} from "lucide-react"
import { FaTelegram } from "react-icons/fa6"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CategoryWithNodes, NodeInfo, PingResult } from "@/types/api"
import { LuServer } from "react-icons/lu"
import { PingCategoryNodes, PingProfileNodes } from "@wailsjs/go/handlers/ProfileHandler"
import ReactCountryFlag from "@/components/ui/country-flag"
import { parseNodeName } from "@/lib/nodeName"
import { t } from "@/i18n"

// Сетка подстраивается под ширину сама: узко — список, обычное окно — 2 колонки,
// широкое — 3. Пороги выбраны так, чтобы имя сервера не ломалось по буквам.
const TWO_COLUMNS_MIN_WIDTH = 520
const THREE_COLUMNS_MIN_WIDTH = 960

function columnsForWidth(width: number): number {
    if (width >= THREE_COLUMNS_MIN_WIDTH) return 3
    if (width >= TWO_COLUMNS_MIN_WIDTH) return 2
    return 1
}

function useAutoColumns() {
    // Callback-ref: сетка появляется только после загрузки списка.
    const [el, ref] = useState<HTMLDivElement | null>(null)
    const [columns, setColumns] = useState(2)
    useEffect(() => {
        if (!el) return
        const update = () => setColumns(columnsForWidth(el.clientWidth))
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [el])
    return [ref, columns] as const
}

const categoryIcons: Record<string, React.ElementType> = {
    Folder,
    Gamepad2,
    Play,
    Zap,
    Crown,
    Shield,
    Lock,
}

function getCategoryIcon(iconName?: string) {
    if (!iconName) return Folder
    return categoryIcons[iconName] || Folder
}

// "🇫🇮" -> "FI": Windows has no flag emoji, so flags are drawn as SVG.
function emojiFlagCode(emoji: string): string | null {
    const points = Array.from(emoji).map(c => c.codePointAt(0) ?? 0)
    if (points.length !== 2 || points.some(p => p < 0x1f1e6 || p > 0x1f1ff)) return null
    return String.fromCharCode(...points.map(p => p - 0x1f1e6 + 65))
}

function CategoryEmoji({ emoji }: { emoji: string }) {
    const flag = emojiFlagCode(emoji)
    if (flag) {
        return (
            <ReactCountryFlag
                countryCode={flag}
                style={{ width: "1rem", height: "0.75rem" }}
                className="rounded-[2px] shrink-0"
            />
        )
    }
    return <span className="w-4 text-center text-sm leading-none shrink-0">{emoji}</span>
}

// Category ids the backend uses for servers outside any group.
const UNGROUPED_IDS = new Set(["default", "__default__"])

function getPingColor(latency: number, status: PingResult["status"]): string {
    if (status === "timeout" || status === "error" || status === "invalid" || status === "cancelled") return "text-red-500"
    if (latency < 0) return "text-muted-foreground"
    if (latency < 150) return "text-green-500"
    if (latency < 300) return "text-yellow-500"
    return "text-red-500"
}

function formatPing(latency: number, status: PingResult["status"]): string {
    if (status === "timeout") return t("nodes.node.timeout")
    if (status === "error" || status === "invalid" || status === "cancelled") return t("nodes.node.timeout")
    if (latency < 0) return "—"
    return t("nodes.node.latency", { value: latency })
}

// Material 3 style wavy divider: a small sine tile repeats along the line and
// fades out toward the end of the line (right in LTR, left in RTL) like the
// straight line it replaces.
function WavyLine() {
    const patternId = useId()
    const fade = `linear-gradient(to ${Direction.useDirection() === "rtl" ? "left" : "right"}, black 50%, transparent)`
    return (
        <svg
            aria-hidden="true"
            width="100%"
            height="8"
            fill="none"
            className="text-muted-foreground/30"
            style={{ maskImage: fade, WebkitMaskImage: fade }}
        >
            <pattern id={patternId} width="16" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 4Q4 0 8 4T16 4" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    )
}

interface CategorySectionProps {
    category: CategoryWithNodes
    selectedNodeId: string | null
    activeProfileId: string | null
    onSelect: (nodeId: string) => void
    onEdit: (node: NodeInfo) => void
    pingMap: PingMap
    onPingDone: (results: PingResult[]) => void
    columns: number
    pingAllRunning: boolean
}

function CategorySection({
                             category,
                             selectedNodeId,
                             activeProfileId,
                             onSelect,
                             onEdit,
                             pingMap,
                             onPingDone,
                             columns,
                             pingAllRunning,
                         }: CategorySectionProps) {
    const [collapsed, setCollapsed] = useState(category.category.collapsed ?? false)
    const [pinging, setPinging] = useState(false)
    const busy = pinging || pingAllRunning
    const Icon = getCategoryIcon(category.category.icon)

    const selectedInCategory = category.nodes.some(n => n.id === selectedNodeId)
    // Servers the provider did not put in any group: no header, just cards.
    const ungrouped = UNGROUPED_IDS.has(category.category.id)

    const handlePing = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!activeProfileId || busy) return
        setPinging(true)
        try {
            const result = await PingCategoryNodes(activeProfileId, category.category.id)
            if (result.success && result.data) {
                const typed: PingResult[] = result.data.map(r => ({
                    nodeId: r.nodeId,
                    latency: r.latency,
                    status: r.status as PingResult["status"],
                }))
                onPingDone(typed)
            } else if (!result.success) {
                toast.error(t("nodes.toast.pingFailed"), { description: result.error })
            }
        } catch {
            toast.error(t("nodes.toast.pingFailed"))
        } finally {
            setPinging(false)
        }
    }, [activeProfileId, category.category.id, pinging, onPingDone])

    return (
        <div className="mb-5">
            {!ungrouped && (
            <div className="py-1">
                <div className="flex items-center gap-2 h-8">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="group flex items-center gap-2 min-w-0 text-start"
                    >
                        <ChevronDown
                            className={cn(
                                "w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-all duration-200 shrink-0",
                                collapsed && "-rotate-90 rtl:rotate-90"
                            )}
                        />
                        <span className="w-4 h-6 flex items-center justify-center shrink-0">
                            {category.category.emoji ? (
                                <CategoryEmoji emoji={category.category.emoji} />
                            ) : (
                                <Icon className="w-3.5 h-3.5 text-primary" />
                            )}
                        </span>
                        <span className="text-[13px] font-semibold tracking-tight text-foreground/90 group-hover:text-foreground truncate">
                            {category.category.name}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                            {category.nodes.length}
                        </span>
                        {collapsed && selectedInCategory && (
                            <span
                                title={t("nodes.group.selectedHere")}
                                className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary shrink-0"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        tabIndex={-1}
                        aria-hidden
                        className="flex-1 self-stretch flex items-center min-w-4"
                    >
                        <WavyLine />
                    </button>
                    <button
                        onClick={handlePing}
                        disabled={busy}
                        title={t("nodes.group.ping")}
                        className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                            "text-muted-foreground hover:text-primary hover:bg-muted/70",
                            "disabled:opacity-50 disabled:pointer-events-none"
                        )}
                    >
                        {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Wifi className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>
            )}

            {(ungrouped || !collapsed) && (
                <div
                    className={cn(
                        "grid gap-2 mt-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200",
                        columns === 1 && "grid-cols-1",
                        columns === 2 && "grid-cols-2",
                        columns === 3 && "grid-cols-3"
                    )}
                >
                    {category.nodes.map((node) => (
                        <NodeCard
                            key={node.id}
                            node={node}
                            isSelected={node.id === selectedNodeId}
                            onSelect={() => onSelect(node.id)}
                            onEdit={() => onEdit(node)}
                            pingResult={pingMap[node.id]}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface NodeCardProps {
    node: NodeInfo
    isSelected: boolean
    onSelect: () => void
    onEdit: () => void
    pingResult?: PingResult
    /** Three-column grid: smaller flag, name wraps to two lines. */
    compact?: boolean
}

function NodeCard({ node, isSelected, onSelect, onEdit, pingResult, compact = false }: NodeCardProps) {
    const hasPing = pingResult !== undefined
    const pingColor = hasPing ? getPingColor(pingResult.latency, pingResult.status) : ""
    const pingLabel = hasPing ? formatPing(pingResult.latency, pingResult.status) : null
    const { countryCode, displayName } = parseNodeName(decodeURIComponent(node.name))
    const protocol = [node.type, node.transport, node.security].filter(Boolean).join(" / ")
    const description = node.description?.trim()
    const showProtocol = !description && !node.hideProtocol
    const badge = node.badge?.trim()
    const hasSubtitle = !!description || !!badge || showProtocol || node.isEdited || node.isPinned

    return (
        <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>
                <button
                    onClick={onSelect}
                    title={compact ? displayName : undefined}
                    className={cn(
                        "flex items-center rounded-xl border text-start w-full",
                        "transition-all duration-200 active:scale-[0.98]",
                        compact ? "gap-2.5 px-2.5 py-2 min-h-[54px]" : "gap-3 px-3 py-2.5 min-h-[60px]",
                        isSelected
                            ? "bg-primary/10 border-primary/70 ring-1 ring-primary/25 shadow-md shadow-primary/10"
                            : "bg-card/80 border-border/60 hover:bg-accent/40 hover:border-border"
                    )}
                >
                    <div className={cn(
                        "relative rounded-full flex items-center justify-center shrink-0 transition-colors overflow-hidden",
                        compact ? "w-7 h-7" : "w-9 h-9",
                        !countryCode && isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                    )}>
                        {countryCode ? (
                            <>
                                <ReactCountryFlag
                                    countryCode={countryCode}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    className="absolute inset-0"
                                />
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] pointer-events-none" />
                            </>
                        ) : isSelected ? (
                            <Check className="w-5 h-5 animate-in zoom-in duration-200" />
                        ) : (
                            <Server className="w-4 h-4" />
                        )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <span className={cn(
                            "font-medium",
                            compact ? "text-[13px] leading-tight line-clamp-2 break-words" : "text-sm truncate",
                            isSelected ? "text-foreground" : "text-foreground/85"
                        )}>
                            {displayName}
                        </span>
                        {hasSubtitle && (
                        <span className="mt-0.5 text-[10px] text-muted-foreground uppercase font-mono tracking-wider flex items-center gap-1.5 min-w-0">
                            {badge && (
                                <span className="px-1 py-px rounded-sm bg-primary/15 text-primary font-sans font-bold text-[8.5px] tracking-wide leading-tight shrink-0 max-w-[5.5rem] truncate">
                                    {badge}
                                </span>
                            )}
                            {description ? (
                                <span
                                    title={node.hideProtocol ? undefined : protocol}
                                    className="normal-case font-sans tracking-normal text-[11px] truncate"
                                >
                                    {description}
                                </span>
                            ) : showProtocol ? protocol : null}
                            {node.isEdited && (
                                <span className="normal-case tracking-normal text-primary/80">
                                    {t("nodes.node.edited")}
                                </span>
                            )}
                            {node.isPinned && (
                                <span title={t("nodes.node.pinned")} className="flex items-center">
                                    <Pin className="w-2.5 h-2.5" />
                                </span>
                            )}
                        </span>
                        )}
                    </div>

                    {node.insecure && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex shrink-0 items-center text-amber-500">
                                    <TriangleAlert className="w-3.5 h-3.5" />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-60">
                                {t("nodes.node.insecure")}
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {pingLabel !== null && (
                        <span className={cn("font-mono font-semibold leading-none shrink-0", compact ? "text-[10px]" : "text-[11px]", pingColor)}>
                            {pingLabel}
                        </span>
                    )}
                </button>
            </ContextMenuTrigger>

            <ContextMenuContent
                className="w-60"
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <ContextMenuItem onSelect={onSelect} disabled={isSelected}>
                    <Check className="w-4 h-4" />
                    {isSelected ? t("nodes.contextMenu.selected") : t("nodes.contextMenu.select")}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onSelect={() => {
                        ;(document.activeElement as HTMLElement | null)?.blur()
                        onEdit()
                    }}
                >
                    <Pencil className="w-4 h-4" />
                    {t("nodes.contextMenu.edit")}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Server className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t("nodes.empty.title")}</p>
            <p className="text-xs text-muted-foreground mt-1">
                {t("nodes.empty.description")}
            </p>
        </div>
    )
}

interface AnnounceBannerProps {
    profileId: string | null
    announce: string
    supportUrl?: string
    bannerUrl?: string
    bannerColor?: string
}

// Скрытое объявление помним по профилю и тексту: новое объявление покажется снова.
const ANNOUNCE_HIDDEN_KEY = "beam:announce-hidden:"

function textHash(s: string): string {
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
    return (h >>> 0).toString(36)
}

function AnnounceBanner({ profileId, announce, supportUrl, bannerUrl, bannerColor }: AnnounceBannerProps) {
    const storageKey = ANNOUNCE_HIDDEN_KEY + (profileId ?? "none")
    const hash = useMemo(() => textHash(announce.trim()), [announce])
    const [hiddenHash, setHiddenHash] = useState(() => localStorage.getItem(storageKey))
    const [expanded, setExpanded] = useState(false)
    const [overflows, setOverflows] = useState(false)
    const textRef = useRef<HTMLDivElement>(null)

    const parsedContent = useMemo(() => parseAnnounceText(announce.trim()), [announce])

    const isTelegram = supportUrl && (supportUrl.includes('t.me') || supportUrl.includes('telegram'))

    useLayoutEffect(() => {
        setHiddenHash(localStorage.getItem(storageKey))
        setExpanded(false)
    }, [storageKey, hash])

    // Кнопка «развернуть» нужна, только если текст реально не влез в 2 строки.
    useLayoutEffect(() => {
        const el = textRef.current
        if (!el) return
        const check = () => {
            if (!expanded) setOverflows(el.scrollHeight > el.clientHeight + 1)
        }
        check()
        const ro = new ResizeObserver(check)
        ro.observe(el)
        return () => ro.disconnect()
    }, [expanded, parsedContent, hiddenHash])

    const dismiss = () => {
        localStorage.setItem(storageKey, hash)
        setHiddenHash(hash)
    }

    if (hiddenHash === hash || !announce?.trim()) return null

    // Кастомный акцент провайдера (bannerColor из .beam) перекрывает тему.
    const accentStyle = bannerColor
        ? { borderColor: `${bannerColor}55`, background: `linear-gradient(135deg, ${bannerColor}1f, ${bannerColor}08)` }
        : undefined
    const canToggle = overflows || expanded

    const iconBtn = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground"

    return (
        <div className="px-3 pt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div
                className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-2.5",
                    !bannerColor && "border-primary/25 bg-gradient-to-br from-primary/10 to-primary/[0.03]"
                )}
                style={accentStyle}
            >
                <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
                    style={bannerColor ? { background: `${bannerColor}26`, color: bannerColor } : undefined}
                >
                    <Info className="h-3.5 w-3.5" />
                </span>

                <div
                    ref={textRef}
                    className={cn(
                        "min-w-0 flex-1 self-center text-[12.5px] leading-[1.45] text-foreground/90 break-words",
                        !expanded && "line-clamp-2",
                        (bannerUrl || canToggle) && "cursor-pointer"
                    )}
                    onClick={bannerUrl ? () => BrowserOpenURL(bannerUrl) : canToggle ? () => setExpanded(v => !v) : undefined}
                    title={bannerUrl ? t("nodes.banner.openLink") : undefined}
                >
                    {parsedContent.map((part, i) => (
                        <span key={i}>
                            {(part.type === 'text' || part.type === 'emoji') && <span>{part.content}</span>}
                            {part.type === 'link' && (
                                <button
                                    className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-medium"
                                    onClick={(e) => { e.stopPropagation(); BrowserOpenURL(part.url!) }}
                                >
                                    {part.content}
                                </button>
                            )}
                            {part.type === 'break' && <br />}
                        </span>
                    ))}
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                    {canToggle && (
                        <button
                            onClick={() => setExpanded(v => !v)}
                            title={expanded ? t("nodes.banner.collapse") : t("nodes.banner.expand")}
                            className={iconBtn}
                        >
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} />
                        </button>
                    )}
                    {supportUrl && (
                        <button
                            onClick={() => BrowserOpenURL(supportUrl)}
                            title={t("nodes.banner.support")}
                            className={cn(iconBtn, "hover:text-primary")}
                        >
                            {isTelegram ? (
                                <FaTelegram className="h-3.5 w-3.5" />
                            ) : (
                                <ExternalLink className="h-3.5 w-3.5" />
                            )}
                        </button>
                    )}
                    <button onClick={dismiss} title={t("nodes.banner.hide")} className={iconBtn}>
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

type ParsedPart =
    | { type: 'text'; content: string }
    | { type: 'emoji'; content: string }
    | { type: 'link'; content: string; url: string }
    | { type: 'break' }

function parseAnnounceText(text: string): ParsedPart[] {
    const parts: ParsedPart[] = []
    const lines = text.split('\n')

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
    const linkRegex = /(https?:\/\/[^\s]+|t\.me\/[^\s]+|@\w+)/g

    lines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
            parts.push({ type: 'break' })
        }

        let lastIndex = 0
        const matches: Array<{ start: number; end: number; type: 'emoji' | 'link'; content: string; url?: string }> = []

        let emojiMatch: RegExpExecArray | null
        const emojiRegexClone = new RegExp(emojiRegex)
        while ((emojiMatch = emojiRegexClone.exec(line)) !== null) {
            matches.push({
                start: emojiMatch.index,
                end: emojiMatch.index + emojiMatch[0].length,
                type: 'emoji',
                content: emojiMatch[0],
            })
        }

        let linkMatch: RegExpExecArray | null
        const linkRegexClone = new RegExp(linkRegex)
        while ((linkMatch = linkRegexClone.exec(line)) !== null) {
            const rawLink = linkMatch[0]
            let url = rawLink
            if (!url.startsWith('http')) {
                url = 'https://' + url
            }
            matches.push({
                start: linkMatch.index,
                end: linkMatch.index + linkMatch[0].length,
                type: 'link',
                content: rawLink,
                url,
            })
        }

        matches.sort((a, b) => a.start - b.start)

        matches.forEach((match) => {
            if (match.start > lastIndex) {
                const textPart = line.slice(lastIndex, match.start)
                if (textPart) {
                    parts.push({ type: 'text', content: textPart })
                }
            }

            if (match.type === 'emoji') {
                parts.push({ type: 'emoji', content: match.content })
            } else if (match.type === 'link') {
                parts.push({ type: 'link', content: match.content, url: match.url! })
            }

            lastIndex = match.end
        })

        if (lastIndex < line.length) {
            const textPart = line.slice(lastIndex)
            if (textPart) {
                parts.push({ type: 'text', content: textPart })
            }
        }
    })

    return parts
}

export default function NodesPage() {
    const {
        categories,
        selectedNodeId,
        switching,
        loading,
        selectNode,
        loadNodeConfig,
        saveNodeConfig,
        hasNodes,
    } = useNodes()

    const activeProfileId = useVPNStore(s => s.activeProfileId)
    const activeProfile = useVPNStore(s => s.profiles.find(p => p.id === s.activeProfileId) ?? null)
    const pingMap = useVPNStore(s => s.pingMap)
    const mergePingResults = useVPNStore(s => s.mergePingResults)

    const [gridRef, columns] = useAutoColumns()
    const [editingNode, setEditingNode] = useState<NodeInfo | null>(null)
    const [pingingAll, setPingingAll] = useState(false)

    const handlePingDone = useCallback((results: PingResult[]) => {
        mergePingResults(results)
    }, [mergePingResults])

    const handlePingAll = useCallback(async () => {
        if (!activeProfileId || pingingAll) return
        setPingingAll(true)
        try {
            const result = await PingProfileNodes(activeProfileId, [])
            if (result.success && result.data) {
                mergePingResults(result.data.map(r => ({
                    nodeId: r.nodeId,
                    latency: r.latency,
                    status: r.status as PingResult["status"],
                })))
            } else if (!result.success) {
                toast.error(t("nodes.toast.pingFailed"), { description: result.error })
            }
        } catch {
            toast.error(t("nodes.toast.pingFailed"))
        } finally {
            setPingingAll(false)
        }
    }, [activeProfileId, pingingAll, mergePingResults])

    const handleSelect = async (nodeId: string) => {
        if (nodeId !== selectedNodeId) {
            await selectNode(nodeId)
        }
    }

    return (
        <div className="h-full flex flex-col">
            <PageHeader
                icon={<LuServer className="h-4 w-4" />}
                title={t("nodes.title")}
                showBackButton={false}
                actions={(
                    <div className="flex items-center gap-2">
                        {/* При одной настоящей группе кнопка дублировала бы пинг в её заголовке;
                            у серверов без группы заголовка нет, так что тогда она нужна. */}
                        {hasNodes && (categories.length > 1 || categories.some(c => UNGROUPED_IDS.has(c.category.id))) && (
                            <button
                                onClick={handlePingAll}
                                disabled={pingingAll || !activeProfileId}
                                title={t("nodes.header.pingAllHint")}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors",
                                    "text-xs font-medium whitespace-nowrap",
                                    "text-muted-foreground hover:text-primary hover:bg-muted/80",
                                    "disabled:opacity-50 disabled:pointer-events-none"
                                )}
                            >
                                {pingingAll ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Wifi className="w-3.5 h-3.5" />
                                )}
                                <span>{pingingAll ? t("nodes.header.pinging") : t("nodes.header.pingAll")}</span>
                            </button>
                        )}
                        {switching && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {t("nodes.header.switching")}
                            </div>
                        )}
                    </div>
                )}
            />

            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : !hasNodes ? (
                    <EmptyState />
                ) : (
                    <ScrollArea className="h-full">
                        {(activeProfile?.branding?.bannerText || activeProfile?.announce) && (
                            <AnnounceBanner
                                profileId={activeProfileId}
                                announce={activeProfile.branding?.bannerText || activeProfile.announce || ""}
                                supportUrl={activeProfile.branding?.supportUrl || activeProfile.supportUrl}
                                bannerUrl={activeProfile.branding?.bannerUrl}
                                bannerColor={activeProfile.branding?.bannerColor}
                            />
                        )}

                        <div ref={gridRef} className="p-3 pb-0">
                            {categories.map((category) => (
                                <CategorySection
                                    key={category.category.id}
                                    category={category}
                                    selectedNodeId={selectedNodeId}
                                    activeProfileId={activeProfileId}
                                    onSelect={handleSelect}
                                    onEdit={setEditingNode}
                                    pingMap={pingMap}
                                    onPingDone={handlePingDone}
                                    columns={columns}
                                    pingAllRunning={pingingAll}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>

            <NodeConfigDialog
                node={editingNode}
                open={editingNode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingNode(null)
                    }
                }}
                loadConfig={loadNodeConfig}
                saveConfig={saveNodeConfig}
            />
        </div>
    )
}
