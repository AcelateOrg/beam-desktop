import type { LucideIcon } from "lucide-react"
import { Ban, ArrowRightLeft, Ellipsis, Globe, Monitor, Server, Shield, Waypoints, Flag, Layers, Hash, Network, MapPin } from "lucide-react"
import type { ProTunDestinationKind, ProTunOtherKind, ProTunSourceKind } from "./types"
import { t } from "@/i18n"

export type ProTunRuleKind = ProTunSourceKind | ProTunDestinationKind | ProTunOtherKind

export interface ProTunKindMeta {
    label: string
    description: string
    icon: LucideIcon
    role: "source" | "destination" | "fallback"
    accentBar: string
    accentText: string
    accentChipBg: string
    placeholder: string
    itemLabel: string
    itemHint: string
    statusText?: string
}

// Тексты — геттеры: значение берётся из словаря при каждом обращении, а не
// один раз при загрузке модуля, поэтому смена языка их подхватывает.
export const NODE_META: Record<ProTunRuleKind, ProTunKindMeta> = {
    apps: {
        get label() { return t("protun.kind.apps.label") },
        get description() { return t("protun.kind.apps.description") },
        icon: Monitor,
        role: "source",
        accentBar: "bg-chart-1",
        accentText: "text-chart-1",
        accentChipBg: "bg-muted",
        placeholder: "chrome.exe",
        get itemLabel() { return t("protun.kind.apps.itemLabel") },
        get itemHint() { return t("protun.kind.apps.itemHint") },
    },
    domains: {
        get label() { return t("protun.kind.domains.label") },
        get description() { return t("protun.kind.domains.description") },
        icon: Globe,
        role: "source",
        accentBar: "bg-chart-2",
        accentText: "text-chart-2",
        accentChipBg: "bg-muted",
        placeholder: "youtube.com",
        get itemLabel() { return t("protun.kind.domains.itemLabel") },
        get itemHint() { return t("protun.kind.domains.itemHint") },
    },
    ip_ranges: {
        get label() { return t("protun.kind.ipRanges.label") },
        get description() { return t("protun.kind.ipRanges.description") },
        icon: Server,
        role: "source",
        accentBar: "bg-chart-3",
        accentText: "text-chart-3",
        accentChipBg: "bg-muted",
        placeholder: "10.0.0.0/8",
        get itemLabel() { return t("protun.kind.ipRanges.itemLabel") },
        get itemHint() { return t("protun.kind.ipRanges.itemHint") },
    },
    geoip: {
        get label() { return t("protun.kind.geoip.label") },
        get description() { return t("protun.kind.geoip.description") },
        icon: Flag,
        role: "source",
        accentBar: "bg-chart-3",
        accentText: "text-chart-3",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
    },
    geosite: {
        get label() { return t("protun.kind.geosite.label") },
        get description() { return t("protun.kind.geosite.description") },
        icon: Layers,
        role: "source",
        accentBar: "bg-chart-2",
        accentText: "text-chart-2",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
    },
    ports: {
        get label() { return t("protun.kind.ports.label") },
        get description() { return t("protun.kind.ports.description") },
        icon: Hash,
        role: "source",
        accentBar: "bg-chart-4",
        accentText: "text-chart-4",
        accentChipBg: "bg-muted",
        get placeholder() { return t("protun.kind.ports.placeholder") },
        get itemLabel() { return t("protun.kind.ports.itemLabel") },
        get itemHint() { return t("protun.kind.ports.itemHint") },
    },
    protocols: {
        get label() { return t("protun.kind.protocols.label") },
        get description() { return t("protun.kind.protocols.description") },
        icon: Waypoints,
        role: "source",
        accentBar: "bg-chart-5",
        accentText: "text-chart-5",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
    },
    network: {
        get label() { return t("protun.kind.network.label") },
        get description() { return t("protun.kind.network.description") },
        icon: Network,
        role: "source",
        accentBar: "bg-chart-5",
        accentText: "text-chart-5",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
    },
    vpn: {
        get label() { return t("protun.kind.vpn.label") },
        get description() { return t("protun.kind.vpn.description") },
        icon: Shield,
        role: "destination",
        accentBar: "bg-primary",
        accentText: "text-primary",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
        get statusText() { return t("protun.kind.vpn.statusText") },
    },
    server: {
        get label() { return t("protun.kind.server.label") },
        get description() { return t("protun.kind.server.description") },
        icon: MapPin,
        role: "destination",
        accentBar: "bg-chart-1",
        accentText: "text-chart-1",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
        get statusText() { return t("protun.kind.server.statusText") },
    },
    direct: {
        get label() { return t("protun.kind.direct.label") },
        get description() { return t("protun.kind.direct.description") },
        icon: ArrowRightLeft,
        role: "destination",
        accentBar: "bg-border",
        accentText: "text-muted-foreground",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
        get statusText() { return t("protun.kind.direct.statusText") },
    },
    block: {
        get label() { return t("protun.kind.block.label") },
        get description() { return t("protun.kind.block.description") },
        icon: Ban,
        role: "destination",
        accentBar: "bg-destructive",
        accentText: "text-destructive",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
        get statusText() { return t("protun.kind.block.statusText") },
    },
    other: {
        get label() { return t("protun.kind.other.label") },
        get description() { return t("protun.kind.other.description") },
        icon: Ellipsis,
        role: "fallback",
        accentBar: "bg-chart-4",
        accentText: "text-chart-4",
        accentChipBg: "bg-muted",
        placeholder: "",
        itemLabel: "",
        itemHint: "",
        get statusText() { return t("protun.kind.other.statusText") },
    },
}

