import { useCallback, useEffect, useRef, useState } from "react"
import { useNodesState, useEdgesState, useReactFlow, type Node, type Edge } from "@xyflow/react"
import { toast } from "sonner"

import { GetProTunLayer, GetProTunScopes, SaveProTunLayer } from "@wailsjs/go/handlers/SettingsHandler"
import { types } from "@wailsjs/go/models"

import { PROTUN_ADD_ITEM_EVENT, PROTUN_PATCH_NODE_EVENT, PROTUN_REMOVE_ITEM_EVENT } from "@/components/protun/nodes/RuleNode"
import { PROTUN_COMMENT_TEXT_EVENT } from "@/components/protun/nodes/CommentNode"
import { PROTUN_SET_SERVER_EVENT } from "@/components/protun/ServerPicker"
import { flowToGraph, graphToFlow, type RuleNodeData, type CommentNodeData } from "@/lib/protun/codec"
import { normalizeBackendGraph } from "@/lib/protun/backend"
import { pickAndReadProTunFile, saveProTunFile } from "@/lib/protun/fileio"
import { createProTunFile } from "@/lib/protun/serialize"
import { ProTunParseError } from "@/lib/protun/schema"
import type { ProTunServerRef } from "@/lib/protun/types"
import { t } from "@/i18n"

const AUTOSAVE_DEBOUNCE_MS = 600
const SCOPE_STORAGE_KEY = "beam.protun.scope"

// "" — общие правила, иначе ID профиля.
export type ProTunScope = string
export const GLOBAL_SCOPE: ProTunScope = ""
export const globalScopeLabel = () => t("protun.scope.global")

export interface ProTunScopeInfo {
    id: string
    name: string
    hasRules: boolean
    hasPreset: boolean
    locked: boolean
    active: boolean
}

function readScope(): ProTunScope {
    try {
        return localStorage.getItem(SCOPE_STORAGE_KEY) ?? GLOBAL_SCOPE
    } catch {
        return GLOBAL_SCOPE
    }
}

function writeScope(scope: ProTunScope) {
    try {
        localStorage.setItem(SCOPE_STORAGE_KEY, scope)
    } catch {
        // Storage unavailable: the scope just is not remembered.
    }
}

// Snapshot of what is stored, without the viewport: panning is not an edit.
function snapshotOf(nodes: Node[], edges: Edge[]): string {
    return JSON.stringify(flowToGraph(nodes, edges))
}

