/**
 * Настройки → Статистика
 * Структура повторяет ru/settings/analytics.ts.
 */
import type ru from "../../ru/settings/analytics"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Statistics",

    period: {
        today: "Today",
        week: "7 days",
        month: "30 days",
        all: "All time",
    },

    reset: "Reset statistics",

    empty: {
        title: "Nothing here yet",
        description: "Connect to the VPN and your traffic, time and most-used servers will show up here. Data stays on this device only.",
        period: "No data for this period",
    },

    // ─── Плашки с итогами сверху ────────────────────────────────────────

    kpi: {
        downloaded: "Downloaded",
        uploaded: "Uploaded",
        since: "since {{date}}",
        time: "Time on VPN",
        activeDays_one: "{{count}} day connected",
        activeDays_other: "{{count}} days connected",
        sessions: "Sessions",
        average: "{{time}} on average",
    },

    // ─── Блок «Трафик» (столбики) ───────────────────────────────────────

    traffic: {
        title: "Traffic",
        hintHourly: "How much data went through the VPN each hour today.",
        hintDaily: "How much data went through the VPN each day.",
        downloaded: "Downloaded",
        uploaded: "Uploaded",
        empty: "No traffic in this period",
    },

    // ─── Блок «Куда идёт трафик» ────────────────────────────────────────

    routes: {
        title: "Where traffic goes",
        // <b> — жирный фрагмент
        hint: "<b>Via VPN</b>: through the server. <b>Direct</b>: bypasses the VPN based on routing rules (local network, excluded sites and apps).",
        proxy: "Via VPN",
        direct: "Direct",
        proxyCaption: "via VPN",
        blocked: "Blocked",
        blockedCount_one: "{{value}} connection",
        blockedCount_other: "{{value}} connections",
        empty: "Shows up in TUN mode once you connect",
    },

    // ─── Блоки «Профили» и «Конфиги» ────────────────────────────────────

    untitled: "Untitled",
    others: "Others ({{count}})",
    totalCaption: "total",

    profiles: {
        title: "Profiles",
        hint: "How traffic is split between subscriptions and profiles.",
    },

    nodes: {
        title: "Servers",
        hint: "Your most-used servers. Toggle to compare by traffic or by time.",
        byTraffic: "Traffic",
        byTime: "Time",
    },

    // ─── Блок «Приложения» ──────────────────────────────────────────────

    apps: {
        title: "Apps",
        hint: "All app traffic, both via VPN and direct. Only available in TUN mode: in system proxy mode, apps can't be told apart and are grouped under \"Via proxy\".",
        viaProxy: "Via proxy",
        system: "System",
        tunOnly: "To see traffic per app, switch to TUN mode in connection settings.",
        collapse: "Show less",
        more: "{{count}} more · {{size}}",
    },

    // ─── Подтверждение сброса ───────────────────────────────────────────

    resetDialog: {
        title: "Reset statistics?",
        description: "All traffic and time history will be deleted. This can't be undone.",
        confirm: "Reset",
    },

    toast: {
        reset: "Statistics reset",
        resetFailed: "Couldn't reset",
    },
} satisfies LocaleShape<typeof ru>
