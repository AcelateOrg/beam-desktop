/**
 * Общие слова и кнопки
 * Упрощённый китайский. Структура повторяет ru/common.ts.
 */
import type ru from "../ru/common"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Кнопки ─────────────────────────────────────────────────────────

    action: {
        save: "保存",
        saving: "正在保存...",
        cancel: "取消",
        copy: "复制",
        copyAll: "全部复制",
        refresh: "刷新",
        clear: "清空",
        search: "搜索",
        searchPlaceholder: "搜索...",
        back: "返回",
        details: "详情",
        more: "更多",
    },

    loading: "加载中...",
    nothingFound: "未找到结果",

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
        seconds: "{{value}} 秒",
        minutes: "{{value}} 分钟",
        hours: "{{h}} 小时",
        hoursMinutes: "{{h}} 小时 {{m}} 分钟",
        secondsAgo: "{{value}} 秒前",
        minutesAgo: "{{value}} 分钟前",
    },

    // ─── Срок подписки ──────────────────────────────────────────────────

    daysLeft: {
        expired: "已过期",
        today: "今天到期",
        count_other: "剩余 {{count}} 天",
    },

    // ─── Панель несохранённых изменений ─────────────────────────────────

    unsaved: {
        message: "有未保存的更改",
    },
} satisfies LocaleShape<typeof ru>
