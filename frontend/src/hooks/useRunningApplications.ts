import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ListRunningApplications } from "@wailsjs/go/handlers/SettingsHandler"
import type { RunningApplication } from "@/types/api"
import { t } from "@/i18n"

export function useRunningApplications() {
    const [apps, setApps] = useState<RunningApplication[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState("")

    const load = async () => {
        setLoading(true)
        try {
            const result = await ListRunningApplications()
            if (!result.success || !result.data) {
                toast.error(t("logs.toast.processesFailed"), { description: result.error })
                return
            }
            setApps(result.data.filter((item) => Boolean(item?.name)))
        } catch {
            toast.error(t("logs.toast.processesFailed"))
        } finally {
            setLoading(false)
        }
    }

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return apps
        return apps.filter((item) => item.name.toLowerCase().includes(q))
    }, [query, apps])

    return { processes: filtered, loading, query, setQuery, load }
}
