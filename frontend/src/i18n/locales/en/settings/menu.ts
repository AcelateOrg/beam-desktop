/**
 * Настройки → главный экран со списком разделов
 * Структура повторяет ru/settings/menu.ts.
 */
import type ru from "../../ru/settings/menu"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Settings",

    appearance: {
        title: "Appearance",
        description: "Theme, font, corner radius",
    },
    app: {
        title: "App",
        description: "Language, startup, tray, ping, HWID",
    },
    connection: {
        title: "Connection",
        description: "Mode, DNS, fragmentation",
    },
    analytics: {
        title: "Statistics",
        description: "Traffic, time, servers and apps",
    },
    logs: {
        title: "Logs",
        description: "Xray core activity log",
    },
    developer: {
        title: "Developer",
        description: "Development and debugging tools",
    },
    about: {
        title: "About",
        description: "Version and info",
    },
} satisfies LocaleShape<typeof ru>
