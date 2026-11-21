import { t } from "@/i18n"
import { formatNumber } from "@/i18n/intl"

const SIZE_UNITS = ["bytes", "kilobytes", "megabytes", "gigabytes", "terabytes"] as const

export function formatBytes(bytes: number): string {
    if (bytes === 0) return `0 ${t("common.unit.bytes")}`
    if (bytes < 0) return t("common.unit.unlimited")

    const k = 1024
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), SIZE_UNITS.length - 1)
    const value = formatNumber(parseFloat((bytes / Math.pow(k, i)).toFixed(2)), { maximumFractionDigits: 2 })

    return `${value} ${t(`common.unit.${SIZE_UNITS[i]}`)}`
}

/** Компактный вид для статистики и списка соединений: одна цифра после запятой, до 100. */
export function formatBytesShort(bytes: number): string {
    if (!bytes || bytes < 1) return `0 ${t("common.sizeShort.bytes")}`
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1)
    const value = bytes / Math.pow(1024, i)
    const digits = value >= 100 || i === 0 ? 0 : 1
    const formatted = formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })
    return `${formatted} ${t(`common.sizeShort.${SIZE_UNITS[i]}`)}`
}

export function formatBytesWithUnlimited(bytes: number, limit: number): string {
    if (limit <= 0) return t("common.unit.unlimited")
    return `${formatBytes(bytes)} / ${formatBytes(limit)}`
}

export function formatDuration(seconds: number): string {
    if (seconds < 0) return '--:--'

    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatPing(ping: number): string {
    if (ping < 0) return t("common.unit.ms", { value: "--" })
    return t("common.unit.ms", { value: ping })
}

export function formatDaysLeft(days: number, isExpired?: boolean): string {
    if (isExpired) return t("common.daysLeft.expired")
    if (days < 0) return t("common.unit.unlimited")
    if (days === 0) return t("common.daysLeft.today")
    return t("common.daysLeft.count", { count: days })
}

export function formatTraffic(download: number, upload: number): string {
    return `↓ ${formatBytes(download)} / ↑ ${formatBytes(upload)}`
}
