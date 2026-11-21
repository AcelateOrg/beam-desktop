import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { GetPendingOpenTargets, HandleExternalTarget } from '@wailsjs/go/handlers/SystemHandler'
import { EventsOn } from '@wailsjs/runtime/runtime'
import { useProfiles } from '@/hooks/useProfiles'
import { isWailsNative } from '@/lib/wails-safe'
import { t } from "@/i18n"

// describeTarget — коротко, откуда пришёл импорт: домен подписки или имя
// файла. Показывается в подтверждении, чтобы было видно, что именно
// добавится.
function describeTarget(target: string): string {
    const trimmed = target.trim()
    const lower = trimmed.toLowerCase()
    try {
        if (lower.startsWith('http://') || lower.startsWith('https://')) {
            return new URL(trimmed).host
        }
        if (lower.startsWith('beam:')) {
            const parsed = new URL(trimmed)
            const inner = parsed.searchParams.get('url') || decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
            if (/^https?:\/\//i.test(inner)) return new URL(inner).host
            return t("profiles.externalImport.beamLink")
        }
    } catch {
        return t("profiles.externalImport.beamLink")
    }
    const parts = trimmed.split(/[\\/]/)
    return parts[parts.length - 1] || trimmed
}

// confirmImport спрашивает пользователя перед импортом. Ссылку beam:// может
// подсунуть любой сайт или программа, а импорт делает профиль активным —
// без подтверждения чужие серверы молча подменили бы твои.
function confirmImport(target: string): Promise<boolean> {
    return new Promise((resolve) => {
        let settled = false
        const settle = (value: boolean) => {
            if (settled) return
            settled = true
            resolve(value)
        }
        toast(t("profiles.externalImport.title"), {
            description: t("profiles.externalImport.source", { source: describeTarget(target) }),
            duration: Infinity,
            action: { label: t("profiles.externalImport.confirm"), onClick: () => settle(true) },
            cancel: { label: t("profiles.externalImport.cancel"), onClick: () => settle(false) },
            onDismiss: () => settle(false),
            onAutoClose: () => settle(false),
        })
    })
}

export function useExternalOpen() {
    const navigate = useNavigate()
    const { load } = useProfiles()
    const queueRef = useRef(Promise.resolve())

    useEffect(() => {
        if (!isWailsNative()) {
            console.log('[useExternalOpen] Wails not available, skipping')
            return
        }

        const enqueue = (target: string) => {
            queueRef.current = queueRef.current.then(async () => {
                try {
                    if (!(await confirmImport(target))) return
                    const result = await HandleExternalTarget(target)
                    if (!result.success) {
                        toast.error(t("profiles.externalImport.failed"), {
                            description: result.error || target,
                        })
                        return
                    }
                    await load()
                    navigate('/profiles')
                } catch (error) {
                    console.error('[useExternalOpen] Handle error:', error)
                }
            })
        }

        GetPendingOpenTargets()
            .then((result) => {
                if (!result.success || !result.data) return
                for (const target of result.data) {
                    enqueue(target)
                }
            })
            .catch((error) => {
                console.warn('[useExternalOpen] Failed to get pending targets:', error)
            })

        const unsubscribeOpen = EventsOn('app:open-target', (target: string) => {
            enqueue(target)
        })

        return () => {
            unsubscribeOpen()
        }
    }, [load, navigate])
}
