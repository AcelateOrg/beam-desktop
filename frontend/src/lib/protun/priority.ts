import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { Edge, Node } from "@xyflow/react"

import { GetProTunRuleOrder } from "@wailsjs/go/handlers/SettingsHandler"
import { types } from "@wailsjs/go/models"

import { flowToGraph } from "./codec"

// Приоритет правила задаёт положение его карточки на холсте: где два правила
// пересекаются и ведут в разные места, побеждает то, что выше. Порядок считает
// бэкенд (beam-bridge, ProTunRuleOrder) тем же кодом, что собирает конфиг:
// редактор показывает не догадку, а настоящий порядок.

export type ProTunRuleInfo = types.ProTunRuleInfo

export interface ProTunPriorityState {
    /** Rules in the order the core checks them. */
    rows: ProTunRuleInfo[]
    byNode: Map<string, ProTunRuleInfo>
}

export const NO_PRIORITY: ProTunPriorityState = { rows: [], byNode: new Map() }

export const ProTunPriorityContext = createContext<ProTunPriorityState>(NO_PRIORITY)

/** The rule of a card (set only for cards that feed a destination). */
export function useNodeRule(nodeId: string): ProTunRuleInfo | undefined {
    return useContext(ProTunPriorityContext).byNode.get(nodeId)
}

export function useRuleRows(): ProTunRuleInfo[] {
    return useContext(ProTunPriorityContext).rows
}

const CHECK_DEBOUNCE_MS = 250

/**
 * Asks the backend for the check order whenever the meaning of the graph
 * changes: card data, links or how high a card sits. Resizing does not count.
 */
export function useProTunRuleOrder(nodes: Node[], edges: Edge[]): ProTunPriorityState {
    const [rows, setRows] = useState<ProTunRuleInfo[]>([])
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
        last.current = {
            ids: nodes.map((n) => n.id),
            datas: nodes.map((n) => n.data),
            ys: nodes.map((n) => n.position.y),
            links,
        }

        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
            const { nodes: n, edges: e } = latest.current
            const request = ++seq.current
            GetProTunRuleOrder(new types.ProTunGraph(flowToGraph(n, e)))
                .then((r) => {
                    if (request !== seq.current) return
                    setRows(r.success && r.data ? r.data : [])
                })
                .catch(() => {})
        }, CHECK_DEBOUNCE_MS)
    })
    useEffect(() => () => window.clearTimeout(timer.current), [])

    return useMemo(() => ({ rows, byNode: new Map(rows.map((row) => [row.nodeId, row])) }), [rows])
}
