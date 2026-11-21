import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { Edge, Node } from "@xyflow/react"

import { CheckProTunConflicts } from "@wailsjs/go/handlers/SettingsHandler"
import { types } from "@wailsjs/go/models"

import { flowToGraph } from "./codec"

// Конфликты считает бэкенд (beam-bridge, DetectProTunConflicts) — тем же кодом,
// что собирает конфиг и не даёт подключиться. Редактор только подсвечивает.

export type ProTunConflict = types.ProTunConflict

export interface ProTunConflictState {
    conflicts: ProTunConflict[]
    /** Source cards whose values collide. */
    bySource: Map<string, ProTunConflict[]>
    /** Logic blocks and destinations on the way of a conflict. */
    onPath: Set<string>
    /** Edges from the colliding cards to their destinations. */
    edges: Set<string>
}

const EMPTY: ProTunConflictState = { conflicts: [], bySource: new Map(), onPath: new Set(), edges: new Set() }
export const NO_CONFLICTS = EMPTY

export const ProTunConflictContext = createContext<ProTunConflictState>(EMPTY)

export function useNodeConflicts(nodeId: string) {
    const state = useContext(ProTunConflictContext)
    return {
        conflicts: state.bySource.get(nodeId),
        onPath: state.onPath.has(nodeId),
    }
}

export function useEdgeInConflict(edgeId: string): boolean {
    return useContext(ProTunConflictContext).edges.has(edgeId)
}

const CHECK_DEBOUNCE_MS = 250

function buildState(conflicts: ProTunConflict[], edges: Edge[]): ProTunConflictState {
    if (conflicts.length === 0) return EMPTY
    const outgoing = new Map<string, Edge[]>()
    for (const e of edges) {
        if (!outgoing.has(e.source)) outgoing.set(e.source, [])
        outgoing.get(e.source)!.push(e)
    }
    const bySource = new Map<string, ProTunConflict[]>()
    const onPath = new Set<string>()
    const conflictEdges = new Set<string>()
    for (const conflict of conflicts) {
        const targets = new Set(conflict.targets)
        for (const id of conflict.nodes) {
            bySource.set(id, [...(bySource.get(id) ?? []), conflict])
            // A card has one output: follow it to the destination.
            const seen = new Set<string>([id])
            let current = id
            for (;;) {
                const next = (outgoing.get(current) ?? []).find((e) => !seen.has(e.target))
                if (!next) break
                conflictEdges.add(next.id)
                seen.add(next.target)
                if (targets.has(next.target)) {
                    onPath.add(next.target)
                    break
                }
                onPath.add(next.target)
                current = next.target
            }
        }
    }
    return { conflicts, bySource, onPath, edges: conflictEdges }
}

/**
 * Checks the open graph for conflicts whenever its meaning changes. Resizing
 * cards does not count: card data, links and how high a card sits are compared
 * (of two overlapping rules the upper card wins, so height resolves conflicts).
 */
export function useProTunConflicts(nodes: Node[], edges: Edge[]): ProTunConflictState {
    const [conflicts, setConflicts] = useState<ProTunConflict[]>([])
    const latest = useRef({ nodes, edges })
    latest.current = { nodes, edges }
    const last = useRef<{ ids: string[]; datas: unknown[]; ys: number[]; links: string } | null>(null)
    const timer = useRef<number | undefined>(undefined)
    const seq = useRef(0)

    useEffect(() => {
        const links = edges.map((e) => `${e.source}>${e.target}`).join("|")
        const prev = last.current
        const same =
            prev !== null &&
            prev.links === links &&
            prev.ids.length === nodes.length &&
            nodes.every((n, i) => prev.ids[i] === n.id && prev.datas[i] === n.data && prev.ys[i] === n.position.y)
        if (same) return
        last.current = { ids: nodes.map((n) => n.id), datas: nodes.map((n) => n.data), ys: nodes.map((n) => n.position.y), links }

        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
            const { nodes: n, edges: e } = latest.current
            const request = ++seq.current
            CheckProTunConflicts(new types.ProTunGraph(flowToGraph(n, e)))
                .then((r) => {
                    if (request !== seq.current) return
                    setConflicts(r.success && r.data ? r.data : [])
                })
                .catch(() => {})
        }, CHECK_DEBOUNCE_MS)
    })
    useEffect(() => () => window.clearTimeout(timer.current), [])

    return useMemo(() => buildState(conflicts, edges), [conflicts, edges])
}

/** How a card value is compared with the values of a conflict. */
export function conflictKey(value: string): string {
    let v = value.trim().toLowerCase()
    v = v.replace(/^(full|domain|keyword|regexp|geoip|geosite):/, "")
    v = v.replace(/^\*?\./, "")
    const slash = Math.max(v.lastIndexOf("/"), v.lastIndexOf("\\"))
    // App paths compare by file name; CIDR keeps its slash.
    if (slash >= 0 && !/^[0-9a-f.:]+\/\d+$/.test(v)) v = v.slice(slash + 1)
    return v
}

export function conflictValueSet(conflicts: ProTunConflict[] | undefined): Set<string> | null {
    if (!conflicts || conflicts.length === 0) return null
    return new Set(conflicts.flatMap((c) => c.values.map(conflictKey)))
}
