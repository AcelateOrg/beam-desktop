/**
 * Профили: список, добавление, экспорт, параметры
 * Упрощённый китайский. Структура повторяет ru/profiles.ts.
 */
import type ru from "../ru/profiles"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "配置文件",
    add: "添加配置文件",
    empty: "还没有配置文件，先添加一个吧！",
    noProfile: "无配置文件",

    // ─── Карточка профиля ───────────────────────────────────────────────

    card: {
        active: "使用中",
        providerChannel: "服务商频道",
        unlimitedTraffic: "不限流量",
        unlimited: "不限",
    },

    menu: {
        refresh: "更新",
        settings: "设置",
        export: "导出",
        delete: "删除",
    },

    deleteDialog: {
        title: "删除配置文件？",
        description: "“{{name}}”将被永久删除，此操作无法撤销。",
        confirm: "删除",
    },

    // ─── Окно «Добавить профиль» ────────────────────────────────────────

    addModal: {
        title: "添加配置文件",

        method: {
            url: { title: "URL", hint: "订阅链接" },
            beam: { title: "BEAM", hint: "从文件导入" },
        },

        url: {
            placeholder: "https://... 或 vless://...",
            hint: "vless://、vmess://、trojan://、ss://、hy2:// 或订阅链接（HTTP/HTTPS）",
            insecure: "⚠️ 连接未加密",
        },

        file: {
            choose: "选择 .beam 文件",
            orDrop: "或拖放到这里",
            dropHere: "松开以导入",
        },

        submit: "导入",
        submitting: "正在导入...",

        error: {
            onlyBeam: "仅支持 .BEAM 文件",
            importFailed: "导入失败",
            fillFields: "请填写必填项",
        },
    },

    // ─── Окно «Экспорт профиля» ─────────────────────────────────────────

    exportModal: {
        title: "导出配置文件",

        method: {
            beam: { title: "BEAM", hint: ".beam 文件" },
            raw: { title: "RAW", hint: "节点链接" },
            qr: { title: "二维码", hint: "用于手机" },
        },

        copySubscription: "复制订阅链接",
        loading: "加载中...",

        qr: {
            subscription: "订阅链接",
            server: "节点 {{index}}",
            nothing: "此配置文件既没有订阅链接，也没有保存的节点链接，无法生成二维码",
            hintSubscription: "在手机版 BEAM 中：添加配置文件 → 二维码",
            hintServer: "仅包含此节点，可在 BEAM 或其他客户端中扫描",
            copyLink: "链接",
            copyImage: "复制二维码",
            copied: "已复制",
            tooLong: "链接太长，无法生成二维码。请改用 BEAM 或 RAW 导出。",
            ariaLabel: "二维码",
        },

        beam: {
            fileName: "文件名",
            download: "下载",
            exporting: "正在导出...",
        },

        raw: {
            none: "此配置文件没有保存的链接：它不是通过普通的 vless/vmess/trojan/ss/hy2 链接导入的",
            untitled: "未命名",
            copy: "复制",
            copyAll: "全部复制",
        },

        toast: {
            fileSaved: "文件已保存",
            showInFolder: "在文件夹中显示",
            linkCopied: "链接已复制",
            imageCopyFailed: "无法复制图片",
        },
    },

    // ─── Окно «Параметры профиля» ───────────────────────────────────────

    settingsModal: {
        title: "配置文件设置",

        autoRefresh: {
            title: "自动更新订阅",
            disabled: "已关闭：订阅不会自动更新",
            ownSchedule: "按自定义计划每 {{hours}} 小时更新一次",
            providerInterval: "每 {{hours}} 小时自动更新一次",
            providerSchedule: "按服务商的计划自动更新",
        },

        override: {
            title: "自定义计划",
            active: "每 {{hours}} 小时更新一次，不使用服务商的计划",
            emptyWithInterval: "留空则使用服务商的计划（{{hours}} 小时）",
            empty: "留空则使用服务商的计划",
            hoursUnit: "小时",
        },

        noSubscription: "此配置文件没有订阅，无法自动更新。",
        done: "完成",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        refreshing: "正在更新配置文件…",
        refreshed: "配置文件已更新",
        refreshFailed: "更新失败",
        autoRefreshFailed: "无法更改自动更新设置",
        scheduleFailed: "无法更改更新计划",
        exportFailed: "导出失败",
        linksFailed: "无法获取链接",
        saveFileFailed: "无法保存文件",
        saveLinksFailed: "无法保存链接",
    },

    // ─── Импорт по внешней ссылке (beam://, файл) ───────────────────────

    externalImport: {
        title: "添加此配置文件？",
        source: "来源：{{source}}",
        beamLink: "beam:// 链接",
        confirm: "添加",
        cancel: "取消",
        failed: "无法导入 Beam 链接",
    },
} satisfies LocaleShape<typeof ru>
