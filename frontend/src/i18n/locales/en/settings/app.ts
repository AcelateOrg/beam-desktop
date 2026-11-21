/**
 * Настройки → Приложение
 * Структура повторяет ru/settings/app.ts.
 */
import type ru from "../../ru/settings/app"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "App",

    // ─── Карточка «Язык» ────────────────────────────────────────────────

    language: {
        title: "Language",
        description: "BEAM interface language",
        unavailable: "Translation coming soon",
    },

    // ─── Карточка «Поведение» ───────────────────────────────────────────

    behavior: {
        title: "Behavior",
        description: "How the app starts and runs on your system",

        launchOnStartup: {
            title: "Launch at startup",
            description: "Start the app automatically when you sign in.",
            descriptionMacos: "Not available on macOS.",
        },
        autoConnect: {
            title: "Connect automatically",
            description: "Connect with your last profile right after launch.",
        },
        subscriptionAutoRefresh: {
            title: "Auto-update subscriptions",
            description: "Periodically check subscription links for server updates.",
        },
        minimizeToTray: {
            title: "Minimize to tray",
            description: "Hide the window in the notification area instead of closing it.",
            descriptionMacos: "Handled by the system via the Dock.",
        },
    },

    // ─── Карточка «Пинг и диагностика» ──────────────────────────────────

    ping: {
        title: "Ping and diagnostics",
        description: "How server latency and availability are measured",

        nodeMode: {
            title: "Server check",
            description: "How servers in the list are checked before connecting.",
            auto: "Auto (by protocol)",
            protocol: "By protocol",
            tcp: "TCP ping",
        },
        connectionMode: {
            title: "Connection ping",
            description: "HTTP measures the real end-to-end tunnel, TCP measures the direct route.",
            http: "HTTP (tunnel)",
            tcp: "TCP (direct)",
        },
    },

    // ─── Карточка «Идентификация (HWID)» ────────────────────────────────

    hwid: {
        title: "Device ID (HWID)",
        description: "Used by servers and subscriptions with device limits",

        send: {
            title: "Send HWID",
            description: "Include a unique device hash in subscription requests.",
        },
        value: {
            title: "HWID value",
            description: "Mode: {{mode}}",
            configure: "Configure",
        },
        mode: {
            disabled: "Off",
            manual: "Manual",
            auto: "Automatic",
        },
    },

    // Отдельный экран HWID (src/pages/settings/Hwid.tsx), открывается кнопкой «Настроить»
    hwidPage: {
        title: "HWID",
        cardTitle: "Device ID",
        cardDescription: "A random UUID that Beam sends when updating subscriptions. It isn't tied to your hardware.",
        mode: "Mode",
        modeAuto: "Generated automatically",
        modeManual: "Set manually",
        value: "Value",
        regenerate: "Generate new",
        loadFailed: "Couldn't load HWID settings",
        saveFailed: "Couldn't save HWID",
    },

    // ─── Карточка «Служебные действия» ──────────────────────────────────

    service: {
        title: "Maintenance",
        description: "Reset tips and the first-run experience",

        onboarding: {
            title: "Welcome screen",
            description: "Run the step-by-step setup wizard again.",
            action: "Run again",
            resetting: "Resetting...",
        },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "Couldn't load app settings",
        saveError: "Error while saving",
        saved: "Settings saved",
        saveFailed: "Couldn't save app settings",
        onboardingResetFailed: "Couldn't reset onboarding",
    },
} satisfies LocaleShape<typeof ru>