const EDGE_STROKE_VAR: Record<ProTunDestinationKind, string> = {
    vpn: "var(--primary)",
    server: "var(--chart-1)",
    direct: "var(--muted-foreground)",
    block: "var(--destructive)",
}

export function edgeStrokeColor(kind: ProTunDestinationKind): string {
    return EDGE_STROKE_VAR[kind]
}

export const SOURCE_ADD_OPTIONS: ProTunSourceKind[] = ["apps", "domains", "ip_ranges", "geoip", "geosite", "ports", "protocols", "network"]

// Protocols the core recognises from the first bytes of a flow. The id is
// what the backend expects in the card's items.
export interface ProTunProtocolOption {
    id: string
    label: string
    hint: string
}

export const PROTOCOL_OPTIONS: readonly ProTunProtocolOption[] = [
    { id: "bittorrent", label: "BitTorrent", get hint() { return t("protun.protocol.bittorrent") } },
    { id: "quic", label: "QUIC", get hint() { return t("protun.protocol.quic") } },
    { id: "tls", label: "TLS", get hint() { return t("protun.protocol.tls") } },
    { id: "http", label: "HTTP", get hint() { return t("protun.protocol.http") } },
]

export const NETWORK_OPTIONS: readonly ProTunProtocolOption[] = [
    { id: "tcp", label: "TCP", get hint() { return t("protun.protocol.tcp") } },
    { id: "udp", label: "UDP", get hint() { return t("protun.protocol.udp") } },
]

// fixedOptionsOf: карточки с фиксированным набором галочек вместо списка.
export function fixedOptionsOf(kind: ProTunRuleKind): readonly ProTunProtocolOption[] | null {
    if (kind === "protocols") return PROTOCOL_OPTIONS
    if (kind === "network") return NETWORK_OPTIONS
    return null
}

// Cards whose size the user controls. The protocols card has a fixed set of
// options, so it sizes itself to its content like the destination cards.
export function isResizableKind(kind: ProTunRuleKind): boolean {
    return NODE_META[kind].role === "source" && fixedOptionsOf(kind) === null
}
export const DESTINATION_ADD_OPTIONS: ProTunDestinationKind[] = ["vpn", "server", "direct", "block"]
