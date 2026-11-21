export const PROTUN_FORMAT_VERSION = 1 as const

export type ProTunSourceKind = "apps" | "domains" | "ip_ranges" | "geoip" | "geosite" | "ports" | "protocols" | "network"
export type ProTunDestinationKind = "vpn" | "server" | "direct" | "block"
export type ProTunOtherKind = "other"
export type ProTunNodeKind = ProTunSourceKind | ProTunDestinationKind | ProTunOtherKind | "comment" | "logic"

export type ProTunLogicOp = "and" | "or"

export const PROTUN_SOURCE_KINDS: readonly ProTunSourceKind[] = ["apps", "domains", "ip_ranges", "geoip", "geosite", "ports", "protocols", "network"]
export const PROTUN_DESTINATION_KINDS: readonly ProTunDestinationKind[] = ["vpn", "server", "direct", "block"]

export function isSourceKind(kind: string): kind is ProTunSourceKind {
    return (PROTUN_SOURCE_KINDS as readonly string[]).includes(kind)
}

export function isDestinationKind(kind: string): kind is ProTunDestinationKind {
    return (PROTUN_DESTINATION_KINDS as readonly string[]).includes(kind)
}

export function isOtherKind(kind: string): kind is ProTunOtherKind {
    return kind === "other"
}

export interface ProTunPosition {
    x: number
    y: number
}

export interface ProTunSize {
    width: number
    height: number
}

interface ProTunNodeBase {
    id: string
    position: ProTunPosition
}

export interface ProTunRuleNode extends ProTunNodeBase {
    kind: ProTunSourceKind | ProTunDestinationKind | ProTunOtherKind
    label?: string
    items?: string[]
    size?: ProTunSize
    // Только у «Сервер»: куда именно вести трафик.
    server?: ProTunServerRef
    // Режим «Все, кроме»: карточка ловит всё, КРОМЕ items (приложения, домены, IP, гео).
    invert?: boolean
    // Домены / IP / гео, старый формат: исключения («кроме») рядом со списком, идут туда же,
    // куда «Остальное». Новые карточки вместо этого включают invert.
    except?: string[]
}

export const EXCEPT_KINDS: readonly ProTunSourceKind[] = ["domains", "ip_ranges", "geoip", "geosite"]

export function supportsExcept(kind: string): boolean {
    return (EXCEPT_KINDS as readonly string[]).includes(kind)
}

// Cards with the «Только эти / Все, кроме» mode.
export function supportsInvert(kind: string): boolean {
    return kind === "apps" || supportsExcept(kind)
}

// Ссылка на конкретный сервер любого профиля. Ищется по id, потом по имени.
export interface ProTunServerRef {
    profileId: string
    nodeId: string
    name?: string
    profileName?: string
    // Сервер, через который идёт трафик к этому (цепочка).
    via?: ProTunServerRef
}

export interface ProTunCommentNode extends ProTunNodeBase {
    kind: "comment"
    text: string
    size?: ProTunSize
}

export interface ProTunLogicNode extends ProTunNodeBase {
    kind: "logic"
    op: ProTunLogicOp
}

export type ProTunNode = ProTunRuleNode | ProTunCommentNode | ProTunLogicNode

export interface ProTunEdge {
    id: string
    source: string
    target: string
}

export interface ProTunViewport {
    x: number
    y: number
    zoom: number
}

export interface ProTunGraph {
    nodes: ProTunNode[]
    edges: ProTunEdge[]
    viewport?: ProTunViewport
}

export interface ProTunMeta {
    name: string
    createdAt: string
    updatedAt: string
}

export interface ProTunFile {
    format: "protun"
    version: typeof PROTUN_FORMAT_VERSION
    meta: ProTunMeta
    graph: ProTunGraph
}

export function createEmptyGraph(): ProTunGraph {
    return { nodes: [], edges: [] }
}

export type RoutingMode = "easy" | "pro"
