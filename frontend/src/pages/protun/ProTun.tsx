import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    BackgroundVariant,
    addEdge,
    useReactFlow,
    type Connection,
    type Edge,
    type EdgeTypes,
    type Node,
    type NodeProps,
    type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { FileDown, FilePlus, FileUp, Info, Loader2, Lock, Maximize2, PanelRight, Plus, Split, TriangleAlert, Waypoints } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

import { RuleNode } from "@/components/protun/nodes/RuleNode"
import { CommentNode } from "@/components/protun/nodes/CommentNode"
import { LogicNode } from "@/components/protun/nodes/LogicNode"
import { DeletableEdge, EdgeUiContext } from "@/components/protun/edges/DeletableEdge"
import { RoutingModeSwitch } from "@/components/protun/RoutingModeSwitch"
import { ProTunScopeSwitcher } from "@/components/protun/ScopeSwitcher"
import { ADD_MENU_CONTENT_CLASS, AddNodeMenuItems, ProTunAddMenu, ProTunContextMenu, type MenuPosition, type NodeContextMenuState } from "@/components/protun/ProTunMenus"
import {
    PalettePlacementLayer,
    PROTUN_LANDING_CLASS,
    ProTunPalette,
    type PaletteItem,
    type PalettePlacement,
} from "@/components/protun/ProTunPalette"
import { isResizableKind, NODE_META, type ProTunRuleKind } from "@/lib/protun/meta"
import {
    COMMENT_NODE_TYPE,
    LOGIC_NODE_TYPE,
    RULE_NODE_DEFAULT_HEIGHT,
    RULE_NODE_DEFAULT_WIDTH,
    RULE_NODE_TYPE,
    edgeStyleForTarget,
    newEdgeId,
    newNodeId,
    type RuleNodeData,
} from "@/lib/protun/codec"
import type { ProTunLogicOp, RoutingMode } from "@/lib/protun/types"
import { NO_CONFLICTS, ProTunConflictContext, useProTunConflicts, type ProTunConflict } from "@/lib/protun/conflicts"
import { ProTunPriorityContext, useProTunRuleOrder } from "@/lib/protun/priority"

import { useProTunGraph } from "./useProTunGraph"
import { t } from "@/i18n"

const PALETTE_STORAGE_KEY = "beam.protun.palette"

function readPaletteOpen(): boolean {
    try {
        return localStorage.getItem(PALETTE_STORAGE_KEY) === "1"
    } catch {
        return false
    }
}

// Карточкам не важны координаты: при перетаскивании xyflow шлёт новые
// positionAbsoluteX/Y каждый кадр, и без этого сравнения тяжёлая карточка
// (списки, диалоги) перерисовывалась бы на каждый пиксель движения.
function sameNodeProps(a: NodeProps, b: NodeProps): boolean {
    return (
        a.id === b.id &&
        a.data === b.data &&
        a.selected === b.selected &&
        a.width === b.width &&
        a.height === b.height &&
        a.isConnectable === b.isConnectable &&
        a.type === b.type
    )
}

const nodeTypes: NodeTypes = {
    [RULE_NODE_TYPE]: memo(RuleNode, sameNodeProps),
    [COMMENT_NODE_TYPE]: memo(CommentNode, sameNodeProps),
    [LOGIC_NODE_TYPE]: memo(LogicNode, sameNodeProps),
}

// Every link gets a remove button (hover/selection): the built-in default
// edge is replaced, so old saved graphs get it too.
const edgeTypes: EdgeTypes = {
    default: memo(DeletableEdge),
}

// Холст перерисовывается на каждом кадре перетаскивания (узлы — его state),
// поэтому всё тяжёлое вокруг мемоизировано и получает стабильные пропсы.
const MemoPalette = memo(ProTunPalette)
const MemoPlacementLayer = memo(PalettePlacementLayer)
const MemoContextMenu = memo(ProTunContextMenu)
const MemoAddMenu = memo(ProTunAddMenu)

const FIT_VIEW_OPTIONS = { padding: 0.2 }
const PRO_OPTIONS = { hideAttribution: true }
const CANVAS_STYLE = { background: "var(--protun-canvas, var(--background))" }
const DRAGGING_CLASS = "protun-dragging"

