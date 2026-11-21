/**
 * Общие слова и кнопки, которые повторяются на разных экранах.
 * Турецкий. Структура повторяет ru/common.ts.
 */
import type ru from "../ru/common"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Кнопки ─────────────────────────────────────────────────────────

    action: {
        save: "Kaydet",
        saving: "Kaydediliyor...",
        cancel: "İptal",
        copy: "Kopyala",
        copyAll: "Tümünü kopyala",
        refresh: "Yenile",
        clear: "Temizle",
        search: "Ara",
        searchPlaceholder: "Ara...",
        back: "Geri",
        details: "Ayrıntılar",
        more: "Diğer",
    },

    loading: "Yükleniyor...",
    nothingFound: "Sonuç bulunamadı",

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
        seconds: "{{value}} sn",
        minutes: "{{value}} dk",
        hours: "{{h}} sa",
        hoursMinutes: "{{h}} sa {{m}} dk",
        secondsAgo: "{{value}} sn önce",
        minutesAgo: "{{value}} dk önce",
    },

    // ─── Срок подписки ──────────────────────────────────────────────────

    daysLeft: {
        expired: "Süresi doldu",
        today: "Bugün sona eriyor",
        count_one: "{{count}} gün",
        count_other: "{{count}} gün",
    },

    // ─── Панель несохранённых изменений ─────────────────────────────────

    unsaved: {
        message: "Kaydedilmemiş değişiklikler var",
    },
} satisfies LocaleShape<typeof ru>
