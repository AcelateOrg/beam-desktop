/**
 * Главная: кнопка подключения и всё вокруг неё
 * Упрощённый китайский. Структура повторяет ru/home.ts.
 */
import type ru from "../ru/home"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Подпись под кнопкой подключения ────────────────────────────────

    status: {
        paused: "网络已暂停",
        error: "连接失败",
        switching: "正在切换节点...",
        switched: "节点已切换！",
        connecting: "正在连接...",
        unhealthy: "连接异常",
        connected: "已连接！",
        noProfile: "请添加配置文件",
        idle: "点击连接",
    },

    // ─── Статистика под кнопкой ─────────────────────────────────────────

    stats: {
        unstable: "连接不稳定",
        ping: "延迟",
        time: "时长",
        downloaded: "下载",
        uploaded: "上传",
    },

    // ─── Выбор сервера (выпадающий список) ──────────────────────────────

    nodeSelector: {
        placeholder: "选择节点",
        switching: "正在切换...",
        pinned: "已置顶",
        allServers: "全部节点",
    },

    // ─── Радиальное меню серверов (зажать кнопку подключения) ───────────

    radial: {
        hintHold: "拖向节点",
        hintClick: "选择节点",
        alreadyHere: "当前",
        connect: "连接",
        switch: "切换",
        allServers: "全部节点",
        allShort: "全部",
        more: "还有 {{count}} 个",
    },

    // ─── Плашка Kill Switch ─────────────────────────────────────────────

    killSwitch: {
        failed: "Kill Switch 未能生效：{{error}}",
        title: "Kill Switch 已触发",
        details: "详情",
        tooltip: "目前只有 BEAM 和局域网可以联网。VPN 重新连接后，网络会自动恢复。",
        reason: "原因：{{reason}}",
        description: "VPN 已断开，网络已暂停以防止泄露",
        reconnect: "重新连接",
        restoreInternet: "恢复网络",

        toast: {
            restoreFailed: "无法恢复网络",
            saveFailed: "无法保存",
        },
    },

    // ─── Ошибки подключения ─────────────────────────────────────────────

    toast: {
        disconnectError: "断开连接失败",
    },
} satisfies LocaleShape<typeof ru>