export function useProTunGraph() {
    const reactFlow = useReactFlow()
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [loading, setLoading] = useState(true)
    const [locked, setLocked] = useState(false)
    const [preset, setPreset] = useState(false)
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    const [scope, setScope] = useState<ProTunScope>(readScope)
    const [scopes, setScopes] = useState<ProTunScopeInfo[]>([])
    const [globalHasRules, setGlobalHasRules] = useState(false)

    // What the backend holds for the open scope; autosave skips equal graphs
    // so merely opening a provider preset does not turn it into own rules.
    const savedSnapshot = useRef<string>("")
    const latest = useRef({ nodes, edges, scope, locked, loading })
    latest.current = { nodes, edges, scope, locked, loading }

    const refreshScopes = useCallback(async () => {
        try {
            const r = await GetProTunScopes()
            if (!r.success || !r.data) return
            setGlobalHasRules(r.data.global)
            setScopes(
                (r.data.profiles ?? []).map((p) => ({
                    id: p.id,
                    name: p.name,
                    hasRules: p.hasRules,
                    hasPreset: p.hasPreset,
                    locked: p.locked,
                    active: p.active,
                }))
            )
            return r.data
        } catch {
            return undefined
        }
    }, [])

    const saveNow = useCallback(() => {
        const { nodes: n, edges: e, scope: s, locked: l, loading: busy } = latest.current
        if (busy || l) return
        const snapshot = snapshotOf(n, e)
        if (snapshot === savedSnapshot.current) return
        savedSnapshot.current = snapshot
        const graph = flowToGraph(n, e, reactFlow.getViewport())
        SaveProTunLayer(s, new types.ProTunGraph(graph))
            .then((r) => {
                if (!r.success) {
                    toast.error(t("protun.toast.saveFailed"), { description: r.error })
                    return
                }
                const hasRules = n.length > 0
                if (s === GLOBAL_SCOPE) setGlobalHasRules(hasRules)
                else setScopes((list) => list.map((p) => (p.id === s ? { ...p, hasRules } : p)))
            })
            .catch(() => {})
    }, [reactFlow])

    // Load the open scope (and the list of scopes).
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        ;(async () => {
            const data = await refreshScopes()
            if (cancelled) return
            // A remembered profile that was deleted falls back to the global layer.
            if (scope !== GLOBAL_SCOPE && data && !(data.profiles ?? []).some((p) => p.id === scope)) {
                setScope(GLOBAL_SCOPE)
                writeScope(GLOBAL_SCOPE)
                return
            }
            try {
                const r = await GetProTunLayer(scope)
                if (cancelled) return
                const graph = r.success && r.data ? normalizeBackendGraph(r.data.graph) : { nodes: [], edges: [] }
                setLocked(!!(r.success && r.data?.locked))
                setPreset(!!(r.success && r.data?.preset))
                const { nodes: n, edges: e, viewport } = graphToFlow(graph)
                setNodes(n)
                setEdges(e)
                // A preset shown in place of an empty layer is not saved until edited.
                savedSnapshot.current = snapshotOf(n, e)
                if (viewport) {
                    reactFlow.setViewport(viewport)
                } else if (n.length > 0) {
                    requestAnimationFrame(() => reactFlow.fitView({ padding: 0.2 }))
                } else {
                    reactFlow.setViewport({ x: 0, y: 0, zoom: 1 })
                }
            } catch {
                if (!cancelled) toast.error(t("protun.toast.loadFailed"))
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [scope])

    useEffect(() => {
        if (loading || locked) return
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
        autosaveTimer.current = setTimeout(saveNow, AUTOSAVE_DEBOUNCE_MS)
        return () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
        }
    }, [nodes, edges, loading, locked, saveNow])

    // Leaving the page or the scope must not lose the last edit.
    useEffect(() => () => saveNow(), [saveNow])

    const switchScope = useCallback(
        (next: ProTunScope) => {
            if (next === latest.current.scope) return
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
            saveNow()
            writeScope(next)
            setScope(next)
        },
        [saveNow]
    )

    useEffect(() => {
        const onAddItem = (e: Event) => {
            if (locked) return
            const { nodeId, values } = (e as CustomEvent<{ nodeId: string; values: string[] }>).detail
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id !== nodeId) return n
                    const data = n.data as RuleNodeData
                    const fresh = values.filter((v, i) => values.indexOf(v) === i && !data.items.includes(v))
                    if (fresh.length === 0) return n
                    return { ...n, data: { ...data, items: [...data.items, ...fresh] } }
                })
            )
        }
        const onRemoveItem = (e: Event) => {
            if (locked) return
            const { nodeId, index } = (e as CustomEvent).detail
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id !== nodeId) return n
                    const data = n.data as RuleNodeData
                    return { ...n, data: { ...data, items: data.items.filter((_, i) => i !== index) } }
                })
            )
        }
        const onCommentText = (e: Event) => {
            if (locked) return
            const { nodeId, text } = (e as CustomEvent).detail
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data as CommentNodeData), text } } : n))
            )
        }
        const onSetServer = (e: Event) => {
            if (locked) return
            const { nodeId, server } = (e as CustomEvent<{ nodeId: string; server: ProTunServerRef }>).detail
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data as RuleNodeData), server } } : n))
            )
        }
        // Точечная правка данных карточки («все, кроме», список «кроме»).
        const onPatchNode = (e: Event) => {
            if (locked) return
            const { nodeId, patch } = (e as CustomEvent<{ nodeId: string; patch: Partial<RuleNodeData> }>).detail
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data as RuleNodeData), ...patch } } : n))
            )
        }
        window.addEventListener(PROTUN_PATCH_NODE_EVENT, onPatchNode)
        window.addEventListener(PROTUN_ADD_ITEM_EVENT, onAddItem)
        window.addEventListener(PROTUN_REMOVE_ITEM_EVENT, onRemoveItem)
        window.addEventListener(PROTUN_COMMENT_TEXT_EVENT, onCommentText)
        window.addEventListener(PROTUN_SET_SERVER_EVENT, onSetServer)
        return () => {
            window.removeEventListener(PROTUN_PATCH_NODE_EVENT, onPatchNode)
            window.removeEventListener(PROTUN_ADD_ITEM_EVENT, onAddItem)
            window.removeEventListener(PROTUN_REMOVE_ITEM_EVENT, onRemoveItem)
            window.removeEventListener(PROTUN_COMMENT_TEXT_EVENT, onCommentText)
            window.removeEventListener(PROTUN_SET_SERVER_EVENT, onSetServer)
        }
    }, [setNodes, locked])

    const scopeLabel =
        scope === GLOBAL_SCOPE ? globalScopeLabel() : (scopes.find((p) => p.id === scope)?.name ?? t("protun.scope.profileFallback"))

    const exportGraph = useCallback(async () => {
        // Из стора, а не из state: колбэк не пересоздаётся на каждый кадр перетаскивания.
        const graph = flowToGraph(reactFlow.getNodes(), reactFlow.getEdges(), reactFlow.getViewport())
        try {
            const path = await saveProTunFile(createProTunFile(graph, { name: scopeLabel }))
            if (path) toast.success(t("protun.toast.exported"), { description: path })
        } catch (err) {
            toast.error(t("protun.toast.exportFailed"), {
                description: err instanceof Error ? err.message : String(err),
            })
        }
    }, [reactFlow, scopeLabel])

    const importGraph = useCallback(async () => {
        if (locked) return
        try {
            const result = await pickAndReadProTunFile()
            if (!result) return
            const { file, warnings } = result

            const { nodes: n, edges: e, viewport } = graphToFlow(file.graph)
            setNodes(n)
            setEdges(e)
            if (viewport) reactFlow.setViewport(viewport)

            if (warnings.length > 0) {
                toast.warning(t("protun.toast.importWarnings", { count: warnings.length }), {
                    description: warnings.slice(0, 3).join("; "),
                })
            }
        } catch (err) {
            const message = err instanceof ProTunParseError ? err.message : t("protun.file.readFailed")
            toast.error(t("protun.toast.importFailed"), { description: message })
        }
    }, [reactFlow, setNodes, setEdges, locked])

    const clearGraph = useCallback(() => {
        if (locked) return
        setNodes([])
        setEdges([])
    }, [setNodes, setEdges, locked])

    return {
        loading,
        locked,
        preset,
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
        exportGraph,
        importGraph,
        clearGraph,
    }
}
