import { useCallback, useEffect, useRef, useState } from 'react'
import { GetActiveConnections } from '@wailsjs/go/handlers/VPNHandler'
import { isAppVisible } from '@/lib/visibility'
import { t } from "@/i18n"

export interface ActiveConnection {
    id: string
    network: string
    host: string
    destination: string
    source: string
    outbound: string
    chains?: string[]
    rule: string
    process: string
    upload: number
    download: number
    startedAt: number
    duration: number
    /** Полный путь программы — для иконки и группировки. */
    processPath: string
    /** Домен (SNI, Host, DNS или сниффинг ядра); пусто, если известен только IP. */
    domain: string
    /** tls, http1, quic… */
    protocol: string
    /** proxy | direct | block | dns; пусто вне TUN. */
    route: string
    /** app | rules | default | lan | dns */
    ruleKind: string
    /** Сервер, через который идёт соединение (для VPN). */
    nodeName: string
    /** Недавно закрытое соединение (видно ~2 минуты). */
    closed: boolean
    endedAt: number
}

export function useConnections(active: boolean, intervalMs = 1000) {
    const [connections, setConnections] = useState<ActiveConnection[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const inFlight = useRef(false)

    const load = useCallback(async () => {
        if (inFlight.current) return
        inFlight.current = true
        try {
            const result = await GetActiveConnections()
            if (result.success) {
                const list = (result.data ?? []) as unknown as ActiveConnection[]
                setConnections([...list].sort((a, b) => b.startedAt - a.startedAt))
                setError('')
            } else {
                setError(result.error || t("logs.toast.connectionsFailed"))
            }
        } catch (err) {
            console.error('Failed to load connections:', err)
        } finally {
            inFlight.current = false
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!active) {
            setConnections([])
            return
        }

        let cancelled = false
        let timer: number | undefined

        setLoading(true)
        void load()

        const schedule = () => {
            timer = window.setTimeout(async () => {
                if (cancelled) return
                if (isAppVisible()) await load()
                if (!cancelled) schedule()
            }, intervalMs)
        }
        schedule()

        return () => {
            cancelled = true
            if (timer !== undefined) clearTimeout(timer)
        }
    }, [active, intervalMs, load])

    return { connections, loading, error, refresh: load }
}
