import { useCallback, useEffect } from 'react'
import { EventsOn } from '@wailsjs/runtime/runtime'
import { Connect, Disconnect, GetStats, GetStatus } from '@wailsjs/go/handlers/VPNHandler'
import { toast } from 'sonner'

import { isAppVisible } from '@/lib/visibility'
import { useVPNStore } from '@/stores/vpnStore'
import { startServerSwitchTracker } from '@/stores/serverSwitchStore'
import type { ConnectionStats, PingResult, VPNStatus } from '@/types/api'
import { t } from "@/i18n"

let vpnBridgeStarted = false

function ensureVPNBridge() {
    if (vpnBridgeStarted) {
        return
    }

    vpnBridgeStarted = true
    startServerSwitchTracker()

    void GetStatus().then((status) => {
        useVPNStore.getState().setStatus(status as VPNStatus)
    })

    EventsOn('vpn:status', (status: string) => {
        const store = useVPNStore.getState()
        store.setStatus(status as VPNStatus)
        if (status === 'connected') {
            store.clearError()
        }
    })

    EventsOn('vpn:stats', (stats: ConnectionStats) => {
        useVPNStore.getState().setStats(stats)
    })

    // Ping results arrive one by one while a batch is still running.
    EventsOn('ping:result', (result: PingResult) => {
        useVPNStore.getState().mergePingResults([result])
    })

    EventsOn('vpn:error', (error: string) => {
        console.error('VPN Error:', error)
        useVPNStore.getState().setError(error)
    })

    EventsOn('app:activated', () => {
        void GetStatus().then(status => {
            useVPNStore.getState().setStatus(status as VPNStatus)
        })
        void GetStats().then(stats => {
            useVPNStore.getState().setStats(stats)
        })
    })

    setInterval(() => {
        if (!isAppVisible()) {
            return
        }

        const current = useVPNStore.getState().status
        if (current !== 'connecting' && current !== 'disconnecting') {
            return
        }

        void GetStatus().then((actual) => {
            const store = useVPNStore.getState()
            if (store.status !== 'connecting' && store.status !== 'disconnecting') {
                return
            }
            if (actual !== store.status) {
                store.setStatus(actual as VPNStatus)
            }
        })
    }, 2000)
}

export function useVPN() {
    const {
        status,
        ping,
        stats,
        error,
        isHealthy,
        setError,
        clearError,
    } = useVPNStore()

    useEffect(() => {
        ensureVPNBridge()
    }, [])

    const connect = useCallback(async () => {
        clearError()
        const result = await Connect()
        if (!result.success && result.error) {
            setError(result.error)
        }
    }, [clearError, setError])

    const disconnect = useCallback(async () => {
        const result = await Disconnect()
        if (!result.success && result.error) {
            toast.error(t("home.toast.disconnectError"), {
                description: result.error,
            })
        }
    }, [])

    const toggle = useCallback(() => {
        if (status === 'disconnecting') {
            return
        }

        if (status === 'connecting') {
            void disconnect()
            return
        }

        if (status === 'disconnected' || status === 'error') {
            void connect()
            return
        }

        if (status === 'connected' || status === 'connected_no_internet') {
            void disconnect()
        }
    }, [connect, disconnect, status])

    const isConnected = status === 'connected' || status === 'connected_no_internet'
    const isConnecting = status === 'connecting'
    const isNoInternet = status === 'connected_no_internet'

    return {
        status,
        ping,
        stats,
        error,
        isHealthy,
        isConnected,
        isConnecting,
        isNoInternet,
        isLoading: status === 'connecting' || status === 'disconnecting',
        hasError: !!error,
        toggle,
        connect,
        disconnect,
        clearError,
    }
}
