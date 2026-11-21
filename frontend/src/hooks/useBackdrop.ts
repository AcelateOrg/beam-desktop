import { useEffect, useSyncExternalStore } from 'react'

import { getBackdropSnapshot, initBackdrop, subscribeToBackdrop } from '@/themes/backdrop'

export function useBackdrop() {
    const snapshot = useSyncExternalStore(subscribeToBackdrop, getBackdropSnapshot, getBackdropSnapshot)

    useEffect(() => {
        initBackdrop()
    }, [])

    return snapshot
}
