/**
 * Настройки → Статистика
 * Упрощённый китайский. Структура повторяет ru/settings/analytics.ts.
 */
import type ru from "../../ru/settings/analytics"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "统计",

    period: {
        today: "今天",
        week: "7 天",
        month: "30 天",
        all: "全部时间",
    },

    reset: "重置统计",

    empty: {
        title: "暂无数据",
        description: "连接 VPN 后，流量、时长和最常用的节点会显示在这里。数据只保存在本设备上。",
        period: "此时间段内没有数据",
    },

    // ─── Плашки с итогами сверху ────────────────────────────────────────

    kpi: {
        downloaded: "下载",
        uploaded: "上传",
        since: "自 {{date}} 起",
        time: "VPN 使用时长",
        activeDays_other: "{{count}} 天有连接",
        sessions: "连接次数",
        average: "平均 {{time}}",
    },

    // ─── Блок «Трафик» (столбики) ───────────────────────────────────────

    traffic: {
        title: "流量",
        hintHourly: "今天每小时经由 VPN 的数据量。",
        hintDaily: "每天经由 VPN 的数据量。",
        downloaded: "下载",
        uploaded: "上传",
        empty: "此时间段内没有流量",
    },

    // ─── Блок «Куда идёт трафик» ────────────────────────────────────────

    routes: {
        title: "流量去向",
        // <b> — жирный фрагмент
        hint: "<b>走 VPN</b>：经由节点。<b>直连</b>：按路由规则绕过 VPN（局域网、排除的网站和应用）。",
        proxy: "走 VPN",
        direct: "直连",
        proxyCaption: "经由 VPN",
        blocked: "已拦截",
        blockedCount_other: "{{value}} 个连接",
        empty: "在 TUN 模式下连接后显示",
    },

    // ─── Блоки «Профили» и «Конфиги» ────────────────────────────────────

    untitled: "未命名",
    others: "其他（{{count}}）",
    totalCaption: "总计",

    profiles: {
        title: "配置文件",
        hint: "流量在各订阅和配置文件之间的分布。",
    },

    nodes: {
        title: "节点",
        hint: "最常用的节点。可切换按流量或按时长对比。",
        byTraffic: "流量",
        byTime: "时长",
    },

    // ─── Блок «Приложения» ──────────────────────────────────────────────

    apps: {
        title: "应用",
        hint: "各程序的全部流量，包括走 VPN 和直连的。仅在 TUN 模式下可见：系统代理模式下无法区分应用，统一计入“经由代理”。",
        viaProxy: "经由代理",
        system: "系统",
        tunOnly: "要查看各应用的流量，请在连接设置中开启 TUN 模式。",
        collapse: "收起",
        more: "还有 {{count}} 个 · {{size}}",
    },

    // ─── Подтверждение сброса ───────────────────────────────────────────

    resetDialog: {
        title: "重置统计？",
        description: "所有流量和时长记录都将被删除，且无法撤销。",
        confirm: "重置",
    },

    toast: {
        reset: "统计已重置",
        resetFailed: "重置失败",
    },
} satisfies LocaleShape<typeof ru>