function reachableFrom(startId: string, edges: Edge[]): Set<string> {
    const adjacency = new Map<string, string[]>()
    for (const e of edges) {
        if (!adjacency.has(e.source)) adjacency.set(e.source, [])
        adjacency.get(e.source)!.push(e.target)
    }
    const visited = new Set<string>()
    const queue = [startId]
    while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        visited.add(current)
        for (const next of adjacency.get(current) ?? []) {
            if (!visited.has(next)) queue.push(next)
        }
    }
    return visited
}

export default function ProTun({
    mode,
    onModeChange,
}: {
    mode: RoutingMode
    onModeChange: (mode: RoutingMode) => void
}) {
    const fits = useWindowFits(PROTUN_MIN_WIDTH, PROTUN_MIN_HEIGHT)

    if (!fits) {
        return (
            <div className="flex h-full w-full flex-col overflow-hidden">
                <PageHeader
                    icon={<Split className="h-4 w-4" />}
                    title={t("protun.title")}
                    showBackButton={false}
                    actions={<RoutingModeSwitch active={mode} onSwitch={onModeChange} />}
                />
                <div className="flex flex-1 items-center justify-center p-6">
                    <Empty className="max-w-xs border-none">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Maximize2 className="h-5 w-5" />
                            </EmptyMedia>
                            <EmptyTitle>{t("protun.tooSmall.title")}</EmptyTitle>
                            <EmptyDescription>
                                {t("protun.tooSmall.description")}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                </div>
            </div>
        )
    }

    return (
        <ReactFlowProvider>
            <ProTunCanvas mode={mode} onModeChange={onModeChange} />
        </ReactFlowProvider>
    )
}

// Меньше этого холст с карточками, тулбаром и панелью блоков не помещается.
const PROTUN_MIN_WIDTH = 760
const PROTUN_MIN_HEIGHT = 480

