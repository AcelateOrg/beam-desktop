import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'
import type {
    VPNStatus,
    ConnectionStats,
    ProfileSummary,
    CategoryWithNodes,
    NodeInfo,
    PingResult,
} from '@/types/api'

export type PingMap = Record<string, PingResult>

interface VPNState {
    status: VPNStatus
    ping: number
    stats: ConnectionStats | null
    error: string | null
    isHealthy: boolean

    profiles: ProfileSummary[]
    activeProfileId: string | null

    categories: CategoryWithNodes[]
    selectedNodeId: string | null
    totalNodes: number
    nodesProfileId: string | null

    pingMap: PingMap

    setStatus: (status: VPNStatus) => void
    setPing: (ping: number) => void
    setStats: (stats: ConnectionStats) => void
    setError: (error: string | null) => void
    setHealthy: (healthy: boolean) => void

    setProfiles: (profiles: ProfileSummary[]) => void
    setActiveProfile: (id: string | null) => void

    setNodes: (profileId: string, categories: CategoryWithNodes[], selectedId: string, total: number) => void
    setSelectedNode: (id: string | null) => void
    clearNodes: () => void

    mergePingResults: (results: PingResult[]) => void
    clearPingMap: () => void

    reset: () => void
    clearError: () => void
}

export const useVPNStore = create<VPNState>((set, get) => ({
    status: 'disconnected',
    ping: -1,
    stats: null,
    error: null,
    isHealthy: true,
    profiles: [],
    activeProfileId: null,
    categories: [],
    selectedNodeId: null,
    totalNodes: 0,
    nodesProfileId: null,
    pingMap: {},

    // A finished session takes its numbers with it: the next one must not
    // start by showing the previous ping and traffic.
    setStatus: (status) => set(status === 'disconnected'
        ? { status, stats: null, ping: -1 }
        : { status, error: status === 'connected' ? null : get().error }),

    setPing: (ping) => set({ ping }),

    setStats: (stats) => set({
        stats,
        ping: stats.ping ?? -1,
        isHealthy: stats.isHealthy
    }),

    setError: (error) => set({
        error,
        status: 'disconnected'
    }),

    setHealthy: (isHealthy) => set({ isHealthy }),

    setProfiles: (profiles) => set({ profiles }),

    setActiveProfile: (id) => set({ activeProfileId: id }),

    setNodes: (profileId, categories, selectedId, total) => set({
        categories,
        selectedNodeId: selectedId,
        totalNodes: total,
        nodesProfileId: profileId,
    }),

    setSelectedNode: (id) => set({ selectedNodeId: id }),

    clearNodes: () => set({
        categories: [],
        selectedNodeId: null,
        totalNodes: 0,
        nodesProfileId: null,
    }),

    mergePingResults: (results) => set(state => {
        const next = { ...state.pingMap }
        for (const r of results) {
            next[r.nodeId] = r
        }
        return { pingMap: next }
    }),

    clearPingMap: () => set({ pingMap: {} }),

    reset: () => set({
        status: 'disconnected',
        ping: -1,
        stats: null,
        error: null,
        isHealthy: true,
    }),

    clearError: () => set({ error: null }),
}))

export const useSelectedNode = (): NodeInfo | null => {
    const categories = useVPNStore(useShallow(state => state.categories))
    const selectedNodeId = useVPNStore(state => state.selectedNodeId)

    return useMemo(() => {
        for (const cat of categories) {
            const node = cat.nodes.find(n => n.id === selectedNodeId)
            if (node) return node
        }

        if (categories.length > 0 && categories[0].nodes.length > 0) {
            return categories[0].nodes[0]
        }

        return null
    }, [categories, selectedNodeId])
}

export const useAllNodes = (): NodeInfo[] => {
    const categories = useVPNStore(useShallow(state => state.categories))
    return useMemo(() => categories.flatMap(cat => cat.nodes), [categories])
}
