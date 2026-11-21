import { useEffect } from "react"
import { create } from "zustand"
import { EventsOn } from "@wailsjs/runtime/runtime"
import { GetKillSwitchState, ReleaseKillSwitch } from "@wailsjs/go/handlers/VPNHandler"
import { SetKillSwitch } from "@wailsjs/go/handlers/SettingsHandler"
import { t } from "@/i18n"

export interface KillSwitchState {
    supported: boolean
    enabled: boolean
    engaged: boolean
    reason?: string
    error?: string
}

const EMPTY: KillSwitchState = { supported: false, enabled: false, engaged: false }

const useKillSwitchStore = create<{ state: KillSwitchState; set: (state: KillSwitchState) => void }>((set) => ({
    state: EMPTY,
    set: (state) => set({ state }),
}))

let bridgeStarted = false

function refresh() {
    void GetKillSwitchState().then((state) => useKillSwitchStore.getState().set({ ...EMPTY, ...state }))
}

function ensureBridge() {
    if (bridgeStarted) return
    bridgeStarted = true
    refresh()
    EventsOn("vpn:killswitch", (state: KillSwitchState) => useKillSwitchStore.getState().set({ ...EMPTY, ...state }))
    EventsOn("app:activated", refresh)
}

/** Kill Switch: настройка и «интернет на паузе» после внезапного обрыва VPN. */
export function useKillSwitch() {
    const state = useKillSwitchStore((s) => s.state)

    useEffect(() => {
        ensureBridge()
    }, [])

    const setEnabled = async (enabled: boolean) => {
        const prev = useKillSwitchStore.getState().state
        useKillSwitchStore.getState().set({ ...prev, enabled })
        const res = await SetKillSwitch(enabled)
        refresh()
        if (!res.success) throw new Error(res.error || t("home.killSwitch.toast.saveFailed"))
    }

    const release = async () => {
        const res = await ReleaseKillSwitch()
        refresh()
        if (!res.success) throw new Error(res.error || t("home.killSwitch.toast.restoreFailed"))
    }

    return { ...state, setEnabled, release }
}
