/**
 * Каркас окна: навигация, сайдбар, обновления приложения
 * Упрощённый китайский. Структура повторяет ru/layout.ts.
 */
import type ru from "../ru/layout"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Навигация ──────────────────────────────────────────────────────
    // title — в сайдбаре, short — в нижней панели узкого окна

    nav: {
        home: { title: "连接", short: "首页" },
        profiles: { title: "配置文件", short: "配置" },
        nodes: { title: "节点", short: "节点" },
        routing: { title: "路由", short: "路由" },
        settings: { title: "设置", short: "设置" },
    },

    sidebar: {
        toggle: "展开或收起侧边栏",
    },

    // ─── Обновление приложения ──────────────────────────────────────────

    update: {
        available: "有可用更新",
        version: "版本 {{version}}",
        mandatory: "必须更新：此版本已不再受支持",
        noChangelog: "暂无更新日志",
        download: "下载",
        downloading: "正在下载...",
        installAndRestart: "安装并重启",
        linuxTunNote:
            "重启后，Beam 会请求一次 TUN 权限。这是正常的：权限绑定在程序文件上，而该文件刚刚被替换为新版本。",

        toast: {
            downloadFailed: "无法下载更新",
            installFailed: "无法安装更新",
        },
    },
} satisfies LocaleShape<typeof ru>
