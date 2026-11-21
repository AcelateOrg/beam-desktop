/**
 * Логи и активные соединения.
 * Структура повторяет ru/logs.ts. Строки логов ядра Xray не переводятся.
 */
import type ru from "../ru/logs"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Logs",

    tabs: {
        logs: "Logs",
        connections: "Connections",
    },

    // ─── Панель управления ──────────────────────────────────────────────

    toolbar: {
        recording: "Logging",
        levelHint: "How detailed the core logs are",
        levelPlaceholder: "Log level",
        levelShort: "Level",
        openFolder: "Logs folder",
        openFolderHint: "Open the logs folder (crash.log is there too, for bug reports)",
        show: "Show",
        all: "All",
        rawView: "Raw view",
        autoScroll: "Auto-scroll",
        autoScrollOn: "Auto-scroll on",
        autoScrollOff: "Auto-scroll off",
        showRaw: "Show raw",
        showParsed: "Show parsed",
    },

    // Уровень, с которым ядро пишет логи
    level: {
        off: "Off",
        error: "Errors only",
        info: "Normal",
        debug: "Verbose",
    },

    // ─── Пустые состояния ───────────────────────────────────────────────

    empty: {
        logs: "No logs yet",
        connections: "No active connections",
        loggingOff: "Logging is off",
        loggingOffHint: "Turn it on below to see what's going on",
        enableLogging: "Turn on logging",
    },

    tooSmall: {
        title: "Window is too small",
        description: "Make the window bigger to view logs",
    },

    raw: {
        closed: "(closed)",
    },

    // ─── Вкладка «Соединения» ───────────────────────────────────────────

    connections: {
        summary: {
            apps_one: "<b>{{count}}</b> app",
            apps_other: "<b>{{count}}</b> apps",
            connections_one: "<b>{{count}}</b> connection",
            connections_other: "<b>{{count}}</b> connections",
            noPerApp: "No per-app breakdown",
            noPerAppHint: "In system proxy mode, apps can't be told apart. Switch to TUN to see each app.",
        },

        empty: "No active connections",
        emptyHint: "Connect, and your apps and their connections will show up here",
        noConnections: "No connections",

        // Группы без имени процесса
        system: "System",
        all: "All connections",

        group: {
            idle: "idle",
            active: "{{count}} active",
        },

        section: {
            active: "Active",
            closed: "Recently closed",
            of: "of {{total}}",
            closedHint: "Short requests last a fraction of a second, so they stay visible here for 2 more minutes.",
        },

        row: {
            closedAgo: "closed {{ago}}",
            close: "Close",
        },

        detail: {
            closeAll: "Close all",
            speed: "Speed",
            downloaded: "Downloaded",
            uploaded: "Uploaded",
            uptime: "Uptime",
        },

        // Куда ушло соединение
        route: {
            vpn: "VPN",
            direct: "Direct",
            block: "Blocked",
            dns: "DNS",
            mixed: "VPN + direct",
        },

        // Почему соединение ушло туда, куда ушло
        rule: {
            user: "Rule: {{label}}",
            routing: "Routing rule",
            app: "App rule",
            lan: "Local network",
            dns: "DNS query",
            final: "Default",
        },

        // Размеры и скорость в этой вкладке
        unit: {
            perSecond: "{{value}}/s",
        },
    },

    // ─── Выбор запущенного процесса ─────────────────────────────────────

    processPicker: {
        title: "Running processes",
        refresh: "Refresh list",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        toggleFailed: "Couldn't toggle logging",
        levelFailed: "Couldn't change the log level",
        openFolderFailed: "Couldn't open the logs folder",
        closeFailed: "Couldn't close the connection",
        closedMany: "Closed {{count}} connections",
        connectionsFailed: "Couldn't load connections",
        processesFailed: "Couldn't load running processes",
    },
} satisfies LocaleShape<typeof ru>
