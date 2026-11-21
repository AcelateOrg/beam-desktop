/**
 * Общие слова и кнопки, которые повторяются на разных экранах.
 * Фарси (RTL). Структура повторяет ru/common.ts.
 */
import type ru from "../ru/common"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Кнопки ─────────────────────────────────────────────────────────

    action: {
        save: "ذخیره",
        saving: "در حال ذخیره...",
        cancel: "لغو",
        copy: "کپی",
        copyAll: "کپی همه",
        refresh: "بازخوانی",
        clear: "پاک کردن",
        search: "جستجو",
        searchPlaceholder: "جستجو...",
        back: "بازگشت",
        details: "جزئیات",
        more: "بیشتر",
    },

    loading: "در حال بارگذاری...",
    nothingFound: "چیزی پیدا نشد",

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
        seconds: "{{value}} ثانیه",
        minutes: "{{value}} دقیقه",
        hours: "{{h}} ساعت",
        hoursMinutes: "{{h}} ساعت و {{m}} دقیقه",
        secondsAgo: "{{value}} ثانیه پیش",
        minutesAgo: "{{value}} دقیقه پیش",
    },

    // ─── Срок подписки ──────────────────────────────────────────────────

    daysLeft: {
        expired: "منقضی شده",
        today: "امروز منقضی می‌شود",
        count_one: "{{count}} روز",
        count_other: "{{count}} روز",
    },

    // ─── Панель несохранённых изменений ─────────────────────────────────

    unsaved: {
        message: "تغییرات ذخیره‌نشده دارید",
    },
} satisfies LocaleShape<typeof ru>
