import { create } from 'zustand'
import type { types } from '@wailsjs/go/models'

export type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error'

interface UpdateState {
    available: boolean
    currentVersion: string | null
    latestVersion: string | null
    /** The update cannot be postponed. */
    mandatory: boolean
    releasedAt: string | null
    /** Changelog lines, already in the user's language. */
    notes: string[]
    status: UpdateStatus
    progressPercent: number
    error: string | null

    setInfo: (info: types.UpdateInfo) => void
    setStatus: (status: UpdateStatus) => void
    setProgressPercent: (percent: number) => void
    setError: (error: string) => void
    reset: () => void
}

export const useUpdateStore = create<UpdateState>((set) => ({
    available: false,
    currentVersion: null,
    latestVersion: null,
    mandatory: false,
    releasedAt: null,
    notes: [],
    status: 'idle',
    progressPercent: 0,
    error: null,

    setInfo: (info) => set({
        available: info.available,
        currentVersion: info.currentVersion,
        latestVersion: info.latestVersion || null,
        mandatory: Boolean(info.mandatory),
        releasedAt: info.releasedAt || null,
        notes: info.notes ?? [],
    }),

    setStatus: (status) => set((state) => ({ status, error: status === 'error' ? state.error : null })),

    setProgressPercent: (progressPercent) => set({ progressPercent }),

    setError: (error) => set({ error, status: 'error' }),

    reset: () => set({
        available: false,
        latestVersion: null,
        mandatory: false,
        releasedAt: null,
        notes: [],
        status: 'idle',
        progressPercent: 0,
        error: null,
    }),
}))
