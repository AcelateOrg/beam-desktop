import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { NodeResizer, Position, type NodeProps } from "@xyflow/react"
import { Ban, Check, Monitor, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { appDisplayName, cn, normalizeAppIdentifier } from "@/lib/utils"
import { fixedOptionsOf, isResizableKind, NODE_META } from "@/lib/protun/meta"
import { geoLabel, isGeoKind } from "@/lib/protun/geo"
import { formatPort, normalizePort, portHint } from "@/lib/protun/ports"
import { GeoFlag, GeoPickerDialog } from "@/components/protun/GeoPickerDialog"
import type { RuleNodeData } from "@/lib/protun/codec"
import { supportsInvert } from "@/lib/protun/types"
import { ProcessPickerDialog } from "@/components/app/ProcessPickerDialog"
import { useRunningApplications } from "@/hooks/useRunningApplications"
import { EdgeUiContext } from "@/components/protun/edges/DeletableEdge"
import { ServerCardBody } from "@/components/protun/ServerPicker"
import { conflictKey, conflictValueSet, useNodeConflicts } from "@/lib/protun/conflicts"
import { PriorityChip } from "@/components/protun/RuleOrder"
import {
    NodeCardAction,
    NodeCardDivider,
    NodeCardHeader,
    NodeCardNote,
    NodeCardShell,
    NodeConflictBadge,
    NodeHandle,
} from "./NodeShell"
import { t } from "@/i18n"

export const PROTUN_ADD_ITEM_EVENT = "protun-node-add-item"
export const PROTUN_REMOVE_ITEM_EVENT = "protun-node-remove-item"
export const PROTUN_PATCH_NODE_EVENT = "protun-node-patch"

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()

function InvertSwitch({ inverted, disabled, onChange }: { inverted: boolean; disabled: boolean; onChange: (next: boolean) => void }) {
    return (
        <Tabs
            value={inverted ? "except" : "only"}
            onValueChange={(v) => onChange(v === "except")}
            className="nodrag nopan px-3 pt-2.5"
            style={{ pointerEvents: "all" }}
            onPointerDown={stop}
        >
            <TabsList className="w-full">
                <TabsTrigger value="only" disabled={disabled} className="text-xs">
                    {t("protun.rule.only")}
                </TabsTrigger>
                <TabsTrigger value="except" disabled={disabled} className="text-xs">
                    <Ban className="size-3.5" />
                    {t("protun.rule.except")}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}

export const RULE_NODE_MIN_WIDTH = 220
export const RULE_NODE_MIN_HEIGHT = 170

// Search is offered only once a list is too long to scan by eye.
const SEARCH_THRESHOLD = 15
// Порог, с которого список элементов узла переводится на виртуализацию.
// До него рендерим как раньше — пиксель-в-пиксель, без лишней механики.
const VIRTUALIZE_THRESHOLD = 50
// Высота строки списка (border + py-1.5 + текст 11px) и запас строк
// сверху/снизу видимой области, чтобы скролл не мерцал.
const VIRTUAL_ROW_HEIGHT = 30
const VIRTUAL_OVERSCAN = 8

// Several entries can be added at once. Domains and IPs never contain
// spaces, so whitespace separates them too; process names may have spaces
// ("Google Chrome.exe"), so apps split only on commas, semicolons, newlines.
function splitItems(raw: string, isApps: boolean): string[] {
    return raw.split(isApps ? /[,;\n]+/ : /[\s,;]+/)
}

export function RuleNode({ id, data, selected }: NodeProps) {
    const nodeData = data as RuleNodeData
    const meta = NODE_META[nodeData.kind]
    const Icon = meta.icon
    const isSource = meta.role === "source"
    const isEmitter = meta.role !== "destination"
    const isApps = nodeData.kind === "apps"
    // Protocols and network cards pick from a fixed set instead of a typed list.
    const fixedOptions = fixedOptionsOf(nodeData.kind) ?? []
    const isProtocols = fixedOptionsOf(nodeData.kind) !== null
    const resizable = isResizableKind(nodeData.kind)
    // Geo cards pick codes from the downloaded databases.
    const geoKind = isGeoKind(nodeData.kind) ? nodeData.kind : null
    const [geoOpen, setGeoOpen] = useState(false)
    // Ports are validated before they reach the list.
    const isPorts = nodeData.kind === "ports"
    const items = nodeData.items ?? []
    const isServer = nodeData.kind === "server"
    const { locked } = useContext(EdgeUiContext)
    const { conflicts, onPath } = useNodeConflicts(id)
    const conflictValues = useMemo(() => conflictValueSet(conflicts), [conflicts])
    const invertible = supportsInvert(nodeData.kind)
    const inverted = invertible && !!nodeData.invert
    // Исключения старого формата («Список / Кроме»): работают, пока карточка
    // не в режиме «Все, кроме», и сбрасываются одной кнопкой.
    const legacyExcept = !inverted ? nodeData.except ?? [] : []
    const listItems = items
    const listGeoKind = geoKind
    const patchNode = (patch: Partial<RuleNodeData>) =>
        window.dispatchEvent(new CustomEvent(PROTUN_PATCH_NODE_EVENT, { detail: { nodeId: id, patch } }))

    const [addOpen, setAddOpen] = useState(false)
    const [value, setValue] = useState("")
    const [addError, setAddError] = useState(false)
    const [processPickerOpen, setProcessPickerOpen] = useState(false)
    const runningApps = useRunningApplications()

    // Поиск прячется за кнопкой с лупой и существует, только пока список
    // длиннее порога: стоит списку укоротиться — фильтр пропадает сам.
    const searchable = !isProtocols && listItems.length > SEARCH_THRESHOLD
    const [searchOpen, setSearchOpen] = useState(false)
    const [filterQuery, setFilterQuery] = useState("")
    const searching = searchable && searchOpen
    const query = searching ? filterQuery.trim().toLowerCase() : ""
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (searching) searchRef.current?.focus()
    }, [searching])

    const closeSearch = () => {
        setSearchOpen(false)
        setFilterQuery("")
    }

    const visibleItems = useMemo(() => {
        const indexed = listItems.map((item, index) => ({ item, index }))
        if (!query) return indexed
        return indexed.filter(
            ({ item }) =>
                item.toLowerCase().includes(query) ||
                (listGeoKind !== null && geoLabel(listGeoKind, item).toLowerCase().includes(query))
        )
    }, [listItems, query, listGeoKind])

    // Виртуализация: рендерим только строки в видимой области скролла.
    // Высота строки фиксированная, поэтому окно считается арифметикой.
    const virtualized = listItems.length > VIRTUALIZE_THRESHOLD
    // Viewport of the ScrollArea; kept in state because the list unmounts
    // while empty or filtered to nothing and must be re-subscribed after.
    const [listEl, setListEl] = useState<HTMLDivElement | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [viewportHeight, setViewportHeight] = useState(0)
    useLayoutEffect(() => {
        if (!virtualized || !listEl) return
        const measure = () => setViewportHeight(listEl.clientHeight)
        const onScroll = () => setScrollTop(listEl.scrollTop)
        measure()
        onScroll()
        const observer = new ResizeObserver(measure)
        observer.observe(listEl)
        listEl.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            observer.disconnect()
            listEl.removeEventListener("scroll", onScroll)
        }
    }, [virtualized, listEl])

    // A new filter starts from the top of its results.
    useEffect(() => {
        listEl?.scrollTo({ top: 0 })
        setScrollTop(0)
    }, [query, listEl])

    const windowStart = virtualized
        ? Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN)
        : 0
    const windowEnd = virtualized
        ? Math.min(
            visibleItems.length,
            Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN
        )
        : visibleItems.length
    const renderedItems = virtualized
        ? visibleItems.slice(windowStart, windowEnd)
        : visibleItems

    const addItems = (raw: string[]) => {
        const values = raw
            .map((v) => (isApps ? normalizeAppIdentifier(v) : v.trim()))
            .filter(Boolean)
        if (values.length === 0) return
        window.dispatchEvent(
            new CustomEvent(PROTUN_ADD_ITEM_EVENT, { detail: { nodeId: id, values } })
        )
    }

    const changeAddOpen = (open: boolean) => {
        setAddOpen(open)
        if (!open) {
            setValue("")
            setAddError(false)
        }
    }

    const handleAdd = () => {
        let values = splitItems(value, isApps)
        if (isPorts) {
            // One bad port keeps the dialog open with the whole input, so it
            // can be fixed instead of silently losing part of it.
            const ports = values.filter(Boolean).map(normalizePort)
            if (ports.some((p) => p === null)) {
                setAddError(true)
                return
            }
            values = ports as string[]
        }
        addItems(values)
        changeAddOpen(false)
    }

    const openProcessPicker = () => {
        setProcessPickerOpen(true)
        void runningApps.load()
    }

    const handlePickProcess = (value: string) => {
        addItems([value])
        setProcessPickerOpen(false)
        changeAddOpen(false)
    }

    const handleRemove = (index: number) => {
        window.dispatchEvent(
            new CustomEvent(PROTUN_REMOVE_ITEM_EVENT, { detail: { nodeId: id, index } })
        )
    }

    // Значение, из-за которого конфликт (fdm.exe в двух карточках).
    const isHot = (item: string) => !!conflictValues?.has(conflictKey(item))
    const hotRowClass = "border-destructive/60 bg-destructive/10 hover:border-destructive hover:bg-destructive/15"

    // Строка списка: общий рендер для обычного и виртуализованного режимов.
    // index — индекс в исходном массиве items (удаление идёт по нему).
    const renderRow = (item: string, index: number) => (
        <>
            {isHot(item) && <TriangleAlert className="h-3 w-3 shrink-0 text-destructive" strokeWidth={2.5} />}
            {listGeoKind ? (
                <>
                    {listGeoKind === "geoip" && <GeoFlag code={item} className="h-3.5 w-3.5" />}
                    <span className="min-w-0 flex-1 truncate text-[11px] text-foreground" title={item}>
                        {geoLabel(listGeoKind, item)}
                    </span>
                </>
            ) : isPorts ? (
                <>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground">
                        {formatPort(item)}
                    </span>
                    {portHint(item) && (
                        <span className="shrink-0 text-[10px] text-muted-foreground group-hover:hidden">
                            {portHint(item)}
                        </span>
                    )}
                </>
            ) : (
                <>
                    {inverted && <Ban className="h-3 w-3 shrink-0 text-destructive/70" />}
                    <span
                        className={cn(
                            "flex-1 truncate font-mono text-[11px] text-foreground",
                            inverted && "text-foreground/70"
                        )}
                        title={isApps ? item : undefined}
                    >
                        {isApps ? appDisplayName(item) : item}
                    </span>
                </>
            )}
            <button
                type="button"
                className="nodrag nopan text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                style={{ pointerEvents: "all" }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                }}
            >
                <Trash2 className="h-3 w-3" />
            </button>
        </>
    )

    const rowClass = "group flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 transition-colors hover:border-border hover:bg-muted"

    const renderList = () => {
        if (listItems.length === 0) {
            return (
                <div className="mb-2 flex min-h-0 w-full flex-1 items-center justify-center rounded-md border border-dashed border-border/70">
                    <p className="text-[10px] text-muted-foreground">{inverted ? (isApps ? t("protun.rule.allApps") : t("protun.rule.everything")) : t("protun.rule.emptyList")}</p>
                </div>
            )
        }
        if (visibleItems.length === 0) {
            return (
                <div className="mb-2 flex min-h-0 w-full flex-1 items-center justify-center">
                    <p className="text-[10px] text-muted-foreground">{t("common.nothingFound")}</p>
                </div>
            )
        }
        return (
            <div className="mb-2 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                {/* Radix wraps content in display:table, which grows to the longest
                    row and defeats truncate; block keeps rows at viewport width. */}
                <ScrollArea
                    viewportRef={setListEl}
                    className="nowheel min-h-0 w-full flex-1"
                    viewportClassName="[&>div]:!block"
                >
                    {virtualized ? (
                        <div
                            className="relative w-full"
                            style={{ height: visibleItems.length * VIRTUAL_ROW_HEIGHT }}
                        >
                            {renderedItems.map(({ item, index }, offset) => (
                                <div
                                    key={`${item}-${index}`}
                                    className={cn(rowClass, "absolute start-0 end-0", isHot(item) && hotRowClass)}
                                    style={{
                                        top: (windowStart + offset) * VIRTUAL_ROW_HEIGHT,
                                        height: VIRTUAL_ROW_HEIGHT - 2,
                                    }}
                                >
                                    {renderRow(item, index)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5 pe-0.5">
                            {visibleItems.map(({ item, index }) => (
                                <div key={`${item}-${index}`} className={cn(rowClass, "py-1.5", isHot(item) && hotRowClass)}>
                                    {renderRow(item, index)}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        )
    }

    const toggleItem = (value: string) => {
        const index = items.indexOf(value)
        if (index >= 0) handleRemove(index)
        else addItems([value])
    }

    const renderProtocols = () => (
        <div className="flex flex-col gap-1 p-2">
            {fixedOptions.map((option) => {
                const checked = items.includes(option.id)
                return (
                    <button
                        key={option.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        className={cn(
                            "nodrag nopan flex w-full items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-start transition-colors",
                            checked
                                ? "border-border bg-muted"
                                : "border-transparent hover:bg-muted/60"
                        )}
                        style={{ pointerEvents: "all" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleItem(option.id)
                        }}
                    >
                        <span
                            className={cn(
                                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.35)] border transition-colors",
                                checked
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/50"
                            )}
                        >
                            {checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium leading-tight text-foreground">
                                {option.label}
                            </span>
                            <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                                {option.hint}
                            </span>
                        </span>
                    </button>
                )
            })}
        </div>
    )

    const headerActions = isSource ? (
        <>
            <PriorityChip nodeId={id} />
            {!isProtocols && listItems.length > 0 && (
                <span className="px-1 text-[10px] tabular-nums text-muted-foreground">
                    {query ? `${visibleItems.length}/${listItems.length}` : listItems.length}
                </span>
            )}
            {!isProtocols && searchable && (
                <NodeCardAction
                    title={t("common.action.search")}
                    active={searching}
                    onClick={() => (searching ? closeSearch() : setSearchOpen(true))}
                >
                    <Search className="h-3.5 w-3.5" />
                </NodeCardAction>
            )}
        </>
    ) : undefined

    return (
        <>
            {!isEmitter && <NodeHandle type="target" position={Position.Left} />}
            {isEmitter && <NodeHandle type="source" position={Position.Right} />}

            {resizable && (
                <NodeResizer
                    isVisible={selected}
                    minWidth={RULE_NODE_MIN_WIDTH}
                    minHeight={RULE_NODE_MIN_HEIGHT}
                    handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-2 !border-background !bg-primary"
                    lineClassName="!border-primary"
                />
            )}

            {conflicts && <NodeConflictBadge conflicts={conflicts} />}

            <NodeCardShell
                selected={selected}
                accentBar={meta.accentBar}
                className={resizable ? "h-full w-full" : undefined}
                conflict={conflicts ? "source" : onPath ? "path" : undefined}
            >
                <NodeCardHeader
                    icon={Icon}
                    iconClassName={meta.accentText}
                    title={nodeData.label}
                    description={meta.description}
                    actions={headerActions}
                />
                <NodeCardDivider />

                {isProtocols ? (
                    renderProtocols()
                ) : isSource ? (
                    <>
                        {searchable && (
                            <div
                                className={cn(
                                    "grid shrink-0 transition-[grid-template-rows,opacity] duration-200 ease-out",
                                    searching ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}
                                aria-hidden={!searching}
                            >
                                <div className="min-h-0 overflow-hidden">
                                    <div className="relative px-3 pt-2.5">
                                        <Search className="pointer-events-none absolute start-5 top-[calc(50%+5px)] h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            ref={searchRef}
                                            tabIndex={searching ? 0 : -1}
                                            value={filterQuery}
                                            onChange={(e) => setFilterQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Escape") {
                                                    e.stopPropagation()
                                                    closeSearch()
                                                }
                                            }}
                                            placeholder={t("protun.rule.searchIn", { count: listItems.length })}
                                            className="nodrag nopan h-7 w-full rounded-md border border-border/60 bg-muted/40 ps-7 pe-7 font-mono text-[11px] text-foreground outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus:border-ring focus:bg-muted"
                                            style={{ pointerEvents: "all" }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                        />
                                        {filterQuery && (
                                            <button
                                                type="button"
                                                tabIndex={searching ? 0 : -1}
                                                aria-label={t("protun.rule.clearSearch")}
                                                className="nodrag nopan absolute end-5 top-[calc(50%+5px)] -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                                style={{ pointerEvents: "all" }}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setFilterQuery("")
                                                    searchRef.current?.focus()
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {invertible && (
                            <InvertSwitch
                                inverted={inverted}
                                disabled={locked}
                                onChange={(next) => patchNode({ invert: next })}
                            />
                        )}

                        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2.5">
                            {renderList()}

                            {legacyExcept.length > 0 && (
                                <p className="mb-2 flex shrink-0 items-center justify-between gap-2 text-[10px] text-muted-foreground">
                                    <span className="truncate" title={legacyExcept.join(", ")}>
                                        {t("protun.rule.legacyExcept", { count: legacyExcept.length })}
                                    </span>
                                    <button
                                        type="button"
                                        className="nodrag nopan shrink-0 underline transition-colors hover:text-foreground"
                                        style={{ pointerEvents: "all" }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            patchNode({ except: [] })
                                        }}
                                    >
                                        {t("protun.rule.reset")}
                                    </button>
                                </p>
                            )}

                            <button
                                type="button"
                                className="nodrag nopan mt-auto flex w-full shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-muted-foreground hover:bg-muted hover:text-foreground"
                                style={{ pointerEvents: "all" }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (listGeoKind) setGeoOpen(true)
                                    else setAddOpen(true)
                                }}
                            >
                                <Plus className="h-3 w-3" />
                                {t("protun.rule.add")}
                            </button>
                        </div>
                    </>
                ) : isServer ? (
                    <ServerCardBody nodeId={id} server={nodeData.server} locked={locked} />
                ) : (
                    <NodeCardNote dotClassName={meta.accentBar}>{meta.statusText}</NodeCardNote>
                )}
            </NodeCardShell>

            {isSource && (
                <Dialog open={addOpen} onOpenChange={changeAddOpen}>
                    <DialogContent className="max-w-sm p-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base">
                                <Icon className={cn("h-4 w-4", meta.accentText)} />
                                {meta.label}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 py-2">
                            <Label className="text-xs text-muted-foreground">{meta.itemLabel}</Label>
                            <Input
                                autoFocus
                                placeholder={meta.placeholder}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value)
                                    setAddError(false)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && value.trim()) handleAdd()
                                }}
                                aria-invalid={addError || undefined}
                                className={cn("font-mono text-sm", addError && "border-destructive focus-visible:ring-destructive")}
                            />
                            {isApps && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-1.5"
                                    onClick={openProcessPicker}
                                >
                                    <Monitor className="h-3.5 w-3.5" />
                                    {t("protun.rule.pickRunning")}
                                </Button>
                            )}
                            <p className={cn("text-[10px] leading-relaxed", addError ? "text-destructive" : "text-muted-foreground")}>
                                {addError
                                    ? t("protun.rule.invalidPort")
                                    : meta.itemHint}
                            </p>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="ghost" size="sm" onClick={() => changeAddOpen(false)}>
                                {t("common.action.cancel")}
                            </Button>
                            <Button size="sm" onClick={handleAdd} disabled={!value.trim()}>
                                {t("protun.rule.add")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {geoKind && (
                <GeoPickerDialog
                    open={geoOpen}
                    kind={geoKind}
                    selected={items}
                    onOpenChange={setGeoOpen}
                    onToggle={toggleItem}
                />
            )}

            {isApps && (
                <ProcessPickerDialog
                    open={processPickerOpen}
                    loading={runningApps.loading}
                    query={runningApps.query}
                    processes={runningApps.processes}
                    onOpenChange={setProcessPickerOpen}
                    onQueryChange={runningApps.setQuery}
                    onReload={() => void runningApps.load()}
                    onSelect={handlePickProcess}
                />
            )}
        </>
    )
}
