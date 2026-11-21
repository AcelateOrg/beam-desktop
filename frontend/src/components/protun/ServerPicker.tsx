import { useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "@/components/ui/country-flag"
import { AlertTriangle, Check, ChevronRight, Globe2, Loader2, Search, X, Zap } from "lucide-react"

import { GetProfileNodes, PingProfileNodes } from "@wailsjs/go/handlers/ProfileHandler"
import { GetProTunScopes } from "@wailsjs/go/handlers/SettingsHandler"
import { EventsOn } from "@wailsjs/runtime/runtime"
import type { types } from "@wailsjs/go/models"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { parseNodeName } from "@/lib/nodeName"
import type { ProTunServerRef } from "@/lib/protun/types"
import { cn } from "@/lib/utils"
import { t } from "@/i18n"

export const PROTUN_SET_SERVER_EVENT = "protun-node-set-server"

export interface ProTunProfileOption {
    id: string
    name: string
    active: boolean
}

// ---------------------------------------------------------------------------
// Servers of a profile, cached briefly: every «Сервер» card of the canvas
// checks its server, and they usually point at the same profile.

const NODES_TTL_MS = 15_000
const nodesCache = new Map<string, { at: number; promise: Promise<types.NodeInfo[]> }>()

function loadProfileNodes(profileId: string, force = false): Promise<types.NodeInfo[]> {
    const cached = nodesCache.get(profileId)
    if (!force && cached && Date.now() - cached.at < NODES_TTL_MS) return cached.promise
    const promise = GetProfileNodes(profileId)
        .then((r) => (r.success && r.data ? (r.data.categories ?? []).flatMap((c: { nodes?: types.NodeInfo[] }) => c.nodes ?? []) : []))
        .catch(() => [] as types.NodeInfo[])
    nodesCache.set(profileId, { at: Date.now(), promise })
    return promise
}

export function loadProTunProfiles(): Promise<ProTunProfileOption[]> {
    return GetProTunScopes()
        .then((r) =>
            r.success && r.data
                ? (r.data.profiles ?? []).map((p) => ({ id: p.id, name: p.name, active: p.active }))
                : []
        )
        .catch(() => [])
}

function safeDecode(name: string): string {
    try {
        return decodeURIComponent(name)
    } catch {
        return name
    }
}

// Same lookup as the backend: by ID, then by name.
function findNode(nodes: types.NodeInfo[], ref: ProTunServerRef): types.NodeInfo | undefined {
    return nodes.find((n) => n.id === ref.nodeId) ?? (ref.name ? nodes.find((n) => n.name === ref.name) : undefined)
}

type RefStatus = "empty" | "loading" | "ok" | "missing"

function useServerRefStatus(ref: ProTunServerRef | undefined): RefStatus {
    const [status, setStatus] = useState<RefStatus>(ref ? "loading" : "empty")
    useEffect(() => {
        if (!ref) {
            setStatus("empty")
            return
        }
        let cancelled = false
        setStatus("loading")
        loadProfileNodes(ref.profileId).then((nodes) => {
            if (!cancelled) setStatus(findNode(nodes, ref) ? "ok" : "missing")
        })
        return () => {
            cancelled = true
        }
    }, [ref?.profileId, ref?.nodeId, ref?.name])
    return status
}

function ServerFlag({ name, className }: { name: string; className?: string }) {
    const { countryCode } = parseNodeName(safeDecode(name))
    return (
        <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted", className)}>
            {countryCode ? (
                <ReactCountryFlag
                    countryCode={countryCode}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    className="absolute inset-0"
                />
            ) : (
                <Globe2 className="h-3/4 w-3/4 text-muted-foreground" />
            )}
        </span>
    )
}

function serverTitle(name: string): string {
    const decoded = safeDecode(name)
    return parseNodeName(decoded).displayName || decoded
}

// ---------------------------------------------------------------------------
// Card body of the «Сервер» destination.

export function ServerCardBody({
    nodeId,
    server,
    locked,
}: {
    nodeId: string
    server?: ProTunServerRef
    locked: boolean
}) {
    const [open, setOpen] = useState(false)
    const status = useServerRefStatus(server)

    const pick = (ref: ProTunServerRef) => {
        window.dispatchEvent(new CustomEvent(PROTUN_SET_SERVER_EVENT, { detail: { nodeId, server: { ...ref, via: server?.via } } }))
        setOpen(false)
    }

    const setVia = (via?: ProTunServerRef) => {
        if (!server) return
        window.dispatchEvent(new CustomEvent(PROTUN_SET_SERVER_EVENT, { detail: { nodeId, server: { ...server, via } } }))
    }

    return (
        <>
            <div className="px-3 pb-3 pt-2.5">
                <button
                    type="button"
                    disabled={locked}
                    className={cn(
                        "nodrag nopan group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-start transition-colors",
                        server
                            ? "border-border/60 bg-muted/40 hover:border-border hover:bg-muted"
                            : "border-dashed border-border text-muted-foreground hover:border-muted-foreground hover:bg-muted hover:text-foreground",
                        status === "missing" && "border-amber-500/50 bg-amber-500/10 hover:border-amber-500/70 hover:bg-amber-500/15",
                        locked && "cursor-default"
                    )}
                    style={{ pointerEvents: "all" }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (!locked) setOpen(true)
                    }}
                >
                    {server ? (
                        <>
                            <ServerFlag name={server.name ?? ""} className="h-5 w-5" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium leading-tight text-foreground">
                                    {serverTitle(server.name || t("protun.server.fallbackName"))}
                                </span>
                                <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                                    {server.profileName || t("protun.server.fallbackProfile")}
                                </span>
                            </span>
                            {status === "loading" ? (
                                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
                            ) : !locked ? (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                            ) : null}
                        </>
                    ) : (
                        <span className="flex w-full items-center justify-center gap-1.5 text-[11px] font-medium">
                            <Globe2 className="h-3.5 w-3.5" />
                            {t("protun.server.choose")}
                        </span>
                    )}
                </button>

                {status === "missing" ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] leading-snug text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {t("protun.server.missingFallback")}
                    </p>
                ) : !server ? (
                    <p className="mt-2 text-[10px] leading-snug text-muted-foreground">{t("protun.server.notChosen")}</p>
                ) : null}

                {server && (!locked || server.via) && (
                    <div className="nodrag nopan mt-2 flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{t("protun.server.via")}</span>
                        <div className={cn("min-w-0 flex-1", locked && "pointer-events-none")}>
                            <ServerSelectButton compact value={server.via} placeholder={t("protun.server.viaDirect")} onPick={setVia} />
                        </div>
                        {server.via && !locked && (
                            <button
                                type="button"
                                title={t("protun.server.removeVia")}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                onClick={() => setVia(undefined)}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!locked && (
                <ServerPickerDialog open={open} value={server} onOpenChange={setOpen} onPick={pick} />
            )}
        </>
    )
}

// ---------------------------------------------------------------------------
// Standalone server selector (used outside the ProTun canvas): the button
// shows the chosen server, and a click opens the picker.

export function ServerSelectButton({
    value,
    onPick,
    placeholder,
    compact = false,
}: {
    value?: ProTunServerRef
    onPick: (ref: ProTunServerRef) => void
    placeholder?: string
    // One line, for a settings row: the profile name goes to the tooltip.
    compact?: boolean
}) {
    const [open, setOpen] = useState(false)
    const status = useServerRefStatus(value)

    return (
        <>
            <button
                type="button"
                title={value?.profileName}
                className={cn(
                    "group flex w-full items-center gap-2.5 rounded-md border px-2.5 text-start transition-colors",
                    compact ? "h-8 gap-2 px-2" : "py-2",
                    value
                        ? "border-border/60 bg-muted/40 hover:border-border hover:bg-muted"
                        : "border-dashed border-border text-muted-foreground hover:border-muted-foreground hover:bg-muted hover:text-foreground",
                    status === "missing" && "border-amber-500/50 bg-amber-500/10 hover:border-amber-500/70 hover:bg-amber-500/15"
                )}
                onClick={() => setOpen(true)}
            >
                {value ? (
                    <>
                        <ServerFlag name={value.name ?? ""} className={compact ? "h-4 w-4" : "h-5 w-5"} />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium leading-tight text-foreground">
                                {serverTitle(value.name || t("protun.server.fallbackName"))}
                            </span>
                            {!compact && (
                                <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                                    {status === "missing" ? t("protun.server.missing") : value.profileName || t("protun.server.fallbackProfile")}
                                </span>
                            )}
                        </span>
                        {status === "loading" ? (
                            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
                        ) : status === "missing" ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                        )}
                    </>
                ) : (
                    <span className="flex w-full items-center justify-center gap-1.5 text-xs font-medium">
                        <Globe2 className="h-3.5 w-3.5" />
                        {placeholder ?? t("protun.server.choose")}
                    </span>
                )}
            </button>
            <ServerPickerDialog
                open={open}
                value={value}
                onOpenChange={setOpen}
                onPick={(ref) => {
                    onPick(ref)
                    setOpen(false)
                }}
            />
        </>
    )
}

