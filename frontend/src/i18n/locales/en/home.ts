/**
 * Главная: кнопка подключения и всё вокруг неё.
 * Структура повторяет ru/home.ts.
 */
import type ru from "../ru/home"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Подпись под кнопкой подключения ────────────────────────────────

    status: {
        paused: "Internet paused",
        error: "Connection failed",
        switching: "Switching server...",
        switched: "Server switched!",
        connecting: "Connecting...",
        unhealthy: "Connection issues",
        connected: "You're connected!",
        noProfile: "Add a profile",
        idle: "Tap to connect",
    },

    // ─── Статистика под кнопкой ─────────────────────────────────────────

    stats: {
        unstable: "Unstable connection",
        ping: "Ping",
        time: "Time",
        downloaded: "Down",
        uploaded: "Up",
    },

    // ─── Выбор сервера (выпадающий список) ──────────────────────────────

    nodeSelector: {
        placeholder: "Choose a server",
        switching: "Switching...",
        pinned: "Pinned",
        allServers: "All servers",
    },

    // ─── Радиальное меню серверов (зажать кнопку подключения) ───────────

    radial: {
        hintHold: "Drag to a server",
        hintClick: "Pick a server",
        alreadyHere: "current",
        connect: "connect",
        switch: "switch",
        allServers: "All servers",
        allShort: "All",
        more: "{{count}} more",
    },

    // ─── Плашка Kill Switch ─────────────────────────────────────────────

    killSwitch: {
        failed: "Kill Switch failed: {{error}}",
        title: "Kill Switch is on",
        details: "Details",
        tooltip: "Only BEAM and your local network can reach the internet. Everything else comes back as soon as the VPN reconnects.",
        reason: "Reason: {{reason}}",
        description: "The VPN dropped, so internet is paused to prevent leaks",
        reconnect: "Reconnect",
        restoreInternet: "Restore internet",

        toast: {
            restoreFailed: "Couldn't restore internet",
            saveFailed: "Couldn't save",
        },
    },

    // ─── Ошибки подключения ─────────────────────────────────────────────

    toast: {
        disconnectError: "Couldn't disconnect",
    },
} satisfies LocaleShape<typeof ru>
