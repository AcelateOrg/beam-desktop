import { useEffect } from "react"
import { toast } from "sonner"
import { Heartbeat } from "@wailsjs/go/main/App"
import { EventsEmit, EventsOn } from "@wailsjs/runtime/runtime"
import { isWailsNative } from "@/lib/wails-safe"
import { isAppVisible, onAppVisibilityChange } from "@/lib/visibility"
import { t } from "@/i18n"

const HEARTBEAT_INTERVAL_MS = 2000
const VISIBILITY_EVENT = "app:webview-visibility"
const RECOVERED_TOAST_ID = "app-recovered-from-crash"

export function useCrashWatchdog() {
    useEffect(() => {
        if (!isWailsNative()) return

        // Subscribed before the first beat: the backend answers the first
        // heartbeat after a watchdog reload with this event.
        const unsubscribe = EventsOn("app:recovered-from-crash", () => {
            toast.warning(t("errors.recovered.uiRestarted.title"), {
                id: RECOVERED_TOAST_ID,
                description: t("errors.recovered.uiRestarted.description"),
            })
        })

        // The previous run crashed with the VPN up; the backend reconnected.
        const unsubscribeRestored = EventsOn("app:restored-after-crash", (ok: boolean) => {
            if (ok) {
                toast.success(t("errors.recovered.vpnRestored.title"), {
                    description: t("errors.recovered.vpnRestored.description"),
                })
            } else {
                toast.warning(t("errors.recovered.vpnNotRestored.title"), {
                    description: t("errors.recovered.vpnNotRestored.description"),
                })
            }
        })

        const beat = () => {
            Heartbeat().catch(() => {})
        }

        // Beats keep going while the page is hidden. Going silent on purpose
        // made the backend reload an occluded/minimised window every ~20s on
        // macOS; instead the backend is told the page is hidden and relaxes
        // its timeout, since WebKit throttles timers of such a page anyway.
        const reportVisibility = (visible: boolean) => {
            EventsEmit(VISIBILITY_EVENT, visible)
        }

        reportVisibility(isAppVisible())
        beat()
        const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS)

        const unsubscribeVisibility = onAppVisibilityChange(visible => {
            reportVisibility(visible)
            if (visible) beat()
        })

        return () => {
            clearInterval(interval)
            unsubscribe()
            unsubscribeRestored()
            unsubscribeVisibility()
        }
    }, [])
}
