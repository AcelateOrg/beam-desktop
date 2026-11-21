import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { GetRoutingMode } from "@wailsjs/go/handlers/SettingsHandler"
import SplitTunneling from "@/pages/settings/SplitTunneling"
import ProTun from "@/pages/protun/ProTun"
import type { RoutingMode } from "@/lib/protun/types"

export default function RoutingPage() {
    const [mode, setMode] = useState<RoutingMode | null>(null)

    useEffect(() => {
        let cancelled = false
        let timer: ReturnType<typeof setTimeout> | undefined
        // После перезапуска бэкенда (wails dev) биндинги появляются не сразу:
        // вызов падает синхронно, поэтому он обёрнут в async и повторяется.
        const load = async (attempt: number) => {
            try {
                const r = await GetRoutingMode()
                if (!cancelled) setMode(r.success && r.data === "pro" ? "pro" : "easy")
            } catch {
                if (cancelled) return
                if (attempt < 5) timer = setTimeout(() => void load(attempt + 1), 300 * (attempt + 1))
                else setMode("easy")
            }
        }
        void load(0)
        return () => {
            cancelled = true
            if (timer) clearTimeout(timer)
        }
    }, [])

    if (mode === null) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return mode === "pro" ? (
        <ProTun mode={mode} onModeChange={setMode} />
    ) : (
        <SplitTunneling routingMode={mode} onRoutingModeChange={setMode} />
    )
}
