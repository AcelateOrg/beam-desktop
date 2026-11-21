import {
    PROTUN_FORMAT_VERSION,
    PROTUN_SOURCE_KINDS,
    isDestinationKind,
    isSourceKind,
    supportsExcept,
    supportsInvert,
    type ProTunEdge,
    type ProTunFile,
    type ProTunGraph,
    type ProTunMeta,
    type ProTunNode,
    type ProTunNodeKind,
    type ProTunPosition,
    type ProTunServerRef,
    type ProTunSize,
    type ProTunViewport,
} from "./types"
import { t } from "@/i18n"

export class ProTunParseError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ProTunParseError"
    }
}

export interface ProTunParseResult {
    file: ProTunFile
    warnings: string[]
}

const ALL_KINDS: readonly ProTunNodeKind[] = [...PROTUN_SOURCE_KINDS, "vpn", "server", "direct", "block", "other", "comment", "logic"]

function isRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object" && !Array.isArray(v)
}

function isFiniteNumber(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v)
}

function isPosition(v: unknown): v is ProTunPosition {
    return isRecord(v) && isFiniteNumber(v.x) && isFiniteNumber(v.y)
}

function isSize(v: unknown): v is ProTunSize {
    return isRecord(v) && isFiniteNumber(v.width) && isFiniteNumber(v.height) && v.width > 0 && v.height > 0
}

function isViewport(v: unknown): v is ProTunViewport {
    return isRecord(v) && isFiniteNumber(v.x) && isFiniteNumber(v.y) && isFiniteNumber(v.zoom)
}

function parseServerRef(v: unknown, withVia = true): ProTunServerRef | undefined {
    if (!isRecord(v) || typeof v.profileId !== "string" || typeof v.nodeId !== "string") return undefined
    return {
        profileId: v.profileId,
        nodeId: v.nodeId,
        name: typeof v.name === "string" ? v.name : undefined,
        profileName: typeof v.profileName === "string" ? v.profileName : undefined,
        // Одна пересадка: цепочку из цепочек схема не допускает.
        via: withVia ? parseServerRef(v.via, false) : undefined,
    }
}

function normalizeItems(v: unknown): string[] {
    if (!Array.isArray(v)) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of v) {
        if (typeof raw !== "string") continue
        const trimmed = raw.trim()
        if (!trimmed || seen.has(trimmed)) continue
        seen.add(trimmed)
        out.push(trimmed)
    }
    return out
}

function parseNode(raw: unknown, index: number): ProTunNode {
    if (!isRecord(raw)) {
        throw new ProTunParseError(t("protun.parse.nodeNotObject", { index }))
    }
    if (typeof raw.id !== "string" || !raw.id.trim()) {
        throw new ProTunParseError(t("protun.parse.nodeNoId", { index }))
    }
    if (!isPosition(raw.position)) {
        throw new ProTunParseError(t("protun.parse.nodeBadPosition", { id: String(raw.id) }))
    }
    if (typeof raw.kind !== "string" || !ALL_KINDS.includes(raw.kind as ProTunNodeKind)) {
        throw new ProTunParseError(t("protun.parse.nodeUnknownKind", { id: String(raw.id), kind: String(raw.kind) }))
    }

    const kind = raw.kind as ProTunNodeKind

    if (kind === "comment") {
        return {
            id: raw.id,
            kind: "comment",
            position: raw.position,
            text: typeof raw.text === "string" ? raw.text : "",
            size: isSize(raw.size) ? raw.size : undefined,
        }
    }

    if (kind === "logic") {
        return {
            id: raw.id,
            kind: "logic",
            position: raw.position,
            op: raw.op === "and" ? "and" : "or",
        }
    }

    return {
        id: raw.id,
        kind,
        position: raw.position,
        label: typeof raw.label === "string" ? raw.label : undefined,
        items: isSourceKind(kind) ? normalizeItems(raw.items) : undefined,
        size: isSize(raw.size) ? raw.size : undefined,
        server: kind === "server" ? parseServerRef(raw.server) : undefined,
        invert: supportsInvert(kind) && raw.invert === true ? true : undefined,
        except: supportsExcept(kind) ? normalizeItems(raw.except) : undefined,
    }
}