function useWindowFits(minWidth: number, minHeight: number): boolean {
    const check = () => window.innerWidth >= minWidth && window.innerHeight >= minHeight
    const [fits, setFits] = useState(check)
    useEffect(() => {
        const onResize = () => setFits(check())
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [minWidth, minHeight])
    return fits
}

function ProTunCanvas({
    mode,
    onModeChange,
}: {
    mode: RoutingMode
    onModeChange: (mode: RoutingMode) => void
}) {
    const reactFlow = useReactFlow()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const lastMousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

    const {
        loading,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        setNodes,
        setEdges,
        scope,
        scopes,
        scopeLabel,
        globalHasRules,
        switchScope,
        preset,
        exportGraph,
        importGraph,
        clearGraph,
        locked,
    } = useProTunGraph()

    // Свежие узлы/связи для обработчиков без пересоздания колбэков на каждый кадр.
    const nodesRef = useRef(nodes)
    nodesRef.current = nodes
    const edgesRef = useRef(edges)
    edgesRef.current = edges

    const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
    const [contextMenu, setContextMenu] = useState<NodeContextMenuState | null>(null)
    const [addMenuAt, setAddMenuAt] = useState<MenuPosition | null>(null)
    const [paletteOpen, setPaletteOpen] = useState(readPaletteOpen)
    const [placement, setPlacement] = useState<PalettePlacement | null>(null)

    const togglePalette = useCallback(() => {
        setPlacement(null)
        setPaletteOpen((open) => {
            try {
                localStorage.setItem(PALETTE_STORAGE_KEY, open ? "0" : "1")
            } catch {
                // Storage unavailable: the panel just is not remembered.
            }
            return !open
        })
    }, [])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (locked) return
            if (e.key.toLowerCase() !== "a" || !e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
            const target = e.target as HTMLElement | null
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return
            }
            e.preventDefault()
            setAddMenuAt({ ...lastMousePos.current })
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [locked])

    const onConnect = useCallback(
        (connection: Connection) => {
            if (locked) return
            const nodes = nodesRef.current
            const edges = edgesRef.current
            const sourceNode = nodes.find((n) => n.id === connection.source)
            const targetNode = nodes.find((n) => n.id === connection.target)
            if (!sourceNode || !targetNode) return

            const sourceIsSourceRule =
                sourceNode.type === RULE_NODE_TYPE && NODE_META[(sourceNode.data as RuleNodeData).kind].role === "source"
            const sourceIsFallback =
                sourceNode.type === RULE_NODE_TYPE && NODE_META[(sourceNode.data as RuleNodeData).kind].role === "fallback"
            const sourceIsLogic = sourceNode.type === LOGIC_NODE_TYPE
            if (!sourceIsSourceRule && !sourceIsFallback && !sourceIsLogic) return

            const targetIsLogic = targetNode.type === LOGIC_NODE_TYPE
            const targetIsDestinationRule =
                targetNode.type === RULE_NODE_TYPE && NODE_META[(targetNode.data as RuleNodeData).kind].role === "destination"
            if (!targetIsLogic && !targetIsDestinationRule) return

            if (sourceIsFallback && targetIsLogic) {
                toast.error(t("protun.toast.otherOnlyToDestination"))
                return
            }

            // У источника один выход: новая связь заменяет старую, а не запрещается.
            const existingOut = edges.filter((e) => e.source === sourceNode.id)
            if (existingOut.some((e) => e.target === targetNode.id)) return
            const remainingEdges = edges.filter((e) => e.source !== sourceNode.id)

            if (sourceIsLogic && targetIsLogic && reachableFrom(targetNode.id, remainingEdges).has(sourceNode.id)) {
                toast.error(t("protun.toast.logicCycle"))
                return
            }

            const targetKind = targetNode.type === RULE_NODE_TYPE ? (targetNode.data as RuleNodeData).kind : undefined

            setEdges((eds) =>
                addEdge(
                    {
                        ...connection,
                        id: newEdgeId(connection.source!, connection.target!),
                        animated: true,
                        style: edgeStyleForTarget(targetKind),
                    },
                    eds.filter((e) => e.source !== sourceNode.id)
                )
            )
        },
        [setEdges, locked]
    )

    const spawnPosition = useCallback(
        (offsetIndex: number) => {
            const rect = wrapperRef.current?.getBoundingClientRect()
            const center = rect
                ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
            const jitter = (offsetIndex % 5) * 28
            return reactFlow.screenToFlowPosition({ x: center.x - 110 + jitter, y: center.y - 70 + jitter })
        },
        [reactFlow]
    )

    const addRuleNode = useCallback(
        (kind: ProTunRuleKind, at?: MenuPosition, className?: string) => {
            const meta = NODE_META[kind]
            const data: RuleNodeData = { kind, label: meta.label, items: [] }
            setNodes((nds) => [
                ...nds,
                {
                    id: newNodeId(),
                    type: RULE_NODE_TYPE,
                    position: at ? reactFlow.screenToFlowPosition(at) : spawnPosition(nds.length),
                    data,
                    className,
                    ...(isResizableKind(kind)
                        ? { width: RULE_NODE_DEFAULT_WIDTH, height: RULE_NODE_DEFAULT_HEIGHT }
                        : {}),
                },
            ])
        },
        [setNodes, spawnPosition, reactFlow]
    )

    const addCommentNode = useCallback(
        (at?: MenuPosition, className?: string) => {
            setNodes((nds) => [
                ...nds,
                {
                    id: newNodeId(),
                    type: COMMENT_NODE_TYPE,
                    position: at ? reactFlow.screenToFlowPosition(at) : spawnPosition(nds.length),
                    width: 220,
                    height: 130,
                    data: { text: "" },
                    className,
                },
            ])
        },
        [setNodes, spawnPosition, reactFlow]
    )

    const addLogicNode = useCallback(
        (op: ProTunLogicOp, at?: MenuPosition, className?: string) => {
            setNodes((nds) => [
                ...nds,
                {
                    id: newNodeId(),
                    type: LOGIC_NODE_TYPE,
                    position: at ? reactFlow.screenToFlowPosition(at) : spawnPosition(nds.length),
                    data: { op },
                    className,
                },
            ])
        },
        [setNodes, spawnPosition, reactFlow]
    )

    const addPaletteItem = useCallback(
        (item: PaletteItem, at?: MenuPosition) => {
            // Cards from the palette play a short landing animation.
            const landing = PROTUN_LANDING_CLASS
            if (item.type === "rule") addRuleNode(item.kind, at, landing)
            else if (item.type === "logic") addLogicNode(item.op, at, landing)
            else addCommentNode(at, landing)
        },
        [addRuleNode, addLogicNode, addCommentNode]
    )

    const placePaletteItem = useCallback(
        (item: PaletteItem, at: MenuPosition) => {
            setPlacement(null)
            addPaletteItem(item, at)
        },
        [addPaletteItem]
    )

    const cancelPlacement = useCallback(() => setPlacement(null), [])
    const getZoom = useCallback(() => reactFlow.getZoom(), [reactFlow])

    const duplicateNodes = useCallback(
        (nodeIds: string[]) => {
            if (nodeIds.length === 0) return
            setNodes((nds) => {
                const idSet = new Set(nodeIds)
                const clones: Node[] = nds
                    .filter((n) => idSet.has(n.id))
                    .map((original) => ({
                        ...original,
                        id: newNodeId(),
                        position: { x: original.position.x + 32, y: original.position.y + 32 },
                        selected: false,
                        data: JSON.parse(JSON.stringify(original.data)),
                    }))
                return [...nds, ...clones]
            })
        },
        [setNodes]
    )

    const deleteNodes = useCallback(
        (nodeIds: string[]) => {
            if (nodeIds.length === 0) return
            const idSet = new Set(nodeIds)
            setNodes((nds) => nds.filter((n) => !idSet.has(n.id)))
            setEdges((eds) => eds.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)))
        },
        [setNodes, setEdges]
    )

    const resolveContextTargets = useCallback(
        (nodeId: string) => {
            const nodes = nodesRef.current
            const clicked = nodes.find((n) => n.id === nodeId)
            if (clicked?.selected) {
                const selected = nodes.filter((n) => n.selected).map((n) => n.id)
                if (selected.length > 0) return selected
            }
            return [nodeId]
        },
        []
    )

    const onNodeContextMenu = useCallback(
        (event: ReactMouseEvent, node: Node) => {
            event.preventDefault()
            setContextMenu({ targetIds: resolveContextTargets(node.id), x: event.clientX, y: event.clientY })
        },
        [resolveContextTargets]
    )

    const onSelectionContextMenu = useCallback((event: ReactMouseEvent, selectedNodes: Node[]) => {
        event.preventDefault()
        setContextMenu({ targetIds: selectedNodes.map((n) => n.id), x: event.clientX, y: event.clientY })
    }, [])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Delete") return
            const target = e.target as HTMLElement | null
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return
            }
            if (locked) return
            const selectedIds = nodesRef.current.filter((n) => n.selected).map((n) => n.id)
            const selectedEdges = new Set(edgesRef.current.filter((ed) => ed.selected).map((ed) => ed.id))
            if (selectedIds.length === 0 && selectedEdges.size === 0) return
            e.preventDefault()
            if (selectedEdges.size > 0) setEdges((eds) => eds.filter((ed) => !selectedEdges.has(ed.id)))
            deleteNodes(selectedIds)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [deleteNodes, setEdges, locked])

    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
    const unhoverTimer = useRef<number | undefined>(undefined)
    const edgeUi = useMemo(
        () => ({
            hoveredId: hoveredEdgeId,
            locked,
            hover: (id: string) => {
                window.clearTimeout(unhoverTimer.current)
                setHoveredEdgeId(id)
            },
            // Delayed so the cursor can travel from the line to its button.
            unhover: () => {
                window.clearTimeout(unhoverTimer.current)
                unhoverTimer.current = window.setTimeout(() => setHoveredEdgeId(null), 250)
            },
        }),
        [hoveredEdgeId, locked]
    )
    useEffect(() => () => window.clearTimeout(unhoverTimer.current), [])

    const onEdgeMouseEnter = useCallback((_: ReactMouseEvent, edge: Edge) => edgeUi.hover(edge.id), [edgeUi])
    const onEdgeMouseLeave = useCallback(() => edgeUi.unhover(), [edgeUi])
    const onEdgeDoubleClick = useCallback(
        (_: ReactMouseEvent, edge: Edge) => setEdges((eds) => eds.filter((ed) => ed.id !== edge.id)),
        [setEdges]
    )
    const onCanvasMouseMove = useCallback((e: ReactMouseEvent) => {
        lastMousePos.current = { x: e.clientX, y: e.clientY }
    }, [])
    // Бегущий пунктир на связях на время перетаскивания замирает: класс
    // ставится прямо на DOM, без перерисовки React.
    const onNodeDragStart = useCallback(() => wrapperRef.current?.classList.add(DRAGGING_CLASS), [])
    const onNodeDragStop = useCallback(() => wrapperRef.current?.classList.remove(DRAGGING_CLASS), [])
    const closeContextMenu = useCallback(() => setContextMenu(null), [])
    const closeAddMenu = useCallback(() => setAddMenuAt(null), [])
    const quickAddPaletteItem = useCallback((item: PaletteItem) => addPaletteItem(item), [addPaletteItem])
    const openClearConfirm = useCallback(() => setClearConfirmOpen(true), [])

    const handleClear = useCallback(() => {
        clearGraph()
        setClearConfirmOpen(false)
    }, [clearGraph])

    const hasOtherNode = nodes.some((n) => n.type === RULE_NODE_TYPE && (n.data as RuleNodeData).kind === "other")
    const isEmpty = nodes.length === 0

    // Правила провайдера пользователь не правит — и конфликты в них не его забота.
    const checkedConflicts = useProTunConflicts(nodes, edges)
    const conflictState = locked || loading ? NO_CONFLICTS : checkedConflicts
    const conflicts = conflictState.conflicts
    const focusConflict = useCallback(
        (conflict: ProTunConflict) =>
            reactFlow.fitView({
                nodes: [...conflict.nodes, ...conflict.targets].map((id) => ({ id })),
                padding: 0.35,
                maxZoom: 1.2,
                duration: 450,
            }),
        [reactFlow]
    )

    const priorityState = useProTunRuleOrder(nodes, edges)

    const header = useMemo(
        () => (
            <PageHeader
                icon={<Split className="h-4 w-4" />}
                title={t("protun.title")}
                showBackButton={false}
                actions={<RoutingModeSwitch active={mode} onSwitch={onModeChange} />}
                toolbar={
                    <div className="flex items-center gap-2">
                        <ProTunScopeSwitcher
                            scope={scope}
                            scopes={scopes}
                            label={scopeLabel}
                            locked={locked}
                            globalHasRules={globalHasRules}
                            onSwitch={switchScope}
                        />

                        <div className="ms-auto flex items-center gap-1.5">
                            {!locked && (
                                <Button
                                    variant={paletteOpen ? "secondary" : "outline"}
                                    size="sm"
                                    className="h-7 gap-1.5 text-xs"
                                    aria-pressed={paletteOpen}
                                    title={paletteOpen ? t("protun.toolbar.hidePalette") : t("protun.toolbar.showPalette")}
                                    onClick={togglePalette}
                                >
                                    <PanelRight className="h-3.5 w-3.5" />
                                    {t("protun.toolbar.blocks")}
                                </Button>
                            )}
                            {!locked && (
                                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={importGraph}>
                                    <FileUp className="h-3.5 w-3.5" />
                                    {t("protun.toolbar.open")}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={exportGraph}>
                                <FileDown className="h-3.5 w-3.5" />
                                {t("protun.toolbar.export")}
                            </Button>
                            {!locked && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-7 w-7"
                                    title={t("protun.toolbar.newCanvas")}
                                    onClick={openClearConfirm}
                                >
                                    <FilePlus className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                }
            />
        ),
        [
            mode,
            onModeChange,
            scope,
            scopes,
            scopeLabel,
            locked,
            globalHasRules,
            switchScope,
            paletteOpen,
            togglePalette,
            importGraph,
            exportGraph,
            openClearConfirm,
        ]
    )

    const addFab = useMemo(
        () => (
            <div className="absolute bottom-4 end-4 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            className="h-12 w-12 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className={`${ADD_MENU_CONTENT_CLASS} mb-2`}>
                        <AddNodeMenuItems
                            hasOtherNode={hasOtherNode}
                            onAddRule={addRuleNode}
                            onAddLogic={addLogicNode}
                            onAddComment={addCommentNode}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
        [hasOtherNode, addRuleNode, addLogicNode, addCommentNode]
    )

    return (
        <ProTunPriorityContext.Provider value={priorityState}>
        <div className="flex h-full w-full flex-col overflow-hidden">
            {header}

            <div className="flex min-h-0 flex-1">
                <div ref={wrapperRef} className="relative min-w-0 flex-1">
                    {locked && !loading && (
                        <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                {t("protun.notice.providerLocked")}
                            </span>
                        </div>
                    )}
                    {conflicts.length > 0 && (
                        <div className="flex items-start gap-2.5 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs">
                            <span className="relative mt-px flex h-4 w-4 shrink-0 items-center justify-center">
                                <span className="protun-conflict-ping absolute inset-0 rounded-full bg-destructive/60" />
                                <TriangleAlert className="relative h-4 w-4 text-destructive" strokeWidth={2.5} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-destructive">
                                    {conflicts.length === 1 ? t("protun.conflicts.one") : t("protun.conflicts.many", { count: conflicts.length })}
                                    <span className="font-normal text-destructive/80">
                                        {mode === "pro"
                                            ? t("protun.conflicts.blocksConnect")
                                            : t("protun.conflicts.blocksPro")}
                                    </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {conflicts.slice(0, 4).map((c) => (
                                        <button
                                            key={c.nodes.join(",") + c.targets.join(",")}
                                            type="button"
                                            title={t("protun.conflicts.showOnCanvas")}
                                            className="max-w-full truncate rounded-md border border-destructive/30 bg-background/60 px-2 py-0.5 text-[11px] text-foreground transition-colors hover:border-destructive hover:bg-destructive/15"
                                            onClick={() => focusConflict(c)}
                                        >
                                            {c.message}
                                        </button>
                                    ))}
                                    {conflicts.length > 4 && (
                                        <span className="self-center text-[11px] text-destructive/80">
                                            {t("protun.conflicts.andMore", { count: conflicts.length - 4 })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {!locked && !loading && scope !== "" && (
                        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-1.5 text-[11px] text-muted-foreground">
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                {preset
                                    ? t("protun.notice.providerPreset")
                                    : t("protun.notice.profileRules")}
                            </span>
                        </div>
                    )}
                    {loading ? (
                        <div className="flex h-full w-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <ProTunConflictContext.Provider value={conflictState}>
                            <EdgeUiContext.Provider value={edgeUi}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                edgeTypes={edgeTypes}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onEdgeMouseEnter={onEdgeMouseEnter}
                                onEdgeMouseLeave={onEdgeMouseLeave}
                                onEdgeDoubleClick={locked ? undefined : onEdgeDoubleClick}
                                onNodeDragStart={onNodeDragStart}
                                onNodeDragStop={onNodeDragStop}
                                onSelectionDragStart={onNodeDragStart}
                                onSelectionDragStop={onNodeDragStop}
                                onNodeContextMenu={locked ? undefined : onNodeContextMenu}
                                onSelectionContextMenu={locked ? undefined : onSelectionContextMenu}
                                nodesDraggable={!locked}
                                nodesConnectable={!locked}
                                deleteKeyCode={locked ? null : "Backspace"}
                                onMouseMove={onCanvasMouseMove}
                                nodeTypes={nodeTypes}
                                fitView={nodes.length > 0}
                                fitViewOptions={FIT_VIEW_OPTIONS}
                                connectOnClick={false}
                                proOptions={PRO_OPTIONS}
                                style={CANVAS_STYLE}
                            >
                                <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--border)" />
                            </ReactFlow>
                            </EdgeUiContext.Provider>
                            </ProTunConflictContext.Provider>

                            {/* React Flow гасит mousedown у панели, и до окна не доходит ресайз по рамке (frameless). Эти полоски перекрывают панель только у правого/нижнего края. */}
                            <div className="absolute inset-y-0 end-0 z-20 w-1.5" />
                            <div className="absolute inset-x-0 bottom-0 z-20 h-1.5" />
                            <div className="absolute bottom-0 end-0 z-20 h-3 w-3" />

                            {placement?.mode === "click" && (
                                <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-border bg-popover/90 px-3 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
                                    {t("protun.canvas.placeHint")}
                                </div>
                            )}

                            <MemoPlacementLayer
                                placement={placement}
                                canvasRef={wrapperRef}
                                getZoom={getZoom}
                                onPlace={placePaletteItem}
                                onCancel={cancelPlacement}
                            />

                            <MemoContextMenu
                                menu={contextMenu}
                                onClose={closeContextMenu}
                                onDuplicate={duplicateNodes}
                                onDelete={deleteNodes}
                            />

                            <MemoAddMenu
                                menu={addMenuAt}
                                onClose={closeAddMenu}
                                hasOtherNode={hasOtherNode}
                                onAddRule={addRuleNode}
                                onAddLogic={addLogicNode}
                                onAddComment={addCommentNode}
                            />

                            {isEmpty && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <Empty className="pointer-events-auto max-w-sm border-none">
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <Waypoints className="h-5 w-5" />
                                            </EmptyMedia>
                                            <EmptyTitle>{t("protun.canvas.emptyTitle")}</EmptyTitle>
                                            <EmptyDescription>
                                                {t("protun.canvas.emptyDescription")}
                                            </EmptyDescription>
                                        </EmptyHeader>
                                        <EmptyContent>
                                            <Button variant="outline" size="sm" onClick={importGraph} className="gap-1.5">
                                                <FileUp className="h-3.5 w-3.5" />
                                                {t("protun.canvas.openFile")}
                                            </Button>
                                        </EmptyContent>
                                    </Empty>
                                </div>
                            )}

                            {isEmpty && !paletteOpen && (
                                <div className="pointer-events-none absolute bottom-10 end-16 z-10 text-primary">
                                    <svg width="66" height="56" viewBox="0 0 66 56" fill="none" className="rtl:-scale-x-100">
                                        <defs>
                                            <marker
                                                id="protun-empty-arrowhead"
                                                viewBox="0 0 10 10"
                                                refX="6"
                                                refY="5"
                                                markerWidth="6"
                                                markerHeight="6"
                                                orient="auto"
                                            >
                                                <path d="M0,0 L10,5 L0,10 Z" fill="currentColor" />
                                            </marker>
                                        </defs>
                                        <path
                                            d="M8 6 C 2 28, 16 44, 44 48"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            fill="none"
                                            markerEnd="url(#protun-empty-arrowhead)"
                                        />
                                    </svg>
                                    <span className="absolute -top-7 start-0 -rotate-6 text-base font-semibold whitespace-nowrap">
                                        {t("protun.canvas.addHere")}
                                    </span>
                                </div>
                            )}

                            {/* С открытой панелью блоков плюсик дублирует её — прячем. */}
                            {!paletteOpen && addFab}
                        </>
                    )}
                </div>

                {!locked && !loading && (
                    <MemoPalette
                        open={paletteOpen}
                        hasOtherNode={hasOtherNode}
                        active={placement?.mode === "click" ? placement.item : null}
                        onPick={setPlacement}
                        onCancel={cancelPlacement}
                        onQuickAdd={quickAddPaletteItem}
                        onClose={togglePalette}
                    />
                )}
            </div>

            <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
                <DialogContent className="max-w-sm p-4">
                    <DialogHeader>
                        <DialogTitle className="text-base">{t("protun.newCanvasDialog.title")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {t("protun.newCanvasDialog.description", { scope: scopeLabel })}
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setClearConfirmOpen(false)}>
                            {t("common.action.cancel")}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleClear}>
                            {t("protun.newCanvasDialog.confirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </ProTunPriorityContext.Provider>
    )
}
