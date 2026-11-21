import { useCallback, useEffect } from 'react'
import { EventsOn } from '@wailsjs/runtime/runtime'
import { CheckForUpdates, DownloadUpdate, ApplyUpdate } from '@wailsjs/go/handlers/UpdateHandler'
import type { types } from '@wailsjs/go/models'
import { toast } from 'sonner'

import { useUpdateStore } from '@/stores/updateStore'
import { t } from "@/i18n"

interface UpdateProgressEvent {
    stage: string
    fileName?: string
    bytesDone: number
    bytesTotal: number
}

let updateBridgeStarted = false

function ensureUpdateBridge() {
    if (updateBridgeStarted) {
        return
    }

    updateBridgeStarted = true

    EventsOn('update:available', (info: types.UpdateInfo) => {
        useUpdateStore.getState().setInfo(info)
    })

    EventsOn('update:progress', (progress: UpdateProgressEvent) => {
        const percent = progress.bytesTotal > 0
            ? Math.min(100, Math.round((progress.bytesDone / progress.bytesTotal) * 100))
            : 0
        useUpdateStore.getState().setProgressPercent(percent)
    })
}

export function useUpdate() {
    const {
        available,
        currentVersion,
        latestVersion,
        mandatory,
        releasedAt,
        notes,
        status,
        progressPercent,
        error,
        setStatus,
    } = useUpdateStore()

    useEffect(() => {
        ensureUpdateBridge()
    }, [])

    const checkNow = useCallback(async () => {
        const result = await CheckForUpdates()
        if (result.success && result.data) {
            useUpdateStore.getState().setInfo(result.data)
        }
        return result
    }, [])

    const download = useCallback(async () => {
        setStatus('downloading')
        useUpdateStore.getState().setProgressPercent(0)

        const result = await DownloadUpdate()
        if (result.success) {
            setStatus('ready')
        } else {
            useUpdateStore.getState().setError(result.error || t("layout.update.toast.downloadFailed"))
            toast.error(t("layout.update.toast.downloadFailed"), { description: result.error })
        }
    }, [setStatus])

    const apply = useCallback(async () => {
        const result = await ApplyUpdate()
        if (!result.success) {
            useUpdateStore.getState().setError(result.error || t("layout.update.toast.installFailed"))
            toast.error(t("layout.update.toast.installFailed"), { description: result.error })
        }
    }, [])

    return {
        available,
        currentVersion,
        latestVersion,
        mandatory,
        releasedAt,
        notes,
        status,
        progressPercent,
        error,
        checkNow,
        download,
        apply,
    }
}
