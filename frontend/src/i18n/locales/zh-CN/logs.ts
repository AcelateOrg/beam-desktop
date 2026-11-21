/**
 * Логи и активные соединения. Строки логов Xray не переводятся
 * Упрощённый китайский. Структура повторяет ru/logs.ts.
 */
import type ru from "../ru/logs"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "日志",

    tabs: {
        logs: "日志",
        connections: "连接",
    },

    // ─── Панель управления ──────────────────────────────────────────────

    toolbar: {
        recording: "记录日志",
        levelHint: "内核日志的详细程度",
        levelPlaceholder: "日志级别",
        levelShort: "级别",
        openFolder: "日志文件夹",
        openFolderHint: "打开日志文件夹（crash.log 也在这里，可用于报告问题）",
        show: "显示",
        all: "全部",
        rawView: "原始视图",
        autoScroll: "自动滚动",
        autoScrollOn: "自动滚动已开启",
        autoScrollOff: "自动滚动已关闭",
        showRaw: "显示原始日志",
        showParsed: "显示解析结果",
    },

    // Уровень, с которым ядро пишет логи
    level: {
        off: "关闭",
        error: "仅错误",
        info: "常规",
        debug: "详细",
    },

    // ─── Пустые состояния ───────────────────────────────────────────────

    empty: {
        logs: "暂无日志",
        connections: "没有活动连接",
        loggingOff: "日志记录已关闭",
        loggingOffHint: "在下方开启后即可查看运行情况",
        enableLogging: "开启日志",
    },

    tooSmall: {
        title: "窗口太小",
        description: "请放大窗口以查看日志",
    },

    raw: {
        closed: "（已关闭）",
    },

    // ─── Вкладка «Соединения» ───────────────────────────────────────────

    connections: {
        summary: {
            apps_other: "<b>{{count}}</b> 个应用",
            connections_other: "<b>{{count}}</b> 个连接",
            noPerApp: "无法按应用区分",
            noPerAppHint: "系统代理模式下无法区分各个程序。切换到 TUN 模式即可查看每个应用。",
        },

        empty: "没有活动连接",
        emptyHint: "连接后，这里会显示各个应用及其连接",
        noConnections: "没有连接",

        // Группы без имени процесса
        system: "系统",
        all: "全部连接",

        group: {
            idle: "无活动",
            active: "{{count}} 个活动",
        },

        section: {
            active: "活动中",
            closed: "最近关闭",
            of: "共 {{total}} 个",
            closedHint: "短请求只持续几分之一秒，所以会在这里多保留 2 分钟。",
        },

        row: {
            closedAgo: "{{ago}}关闭",
            close: "断开",
        },

        detail: {
            closeAll: "全部断开",
            speed: "速度",
            downloaded: "已下载",
            uploaded: "已上传",
            uptime: "持续时间",
        },

        // Куда ушло соединение
        route: {
            vpn: "VPN",
            direct: "直连",
            block: "拦截",
            dns: "DNS",
            mixed: "VPN + 直连",
        },

        // Почему соединение ушло туда, куда ушло
        rule: {
            user: "规则：{{label}}",
            routing: "路由规则",
            app: "应用规则",
            lan: "局域网",
            dns: "DNS 查询",
            final: "默认",
        },

        // Размеры и скорость в этой вкладке
        unit: {
            perSecond: "{{value}}/s",
        },
    },

    // ─── Выбор запущенного процесса ─────────────────────────────────────

    processPicker: {
        title: "正在运行的进程",
        refresh: "刷新列表",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        toggleFailed: "无法切换日志记录",
        levelFailed: "无法更改日志级别",
        openFolderFailed: "无法打开日志文件夹",
        closeFailed: "无法断开连接",
        closedMany: "已断开 {{count}} 个连接",
        connectionsFailed: "无法获取连接列表",
        processesFailed: "无法获取进程列表",
    },
} satisfies LocaleShape<typeof ru>
