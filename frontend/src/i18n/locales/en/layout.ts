/**
 * Каркас окна: навигация, сайдбар, обновления приложения.
 * Структура повторяет ru/layout.ts.
 */
import type ru from "../ru/layout"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Навигация ──────────────────────────────────────────────────────
    // title — в сайдбаре, short — в нижней панели узкого окна

    nav: {
        home: { title: "Connection", short: "Home" },
        profiles: { title: "Profiles", short: "Profiles" },
        nodes: { title: "Configurations", short: "Servers" },
        routing: { title: "Routing", short: "Routing" },
        settings: { title: "Settings", short: "Settings" },
    },

    sidebar: {
        toggle: "Toggle sidebar",
    },

    // ─── Обновление приложения ──────────────────────────────────────────

    update: {
        available: "Update available",
        version: "Version {{version}}",
        mandatory: "Required update: this version is no longer supported",
        noChangelog: "No changelog available",
        download: "Download",
        downloading: "Downloading...",
        installAndRestart: "Install and restart",
        linuxTunNote:
            "After the restart, Beam will ask for TUN permissions once. That's expected: capabilities are tied to the binary, and the binary was just replaced with the new version.",

        toast: {
            downloadFailed: "Couldn't download the update",
            installFailed: "Couldn't install the update",
        },
    },
} satisfies LocaleShape<typeof ru>