// ---------------------------------------------------------------------------
// Picker: profile chips on top, its servers below.

export function ServerPickerDialog({
    open,
    value,
    onOpenChange,
    onPick,
}: {
    open: boolean
    value?: ProTunServerRef
    onOpenChange: (open: boolean) => void
    onPick: (ref: ProTunServerRef) => void
}) {
    const [profiles, setProfiles] = useState<ProTunProfileOption[]>([])
    const [profileId, setProfileId] = useState<string>("")
    const [nodes, setNodes] = useState<types.NodeInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState("")
    const [pings, setPings] = useState<Record<string, number>>({})
    const [pinging, setPinging] = useState(false)

    useEffect(() => {
        if (!open) return
        setQuery("")
        void loadProTunProfiles().then((list) => {
            setProfiles(list)
            const preferred =
                (value && list.find((p) => p.id === value.profileId)?.id) ??
                list.find((p) => p.active)?.id ??
                list[0]?.id ??
                ""
            setProfileId(preferred)
        })
    }, [open])

    useEffect(() => {
        if (!open || !profileId) return
        let cancelled = false
        setLoading(true)
        setPings({})
        loadProfileNodes(profileId, true).then((list) => {
            if (cancelled) return
            setNodes(list)
            setLoading(false)
        })
        return () => {
            cancelled = true
        }
    }, [open, profileId])

    // Results stream in while the batch is still running.
    useEffect(() => {
        if (!open) return
        return EventsOn("ping:result", (r: { nodeId: string; latency: number }) =>
            setPings((prev) => ({ ...prev, [r.nodeId]: r.latency > 0 ? r.latency : -1 }))
        )
    }, [open])

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return nodes
        return nodes.filter((n) => safeDecode(n.name).toLowerCase().includes(q))
    }, [nodes, query])

    const ping = async () => {
        if (!profileId || pinging) return
        setPinging(true)
        try {
            const r = await PingProfileNodes(profileId, [])
            if (r.success && r.data) {
                const next: Record<string, number> = {}
                for (const p of r.data) next[p.nodeId] = p.latency > 0 ? p.latency : -1
                setPings(next)
            }
        } catch {
            // Ping is a hint only.
        } finally {
            setPinging(false)
        }
    }

    const profileName = profiles.find((p) => p.id === profileId)?.name ?? ""

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[80vh] max-w-md flex-col gap-3 p-4">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Globe2 className="h-4 w-4 text-chart-1" />
                        {t("protun.server.picker.title")}
                    </DialogTitle>
                </DialogHeader>

                {profiles.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                        {profiles.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setProfileId(p.id)}
                                className={cn(
                                    "flex max-w-[180px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                                    p.id === profileId
                                        ? "border-primary/60 bg-primary/10 text-foreground"
                                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {p.active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
                                <span className="truncate">{p.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("protun.server.picker.search")}
                            className="h-8 w-full rounded-md border border-border/60 bg-muted/40 ps-8 pe-2 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-muted"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => void ping()}
                        disabled={pinging || nodes.length === 0}
                        title={t("protun.server.picker.pingHint")}
                        className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                        {pinging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                        {t("protun.server.picker.ping")}
                    </button>
                </div>

                <ScrollArea className="min-h-0 flex-1" viewportClassName="max-h-[50vh] [&>div]:!block">
                    {loading ? (
                        <div className="flex h-24 items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : visible.length === 0 ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">
                            {nodes.length === 0 ? t("protun.server.picker.noServers") : t("common.nothingFound")}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1 pe-1">
                            {visible.map((node) => {
                                const chosen = value?.profileId === profileId && value?.nodeId === node.id
                                const latency = pings[node.id]
                                return (
                                    <button
                                        key={node.id}
                                        type="button"
                                        onClick={() =>
                                            onPick({ profileId, nodeId: node.id, name: node.name, profileName })
                                        }
                                        className={cn(
                                            "flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-start transition-colors",
                                            chosen
                                                ? "border-primary/60 bg-primary/10"
                                                : "border-transparent hover:border-border hover:bg-muted"
                                        )}
                                    >
                                        <ServerFlag name={node.name} className="h-5 w-5" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-xs font-medium">{serverTitle(node.name)}</span>
                                            {node.description && (
                                                <span className="block truncate text-[10px] text-muted-foreground">
                                                    {node.description}
                                                </span>
                                            )}
                                        </span>
                                        {latency !== undefined && (
                                            <span
                                                className={cn(
                                                    "shrink-0 text-[10px] tabular-nums",
                                                    latency < 0
                                                        ? "text-destructive"
                                                        : latency < 150
                                                          ? "text-emerald-500"
                                                          : latency < 400
                                                            ? "text-amber-500"
                                                            : "text-destructive"
                                                )}
                                            >
                                                {latency < 0 ? "—" : t("protun.server.picker.latency", { value: latency })}
                                            </span>
                                        )}
                                        {node.isSelected && profiles.find((p) => p.id === profileId)?.active && (
                                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                                VPN
                                            </span>
                                        )}
                                        {chosen && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
