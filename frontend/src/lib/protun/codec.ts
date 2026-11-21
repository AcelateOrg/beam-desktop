import type { Edge, Node, Viewport } from "@xyflow/react"
import { edgeStrokeColor, isResizableKind, NODE_META, type ProTunRuleKind } from "./meta"
import {
    isDestinationKind,
    isSourceKind,
    supportsExcept,
    supportsInvert,
    type ProTunDestinationKind,
    type ProTunEdge,
    type ProTunGraph,
    type ProTunLogicOp,
    type ProTunNode,
    type ProTunServerRef,
} from "./types"

export interface RuleNodeData extends Record<string, unknown> {
    kind: ProTunRuleKind
    label: string
    items: string[]
    server?: ProTunServerRef
    invert?: boolean
    except?: string[]
}

export interface CommentNodeData extends Record<string, unknown> {
    text: string
}

export interface LogicNodeData extends Record<string, unknown> {
    op: ProTunLogicOp
}

export const RULE_NODE_TYPE = "rule"
export const COMMENT_NODE_TYPE = "comment"
export const LOGIC_NODE_TYPE = "logic"

export const RULE_NODE_DEFAULT_WIDTH = 220
export const RULE_NODE_DEFAULT_HEIGHT = 200

const NEUTRAL_EDGE_STYLE = { stroke: "var(--muted-foreground)", strokeWidth: 2.5 }

export function newNodeId(): string {
    return crypto.randomUUID()
}

export function newEdgeId(source: string, target: string): string {
    return `e-${source}-${target}-${crypto.randomUUID().slice(0, 8)}`
}

export function edgeStyleForDestination(kind: ProTunDestinationKind) {
    return { stroke: edgeStrokeColor(kind), strokeWidth: 2.5 }
}

export function edgeStyleForTarget(targetKind: string | undefined) {
    if (targetKind && isDestinationKind(targetKind)) {
        return edgeStyleForDestination(targetKind)
    }
    return NEUTRAL_EDGE_STYLE
}

export function graphToFlow(graph: ProTunGraph): { nodes: Node[]; edges: Edge[]; viewport?: Viewport } {
    // Удалённые виды карточек (например, «Источник») из старых графов пропускаются
    // вместе со своими рёбрами — при следующем сохранении они исчезнут.
    const known = (graph.nodes ?? []).filter(
        (n) => n.kind === "comment" || n.kind === "logic" || (n.kind as string) in NODE_META,
    )
    const kindByNodeId = new Map(known.map((n) => [n.id, n.kind]))

    const nodes: Node[] = known.map((n) => {
        if (n.kind === "comment") {
            const data: CommentNodeData = { text: n.text }
            return {
                id: n.id,
                type: COMMENT_NODE_TYPE,
                position: n.position,
                data,
                ...(n.size ? { width: n.size.width, height: n.size.height } : {}),
            }
        }

        if (n.kind === "logic") {
            const data: LogicNodeData = { op: n.op === "and" ? "and" : "or" }
            return { id: n.id, type: LOGIC_NODE_TYPE, position: n.position, data }
        }

        const data: RuleNodeData = {
            kind: n.kind,
            label: n.label?.trim() || NODE_META[n.kind].label,
            items: n.items ?? [],
            ...(n.kind === "server" && n.server ? { server: n.server } : {}),
            ...(supportsInvert(n.kind) && n.invert ? { invert: true } : {}),
            ...(supportsExcept(n.kind) && n.except?.length ? { except: n.except } : {}),
        }
        const size = n.size
            ? { width: n.size.width, height: n.size.height }
            : isResizableKind(n.kind)
              ? { width: RULE_NODE_DEFAULT_WIDTH, height: RULE_NODE_DEFAULT_HEIGHT }
              : undefined
        return {
            id: n.id,
            type: RULE_NODE_TYPE,
            position: n.position,
            data,
            ...(size ? { width: size.width, height: size.height } : {}),
        }
    })

    const edges: Edge[] = (graph.edges ?? [])
        .filter((e) => kindByNodeId.has(e.source) && kindByNodeId.has(e.target))
        .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: edgeStyleForTarget(kindByNodeId.get(e.target)),
    }))

    return { nodes, edges, viewport: graph.viewport }
}

export function flowToGraph(nodes: Node[], edges: Edge[], viewport?: Viewport): ProTunGraph {
    const protunNodes: ProTunNode[] = nodes.map((n) => {
        if (n.type === COMMENT_NODE_TYPE) {
            const data = n.data as CommentNodeData
            return {
                id: n.id,
                kind: "comment",
                position: n.position,
                text: data.text ?? "",
                size: n.width && n.height ? { width: n.width, height: n.height } : undefined,
            }
        }

        if (n.type === LOGIC_NODE_TYPE) {
            const data = n.data as LogicNodeData
            return { id: n.id, kind: "logic", position: n.position, op: data.op === "and" ? "and" : "or" }
        }

        const data = n.data as RuleNodeData
        return {
            id: n.id,
            kind: data.kind,
            position: n.position,
            label: data.label,
            items: isSourceKind(data.kind) ? data.items ?? [] : undefined,
            server: data.kind === "server" ? data.server : undefined,
            invert: supportsInvert(data.kind) && data.invert ? true : undefined,
            except: supportsExcept(data.kind) && data.except?.length ? data.except : undefined,
            size: isResizableKind(data.kind) && n.width && n.height ? { width: n.width, height: n.height } : undefined,
        }
    })

    const protunEdges: ProTunEdge[] = edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))

    return { nodes: protunNodes, edges: protunEdges, viewport }
}
