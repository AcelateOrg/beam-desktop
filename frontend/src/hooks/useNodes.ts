import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { GetNodeConfig, GetProfileNodes, SelectProfileNode, UpdateNodeConfig } from '@wailsjs/go/handlers/ProfileHandler'
import type { NodeConfigDraft } from '@/types/api'

import { useSelectedNode, useVPNStore } from '@/stores/vpnStore'
import { t } from "@/i18n"

let nodesLoadPromise: Promise<void> | null = null
let nodesLoadProfileId: string | null = null

export async function syncNodes(profileId: string, force = false): Promise<void> {
    const state = useVPNStore.getState()
    if (!force && state.nodesProfileId === profileId) {
        return
    }

    if (nodesLoadPromise && nodesLoadProfileId === profileId) {
        return nodesLoadPromise
    }

    nodesLoadProfileId = profileId
    nodesLoadPromise = (async () => {
        const result = await GetProfileNodes(profileId)
        if (!result.success || !result.data) {
            return
        }

        useVPNStore.getState().setNodes(
            profileId,
            result.data.categories || [],
            result.data.selectedId || '',
            result.data.totalNodes || 0,
        )
    })()

    try {
        await nodesLoadPromise
    } finally {
        nodesLoadPromise = null
        nodesLoadProfileId = null
    }
}

export function useNodes() {
    const {
        activeProfileId,
        categories,
        selectedNodeId,
        totalNodes,
        setSelectedNode,
        clearNodes,
    } = useVPNStore()

    const selectedNode = useSelectedNode()

    const [loading, setLoading] = useState(false)
    const [switching, setSwitching] = useState(false)

    const loadNodes = useCallback(async (force = false) => {
        if (!activeProfileId) {
            clearNodes()
            return
        }

        setLoading(true)
        try {
            await syncNodes(activeProfileId, force)
        } catch (error) {
            console.error('Failed to load nodes:', error)
        } finally {
            setLoading(false)
        }
    }, [activeProfileId, clearNodes])

    useEffect(() => {
        void loadNodes(false)
    }, [loadNodes])

    const selectNode = useCallback(async (nodeId: string) => {
        if (!activeProfileId || nodeId === selectedNodeId) {
            return
        }

        // Selection is shown at once. A live session is switched by the
        // backend itself (core swap, the tunnel stays up) and its progress
        // arrives through the regular status events, so nothing here waits
        // for it or reconnects on its own.
        const previousNodeId = selectedNodeId
        setSelectedNode(nodeId)
        setSwitching(true)

        try {
            const result = await SelectProfileNode(activeProfileId, nodeId)
            if (!result.success) {
                setSelectedNode(previousNodeId)
                toast.error(t("nodes.toast.switchFailed"), {
                    description: result.error,
                })
            }
        } catch (error) {
            setSelectedNode(previousNodeId)
            toast.error(t("nodes.toast.switchError"))
        } finally {
            setSwitching(false)
        }
    }, [activeProfileId, selectedNodeId, setSelectedNode])

    const loadNodeConfig = useCallback(async (nodeId: string) => {
        if (!activeProfileId) {
            return null
        }

        try {
            const result = await GetNodeConfig(activeProfileId, nodeId)
            if (!result.success || !result.data) {
                toast.error(t("nodes.toast.openConfigFailed"), {
                    description: result.error,
                })
                return null
            }
            return result.data
        } catch (error) {
            toast.error(t("nodes.toast.openConfigFailed"))
            return null
        }
    }, [activeProfileId])

    const saveNodeConfig = useCallback(async (nodeId: string, draft: NodeConfigDraft) => {
        if (!activeProfileId) {
            return null
        }

        try {
            const result = await UpdateNodeConfig(
                activeProfileId,
                nodeId,
                draft.name,
                JSON.stringify(draft.overrides ?? {}),
                draft.pinned,
            )
            if (!result.success || !result.data) {
                toast.error(t("nodes.toast.saveConfigFailed"), {
                    description: result.error,
                })
                return null
            }

            await syncNodes(activeProfileId, true)

            return result.data
        } catch (error) {
            toast.error(t("nodes.toast.saveConfigError"))
            return null
        }
    }, [activeProfileId])

    return {
        categories,
        selectedNodeId,
        selectedNode,
        totalNodes,
        loading,
        switching,
        loadNodes,
        selectNode,
        loadNodeConfig,
        saveNodeConfig,
        hasNodes: totalNodes > 0,
    }
}