function parseEdges(
    raw: unknown,
    nodes: ProTunNode[],
    warnings: string[]
): ProTunEdge[] {
    if (raw === undefined) return []
    if (!Array.isArray(raw)) {
        warnings.push(t("protun.parse.edgesBroken"))
        return []
    }

    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    const usedIds = new Set<string>()
    const edges: ProTunEdge[] = []
    const sourcesWithOutgoingEdge = new Set<string>()

    raw.forEach((item, index) => {
        if (!isRecord(item) || typeof item.source !== "string" || typeof item.target !== "string") {
            warnings.push(t("protun.parse.edgeBroken", { index }))
            return
        }

        const source = nodeById.get(item.source)
        const target = nodeById.get(item.target)
        if (!source || !target) {
            warnings.push(t("protun.parse.edgeMissingNode", { index }))
            return
        }
        if (source.kind === "comment" || target.kind === "comment") {
            warnings.push(t("protun.parse.edgeComment", { index }))
            return
        }
        const sourceOk = isSourceKind(source.kind) || source.kind === "logic" || source.kind === "other"
        const targetOk = target.kind === "logic" || isDestinationKind(target.kind)
        if (!sourceOk || !targetOk) {
            warnings.push(t("protun.parse.edgeDirection", { index }))
            return
        }
        if (source.kind === "other" && target.kind === "logic") {
            warnings.push(t("protun.parse.edgeOtherToLogic", { index }))
            return
        }
        if (sourcesWithOutgoingEdge.has(source.id)) {
            warnings.push(t("protun.parse.edgeDuplicateSource", { index }))
            return
        }

        let id = typeof item.id === "string" ? item.id.trim() : ""
        if (!id || usedIds.has(id)) id = `e-${source.id}-${target.id}-${index}`
        usedIds.add(id)

        edges.push({ id, source: source.id, target: target.id })
        sourcesWithOutgoingEdge.add(source.id)
    })

    return edges
}

function parseMeta(raw: unknown): ProTunMeta {
    const obj = isRecord(raw) ? raw : {}
    const now = new Date().toISOString()
    return {
        name: typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : t("protun.file.untitled"),
        createdAt: typeof obj.createdAt === "string" ? obj.createdAt : now,
        updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : now,
    }
}

export function parseProTunFile(raw: string): ProTunParseResult {
    let data: unknown
    try {
        data = JSON.parse(raw)
    } catch {
        throw new ProTunParseError(t("protun.parse.notJson"))
    }

    if (!isRecord(data)) {
        throw new ProTunParseError(t("protun.parse.notObject"))
    }
    if (data.format !== "protun") {
        throw new ProTunParseError(t("protun.parse.notProtun"))
    }
    if (data.version !== PROTUN_FORMAT_VERSION) {
        throw new ProTunParseError(
            t("protun.parse.unsupportedVersion", { version: String(data.version) })
        )
    }
    if (!isRecord(data.graph) || !Array.isArray(data.graph.nodes)) {
        throw new ProTunParseError(t("protun.parse.noGraph"))
    }

    const seenIds = new Set<string>()
    const nodes = data.graph.nodes.map((rawNode: unknown, index: number) => {
        const node = parseNode(rawNode, index)
        if (seenIds.has(node.id)) {
            throw new ProTunParseError(t("protun.parse.duplicateId", { id: node.id }))
        }
        seenIds.add(node.id)
        return node
    })

    const warnings: string[] = []
    if (nodes.filter((n) => n.kind === "other").length > 1) {
        warnings.push(t("protun.parse.multipleOther"))
    }
    const edges = parseEdges(data.graph.edges, nodes, warnings)
    const viewport = isViewport(data.graph.viewport) ? data.graph.viewport : undefined

    const graph: ProTunGraph = { nodes, edges, viewport }
    const meta = parseMeta(data.meta)

    return {
        file: { format: "protun", version: PROTUN_FORMAT_VERSION, meta, graph },
        warnings,
    }
}
