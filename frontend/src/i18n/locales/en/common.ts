/**
 * Общие слова и кнопки, которые повторяются на разных экранах.
 * Структура повторяет ru/common.ts.
 */
import type ru from "../ru/common"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Кнопки ─────────────────────────────────────────────────────────

    action: {
        save: "Save",
        saving: "Saving...",
        cancel: "Cancel",
        copy: "Copy",
        copyAll: "Copy all",
        refresh: "Refresh",
        clear: "Clear",
        search: "Search",
        searchPlaceholder: "Search...",
        back: "Back",
        details: "Details",
        more: "More",
    },

    loading: "Loading...",
    nothingFound: "Nothing found",

    // ─── Единицы измерения ──────────────────────────────────────────────

    unit: {
        bytes: "B",
        kilobytes: "KB",
        megabytes: "MB",
        gigabytes: "GB",
        terabytes: "TB",
        ms: "{{value}} ms",
        unlimited: "∞",
    },

    sizeShort: {
        bytes: "B",
        kilobytes: "KB",
        megabytes: "MB",
        gigabytes: "GB",
        terabytes: "TB",
    },

    // ─── Длительность ───────────────────────────────────────────────────

    duration: {
        seconds: "{{value}}s",
        minutes: "{{value}} min",
        hours: "{{h}}h",
        hoursMinutes: "{{h}}h {{m}}m",
        secondsAgo: "{{value}}s ago",
        minutesAgo: "{{value}} min ago",
    },

    // ─── Срок подписки ──────────────────────────────────────────────────

    daysLeft: {
        expired: "Expired",
        today: "Expires today",
        count_one: "{{count}} day",
        count_other: "{{count}} days",
    },

    // ─── Панель несохранённых изменений ─────────────────────────────────

    unsaved: {
        message: "You have unsaved changes",
    },
} satisfies LocaleShape<typeof ru>
