import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { DeleteProfile, ExportProfile, ExportProfileRawLinks, GetProfiles, ImportFromURL, RefreshProfile, SaveProfileBeamFile, SaveProfileLinksFile, SetActiveProfile, SetProfileAutoRefresh, SetProfileUpdateInterval } from '@wailsjs/go/handlers/ProfileHandler'
import { isAppVisible } from '@/lib/visibility'
import { useVPNStore } from '@/stores/vpnStore'
import type { ExportedLink, ProfileSummary } from '@/types/api'
import { syncNodes } from '@/hooks/useNodes'
import { t } from "@/i18n"

let profilesLoaded = false
let profilesLoadPromise: Promise<void> | null = null

async function syncProfiles(force = false): Promise<void> {
    if (!force && profilesLoaded) {
        return
    }

    if (profilesLoadPromise) {
        return profilesLoadPromise
    }

    profilesLoadPromise = (async () => {
        try {
            const result = await GetProfiles()
            if (!result.success || !result.data) {
                return
            }

            const active = result.data.find((profile: ProfileSummary) => profile.isActive) ?? null
            const store = useVPNStore.getState()

            store.setProfiles(result.data)
            store.setActiveProfile(active ? active.id : null)
            profilesLoaded = true
        } catch (error) {
            console.error('[useProfiles] Failed to load profiles:', error)
        }
    })()

    try {
        await profilesLoadPromise
    } finally {
        profilesLoadPromise = null
    }
}

export function useProfiles() {
    const {
        profiles,
        activeProfileId,
        status,
        setProfiles,
        setActiveProfile,
        clearNodes,
    } = useVPNStore()

    useEffect(() => {
        void syncProfiles()
    }, [])

    useEffect(() => {
        if (status !== 'connected' && status !== 'connected_no_internet') {
            return
        }

        const interval = setInterval(() => {
            if (!isAppVisible()) return
            void syncProfiles(true)
        }, 15000)

        return () => clearInterval(interval)
    }, [status])

    const load = useCallback(async () => {
        await syncProfiles(true)
    }, [])

    const selectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSelectedRef = useRef<string | null>(null)

    useEffect(() => {
        return () => {
            if (selectTimerRef.current) {
                clearTimeout(selectTimerRef.current)
            }
        }
    }, [])

    const select = useCallback(async (id: string) => {
        const store = useVPNStore.getState()
        const currentProfiles = store.profiles

        store.setActiveProfile(id)
        store.setProfiles(currentProfiles.map((profile) => ({
            ...profile,
            isActive: profile.id === id,
        })))
        store.clearNodes()

        lastSelectedRef.current = id
        if (selectTimerRef.current) {
            clearTimeout(selectTimerRef.current)
        }

        selectTimerRef.current = setTimeout(async () => {
            const target = lastSelectedRef.current
            if (!target) {
                return
            }

            const result = await SetActiveProfile(target)
            if (!result.success && lastSelectedRef.current === target) {
                await syncProfiles(true)
            }
        }, 120)
    }, [])

    const remove = useCallback(async (id: string) => {
        const result = await DeleteProfile(id)
        if (!result.success) {
            return
        }

        if (id === activeProfileId) {
            clearNodes()
            setActiveProfile(null)
        }

        await syncProfiles(true)
    }, [activeProfileId, clearNodes, setActiveProfile])

    const importUrl = useCallback(async (url: string) => {
        const result = await ImportFromURL(url)
        if (!result.success) {
            return { success: false, error: result.error }
        }

        await syncProfiles(true)
        return { success: true }
    }, [])

    const refresh = useCallback(async (id: string) => {
        const toastId = toast.loading(t("profiles.toast.refreshing"))
        try {
            const result = await RefreshProfile(id)
            if (!result.success) {
                toast.error(t("profiles.toast.refreshFailed"), { id: toastId, description: result.error })
                return
            }

            await syncProfiles(true)
            const nodesState = useVPNStore.getState()
            if (nodesState.activeProfileId === id || nodesState.nodesProfileId === id) {
                await syncNodes(id, true)
            }
            toast.success(t("profiles.toast.refreshed"), { id: toastId })
        } catch (error) {
            toast.error(t("profiles.toast.refreshFailed"), { id: toastId, description: String(error) })
        }
    }, [])

    const setAutoRefresh = useCallback(async (id: string, disabled: boolean) => {
        const store = useVPNStore.getState()
        const previous = store.profiles

        store.setProfiles(previous.map((profile) =>
            profile.id === id ? { ...profile, autoRefreshDisabled: disabled } : profile
        ))

        const result = await SetProfileAutoRefresh(id, disabled)
        if (!result.success) {
            store.setProfiles(previous)
            toast.error(t("profiles.toast.autoRefreshFailed"), { description: result.error })
        }
    }, [])

    const setUpdateInterval = useCallback(async (id: string, hours: number) => {
        const store = useVPNStore.getState()
        const previous = store.profiles

        store.setProfiles(previous.map((profile) =>
            profile.id === id ? { ...profile, updateIntervalOverrideHours: hours } : profile
        ))

        const result = await SetProfileUpdateInterval(id, hours)
        if (!result.success) {
            store.setProfiles(previous)
            toast.error(t("profiles.toast.scheduleFailed"), { description: result.error })
        }
    }, [])

    const exportProfile = useCallback(async (id: string): Promise<string | null> => {
        const result = await ExportProfile(id)

        if (result.success && result.data) {
            return result.data
        }

        toast.error(t("profiles.toast.exportFailed"))
        return null
    }, [])

    const exportRawLinks = useCallback(async (id: string): Promise<ExportedLink[]> => {
        const result = await ExportProfileRawLinks(id)
        if (result.success && result.data) {
            return result.data
        }
        if (!result.success) {
            toast.error(t("profiles.toast.linksFailed"), { description: result.error })
        }
        return []
    }, [])

    const saveProfileFile = useCallback(async (id: string, suggestedName: string): Promise<string | null> => {
        const result = await SaveProfileBeamFile(id, suggestedName)
        if (result.success) {
            return result.data ?? ''
        }

        toast.error(t("profiles.toast.saveFileFailed"), { description: result.error })
        return null
    }, [])

    const saveLinksFile = useCallback(async (id: string, suggestedName: string): Promise<string | null> => {
        const result = await SaveProfileLinksFile(id, suggestedName)
        if (result.success) {
            return result.data ?? ''
        }

        toast.error(t("profiles.toast.saveLinksFailed"), { description: result.error })
        return null
    }, [])

    const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || null

    return {
        profiles,
        activeProfile,
        activeProfileId,
        load,
        select,
        remove,
        importUrl,
        refresh,
        setAutoRefresh,
        setUpdateInterval,
        exportProfile,
        exportRawLinks,
        saveProfileFile,
        saveLinksFile,
    }
}
