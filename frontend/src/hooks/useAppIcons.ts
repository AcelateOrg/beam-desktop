import { useEffect, useState } from "react"
import { GetAppIcons } from "@wailsjs/go/handlers/SettingsHandler"
import { isWailsNative } from "@/lib/wails-safe"

/** Иконки не меняются — кэш на всю сессию приложения; null = иконки нет. */
const iconCache = new Map<string, string | null>()

/** Подгружает иконки программ по путям exe и возвращает геттер (data:URL или null). */
export function useAppIcons(paths: string[]) {
    const [, bump] = useState(0)
    const key = paths.join("\n")

    useEffect(() => {
        if (!isWailsNative()) return
        const missing = key.split("\n").filter((p) => p && !iconCache.has(p))
        if (missing.length === 0) return
        let cancelled = false
        GetAppIcons(missing)
            .then((res) => {
                const icons = res.success ? res.data ?? {} : {}
                for (const p of missing) iconCache.set(p, icons[p] ?? null)
                if (!cancelled) bump((n) => n + 1)
            })
            .catch(() => {})
        return () => { cancelled = true }
    }, [key])

    return (path: string) => (path ? iconCache.get(path) ?? null : null)
}
