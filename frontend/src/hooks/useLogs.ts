import { useState, useEffect, useCallback, useRef } from 'react'
import { GetLogs, ClearLogs } from '@wailsjs/go/handlers/VPNHandler'
import { isAppVisible } from '@/lib/visibility'
import { types } from '@wailsjs/go/models'

type LogEntry = types.LogEntry
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface UseLogsOptions {
    autoRefresh?: boolean
    refreshInterval?: number
    maxLogs?: number
}

export function useLogs(options: UseLogsOptions = {}) {
    const {
        autoRefresh = true,
        refreshInterval = 1000,
        maxLogs = 500,
    } = options

    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<LogLevel | ''>('')
    const lastIdRef = useRef<number>(0)
    const timerRef    = useRef<number | undefined>(undefined)
    const isPolling   = useRef(false)

    const loadLogs = useCallback(async (initial = false) => {
        try {
            const afterId = initial ? 0 : lastIdRef.current
            const result = await GetLogs(afterId, maxLogs)

            if (result.success && result.data) {
                const newLogs = result.data

                if (newLogs.length > 0) {
                    lastIdRef.current = newLogs[newLogs.length - 1].id

                    setLogs(prev => {
                        const combined = initial ? newLogs : [...prev, ...newLogs]
                        if (combined.length > maxLogs) {
                            return combined.slice(-maxLogs)
                        }
                        return combined
                    })
                }
            }
        } catch (err) {
            console.error('Failed to load logs:', err)
        } finally {
            setLoading(false)
        }
    }, [maxLogs])

    const clear = useCallback(async () => {
        await ClearLogs()
        setLogs([])
        lastIdRef.current = 0
    }, [])

    useEffect(() => {
        setLoading(true)
        void loadLogs(true)
    }, [loadLogs])

    useEffect(() => {
        if (!autoRefresh) return

        let cancelled = false

        const schedule = () => {
            timerRef.current = window.setTimeout(async () => {
                if (cancelled) return

                if (!isAppVisible()) {
                    if (!cancelled) schedule()
                    return
                }

                if (!isPolling.current) {
                    isPolling.current = true
                    try {
                        await loadLogs(false)
                    } finally {
                        isPolling.current = false
                    }
                }
                if (!cancelled) schedule()
            }, refreshInterval)
        }

        schedule()

        return () => {
            cancelled = true
            if (timerRef.current !== undefined) {
                clearTimeout(timerRef.current)
            }
        }
    }, [autoRefresh, refreshInterval, loadLogs])

    const filteredLogs = filter
        ? logs.filter(log => {
            const levels: Record<string, number> = {
                trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5
            }
            const entryLevel = levels[log.level] ?? 0
            const filterLevel = levels[filter] ?? 0
            return entryLevel >= filterLevel
        })
        : logs

    return {
        logs: filteredLogs,
        allLogs: logs,
        loading,
        filter,
        setFilter,
        refresh: () => loadLogs(true),
        clear,
    }
}

export type { LogEntry, LogLevel }
