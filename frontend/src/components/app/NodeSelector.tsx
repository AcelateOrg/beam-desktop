import { Fragment, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Check, ChevronDown, ChevronRight, Globe2, LayoutGrid, Loader2, Pin } from "lucide-react"
import ReactCountryFlag from "@/components/ui/country-flag"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNodes } from "@/hooks/useNodes"
import { useVPN } from "@/hooks/useVPN"
import { parseNodeName } from "@/lib/nodeName"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useVPNStore } from "@/stores/vpnStore"
import { t } from "@/i18n"

function Flag({ code, className }: { code: string | null; className?: string }) {
    return (
        <span className={cn("relative flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full", className)}>
            {code ? (
                <ReactCountryFlag
                    countryCode={code}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    className="absolute inset-0"
                />
            ) : (
                <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
        </span>
    )
}

function pingClass(ms: number) {
    if (ms < 150) return "text-emerald-500"
    if (ms < 300) return "text-amber-500"
    return "text-red-500"
}

// Плашка текущего сервера. Клик — список; можно и зажать, повести вниз и отпустить
// на сервере, как меню в macOS.
export default function NodeSelector() {
    const navigate = useNavigate()
    const { categories, selectedNode, selectedNodeId, selectNode, switching, hasNodes } = useNodes()
    const { isConnected, isLoading, toggle } = useVPN()
    const pingMap = useVPNStore((s) => s.pingMap)

    const groups = useMemo(
        () =>
            categories
                .filter((c) => c.nodes.length > 0)
                .map((c) => ({
                    id: c.category.id,
                    title: c.category.name,
                    nodes: c.nodes.map((n) => ({ ...n, ...parseNodeName(decodeURIComponent(n.name)) })),
                })),
        [categories],
    )
    const pinned = useMemo(() => groups.flatMap((g) => g.nodes).filter((n) => n.isPinned), [groups])

    if (!hasNodes) return null

    const { countryCode, displayName } = parseNodeName(
        selectedNode?.name ? decodeURIComponent(selectedNode.name) : t("home.nodeSelector.placeholder"),
    )

    const choose = async (id: string) => {
        if (id !== selectedNodeId) await selectNode(id)
        // На выключенном VPN выбор сервера сразу подключает.
        if (!isConnected && !isLoading) toggle()
    }

    const renderNode = (n: (typeof groups)[number]["nodes"][number], keyPrefix = "") => {
        const r = pingMap[n.id]
        const ping = r && r.status === "ok" && r.latency > 0 ? r.latency : null
        const active = n.id === selectedNodeId
        return (
            <DropdownMenuItem
                key={keyPrefix + n.id}
                onSelect={() => void choose(n.id)}
                className={cn("gap-2.5 py-2", active && "bg-primary/10")}
            >
                <Flag code={n.countryCode} className="h-5 w-5" />
                <span className={cn("min-w-0 flex-1 truncate text-[13px]", active && "font-semibold")}>{n.displayName}</span>
                {ping !== null && (
                    <span className={cn("shrink-0 font-mono text-[10px] font-semibold", pingClass(ping))}>{ping}</span>
                )}
                {active ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
            </DropdownMenuItem>
        )
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild disabled={switching}>
                <button
                    type="button"
                    className={cn(
                        "group inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-1.5 py-1.5 backdrop-blur-md transition-all duration-200",
                        "hover:bg-white/[0.09] active:scale-[0.98] data-[state=open]:bg-white/[0.11]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        switching && "cursor-wait opacity-80",
                    )}
                >
                    {switching ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                                {t("home.nodeSelector.switching")}
                            </span>
                        </>
                    ) : (
                        <>
                            <Flag code={countryCode} />
                            <span className="max-w-[140px] truncate text-xs font-medium tracking-tight text-foreground/90 transition-colors group-hover:text-foreground">
                                {displayName}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:text-foreground/80 group-data-[state=open]:rotate-180" />
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>

            {/* Скроллится внутренний ScrollArea, а не само меню: иначе слой с блюром
                (::before во всю высоту меню) уезжает вместе с содержимым. */}
            <DropdownMenuContent align="end" sideOffset={6} className="w-64 overflow-hidden p-0">
                <ScrollArea viewportClassName="max-h-[min(420px,calc(var(--radix-dropdown-menu-content-available-height)_-_56px))] [&>div]:!block">
                <div className="p-1">
                {pinned.length > 0 && (
                    <>
                        <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                            <Pin className="h-3 w-3" />
                            {t("home.nodeSelector.pinned")}
                        </DropdownMenuLabel>
                        {pinned.map((n) => renderNode(n, "pin-"))}
                        <DropdownMenuSeparator />
                    </>
                )}

                {groups.map((g, gi) => (
                    <Fragment key={g.id}>
                        {groups.length > 1 && (
                            <DropdownMenuLabel className={cn("text-[11px] font-medium text-muted-foreground", gi > 0 && "mt-1")}>
                                {g.title}
                            </DropdownMenuLabel>
                        )}
                        {g.nodes.filter((n) => !n.isPinned).map((n) => renderNode(n))}
                    </Fragment>
                ))}

                </div>
                </ScrollArea>

                {/* Футер вне скролла: всегда на месте, долистывать не нужно. */}
                <div className="border-t border-foreground/5 p-1">
                    <DropdownMenuItem onSelect={() => navigate("/nodes")} className="gap-2.5 py-2 text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" />
                        <span className="flex-1 whitespace-nowrap text-[13px]">{t("home.nodeSelector.allServers")}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
