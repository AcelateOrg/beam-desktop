import type { ProTunEdge, ProTunGraph, ProTunNode, ProTunViewport } from "./types"

export function normalizeBackendGraph(data: unknown): ProTunGraph {
    if (!data || typeof data !== "object") {
        return { nodes: [], edges: [] }
    }
    const obj = data as Record<string, unknown>
    const nodes = Array.isArray(obj.nodes) ? (obj.nodes as ProTunNode[]) : []
    const edges = Array.isArray(obj.edges) ? (obj.edges as ProTunEdge[]) : []
    const viewport = obj.viewport && typeof obj.viewport === "object" ? (obj.viewport as ProTunViewport) : undefined
    return { nodes, edges, viewport }
}
