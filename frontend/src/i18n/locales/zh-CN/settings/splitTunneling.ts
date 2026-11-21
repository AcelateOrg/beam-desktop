/**
 * Маршрутизация, режим Easy: списки приложений, доменов и IP
 * Упрощённый китайский. Структура повторяет ru/settings/splitTunneling.ts.
 */
import type ru from "../../ru/settings/splitTunneling"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "路由",
    enabled: "已开启",
    disabled: "已关闭",

    mode: {
        exclude: "直连",
        include: "走 VPN",
        excludeHint: "添加的规则走直连，其余流量仍走 VPN。",
        includeHint: "添加的规则走 VPN，其余流量绕过隧道。",
    },

    tabs: {
        apps: "应用",
        domains: "域名",
        ips: "IP 地址",
    },

    // ─── Поле добавления правила ────────────────────────────────────────

    input: {
        processes: "进程",
        processesHint: "从运行中的进程选择",
        file: "文件",
        pickApp: "选择应用（.app）",
        pickExe: "选择 .exe 文件",
        domainHelp: "可以填写具体域名（example.com）、通配符（*.example.com）或顶级域（*.com）。",
        ipPlaceholder: "8.8.8.8 或 10.0.0.0/8",
        ipHelp: "可以添加单个 IP 地址或整个网段。",
        remove: "删除",
    },

    empty: {
        apps: "尚未添加应用",
        domains: "尚未添加域名",
        ips: "尚未添加 IP 地址",
    },

    // ─── Плашка о конфликте с правилами провайдера ──────────────────────
    // Собирается так: intro + target + «: » + список + more + outro

    conflict: {
        title: "与服务商的路由规则冲突",
        intro: "这些规则让服务商要求",
        toBlock: "拦截的流量改走了 VPN",
        toDirect: "直连的流量改走了 VPN",
        more: "，以及另外 {{count}} 项",
        outro: "这可能会暴露节点的 IP 地址。",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "无法加载设置",
        processesFailed: "无法获取进程列表",
        error: "错误",
        saveFailed: "保存失败",
        filePickerFailed: "无法打开文件选择器",
    },
} satisfies LocaleShape<typeof ru>
