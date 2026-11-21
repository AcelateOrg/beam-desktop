export type VPNStatus = 'disconnected' | 'connecting' | 'connected' | 'connected_no_internet' | 'disconnecting' | 'error'

export interface Profile {
    id: string
    name: string
    provider: string
    url: string
    dataLimit: number
    dataUsed: number
    expiresAt: string
    createdAt: string
    updatedAt: string
    isActive: boolean
}

export interface Branding {
    iconUrl?: string
    bannerText?: string
    bannerUrl?: string
    bannerColor?: string
    bannerImage?: string
    webPageUrl?: string
    supportUrl?: string
    communityUrl?: string
}

export interface ProfileSummary {
    id: string
    name: string
    provider: string
    announce?: string
    supportUrl?: string
    iconUrl?: string
    communityUrl?: string
    branding?: Branding
    proTunLocked?: boolean
    /** Provider asked to hide the domain chip (Beam-Provider-Badge: none). */
    hideProvider?: boolean
    dataLimit: number
    dataUsed: number
    daysLeft: number
    isExpired?: boolean
    usedPercent: number
    isActive: boolean
    hasSubscription: boolean
    url?: string
    updateIntervalHours?: number
    autoRefreshDisabled?: boolean
    updateIntervalOverrideHours?: number
}

export interface ConnectionStats {
    ping: number
    bytesReceived: number
    bytesSent: number
    connectedAt: number
    duration: number
    isHealthy: boolean
    activeConns: number
    lastActivityAt: number
}

export interface DetailedStats {
    download: number
    upload: number
    activeConnections: number
    duration: number
}

export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: string
}

export interface Category {
    id: string
    name: string
    icon?: string
    order: number
    /** Provider's emoji for the group, shown instead of the icon. */
    emoji?: string
    /** Group starts folded. */
    collapsed?: boolean
}

export interface NodeInfo {
    id: string
    name: string
    type: string
    categoryId: string
    isSelected: boolean
    isEdited?: boolean
    isPinned?: boolean
    /** ws, grpc, httpupgrade, xhttp, h2; пусто — обычный TCP. */
    transport?: string
    /** tls | reality; пусто — без шифрования или встроено в протокол. */
    security?: string
    /** Provider's subtitle; replaces the protocol line. */
    description?: string
    /** Short chip on the card (NEW, 🔥). */
    badge?: string
    /** Provider asked to hide "VLESS / REALITY". */
    hideProtocol?: boolean
    /** Сертификат сервера не проверяется (allowInsecure). */
    insecure?: boolean
}

export interface CategoryWithNodes {
    category: Category
    nodes: NodeInfo[]
}

export interface ProfileNodesResponse {
    categories: CategoryWithNodes[]
    selectedId: string
    totalNodes: number
}

export type OutboundConfig = Record<string, unknown>

export interface NodeConfig {
    nodeId: string
    name: string
    baseName: string
    type: string
    outbound: OutboundConfig
    original: OutboundConfig
    overrides: Record<string, unknown>
    isEdited: boolean
    isPinned: boolean
    hasSubscription: boolean
    rawLinkStale: boolean
}

export interface NodeConfigDraft {
    name: string
    overrides: Record<string, unknown>
    pinned: boolean
}

export interface ProxyNode {
    id: string
    name: string
    type: string
}

export interface PingResult {
    nodeId: string
    latency: number
    status: 'ok' | 'timeout' | 'error' | 'cancelled' | 'pending' | 'invalid'
}

export interface ExportedLink {
    name: string
    link: string
}

export interface ConnectionSettings {
    primaryDns: string
    secondaryDns: string
    proxyDns: string
    dnsOverVpn: boolean
    mtu: number
    stack: string
}

export interface GamingModeSettings {
    enabled: boolean
    mtu: number
    disableSniffing: boolean
    directPorts: string[]
    udpOverTcp: boolean
    lowLatencyDns: boolean
    useSystemStack: boolean
    routeGamePortsDirect: boolean
}

export interface RunningApplication {
    name: string
    path?: string
    icon?: string
}

export interface SplitTunnelSettings {
    enabled: boolean
    mode: 'exclude' | 'include'
    apps: string[]
    domains: string[]
    ips: string[]
}

export type Theme = import('@/themes/controller').ThemePreference
