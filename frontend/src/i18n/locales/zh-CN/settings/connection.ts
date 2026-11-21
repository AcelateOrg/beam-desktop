/**
 * Настройки → Соединение
 * Упрощённый китайский. Структура повторяет ru/settings/connection.ts.
 */
import type ru from "../../ru/settings/connection"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "连接",

    // ─── Карточка «Режим работы» ────────────────────────────────────────

    mode: {
        title: "运行模式",
        description: "BEAM 转发网络流量的方式",
        tun: {
            title: "TUN 模式",
            description: "推荐。设备上的所有系统流量都会进入隧道。",
        },
        systemProxy: {
            title: "系统代理",
            description: "流量通过系统代理设置转发，部分应用可能会绕过。",
        },
        flakyMac: "macOS 上的系统代理并非处处有效，建议使用 TUN",
        flakyLinux: "Linux 上的系统代理并非处处有效，建议使用 TUN",
        address: "地址",
        port: "端口",
    },

    // ─── Карточка «Защита от утечек» (Kill Switch) ──────────────────────

    killSwitch: {
        title: "防泄漏保护",
        description: "任何流量都不会绕过 VPN",
        row: "VPN 断开时暂停联网，直到重新连接",
        details: "仅在 VPN 意外断开时触发。手动断开后，网络会立即恢复正常。暂停期间 BEAM 和局域网仍可使用。",
        detailsTun: " 在 TUN 模式下还会阻止 DNS 和 IPv6 泄漏。",
        enabled: "Kill Switch 已开启",
        disabled: "Kill Switch 已关闭",
    },

    // ─── Карточка «DNS» ─────────────────────────────────────────────────

    dns: {
        title: "DNS",
        description: "DNS 查询经由 VPN",
        adguardCaption: "屏蔽广告",
        custom: "自定义",
        customCaption: "自己的服务器",
        primary: "首选",
        primaryPlaceholder: "1.1.1.1 或 https://…",
        secondary: "备用",
        secondaryPlaceholder: "可选",
        fromProfile: {
            title: "使用配置文件中的 DNS",
            description: "如果订阅配置里自带 DNS，就使用它。没有自带 DNS 的节点仍使用上面选择的 DNS",
        },
        error: {
            empty: "请填写 DNS 服务器",
            local: "不能使用本地 DNS：查询会在隧道内形成循环",
        },
    },

    // ─── Карточка «Фрагментация» ────────────────────────────────────────

    fragment: {
        title: "分片",
        description: "运营商封锁 VPN 时可能有帮助",
        mode: {
            off: { label: "关闭", caption: "保持原样" },
            standard: { label: "标准", caption: "适合大多数情况" },
            strong: { label: "增强", caption: "标准无效时使用" },
            custom: { label: "自定义", caption: "自己设置参数" },
        },
        packets: "数据包",
        packetsPlaceholder: "tlshello 或 1-3",
        length: "分片大小（字节）",
        interval: "间隔（毫秒）",
        maxSplit: "最大分片数",
        maxSplitPlaceholder: "不限",
        noise: "连接前的噪声",
        noiseAdd: "添加",
        noiseDelay: "毫秒",
        noiseRemove: "删除",
        noiseType: {
            rand: "随机",
            str: "字符串",
            hex: "HEX",
            base64: "Base64",
        },
        direct: {
            title: "直连流量",
            description: "对不走 VPN 的网站也进行分片",
        },
    },

    // ─── Карточка «Мультиплексирование» ─────────────────────────────────

    mux: {
        title: "多路复用",
        description: "在与节点的单个连接中传输多个数据流",
        row: "建立连接更快，需要服务器端支持",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "无法加载设置",
        checkDns: "请检查 DNS",
        saved: "设置已保存",
        savedHint: "重新连接后生效",
        saveFailed: "无法保存设置",
        noData: "无数据",
        sectionSaveFailed: "保存失败",
    },
} satisfies LocaleShape<typeof ru>
