/**
 * Настройки → Для разработчиков (скрытый раздел)
 * Структура повторяет ru/settings/developer.ts.
 */
import type ru from "../../ru/settings/developer"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Developer",

    // ─── Эмуляция статуса VPN ───────────────────────────────────────────

    emulate: {
        title: "Emulate VPN status",
        description: "Changes how the connect button looks without a real VPN. Handy for testing animations.",
        current: "Current status:",
        note: "No real VPN connection is made or dropped.",
        status: {
            disconnected: "Disconnected",
            connecting: "Connecting...",
            connected: "Connected",
            connectedNoInternet: "No internet",
            disconnecting: "Disconnecting...",
            error: "Error",
        },
    },

    // ─── Симуляция платформы ────────────────────────────────────────────

    platform: {
        title: "Simulate platform",
        description: "Shows the interface of another OS: window buttons, logo. Applies instantly.",
        current: "Current platform:",
        auto: "Auto",
        note: "Clicking the active button again resets to auto-detect, i.e. the platform reported by Go.",
    },

    // ─── Проверка уведомлений ───────────────────────────────────────────
    // button.* — подписи кнопок, sample.* — текст самих тестовых тостов

    toastDemo: {
        title: "Notifications",
        description: "Shows every kind of toast, to check styling, stacking and buttons.",
        button: {
            success: "Success",
            error: "Error",
            warning: "Warning",
            info: "Info",
            plain: "No icon",
            loadingSuccess: "Loading → success",
            loadingError: "Loading → error",
            actions: "With buttons",
            long: "Long text",
            burst: "Burst",
            dismissAll: "Dismiss all",
        },
        sample: {
            profileUpdated: "Profile updated",
            serverSwitchFailed: "Couldn't switch server",
            subscriptionExpiring: "Subscription expires in 3 days",
            subscriptionExpiringHint: "Renew it with your provider to keep access.",
            updateAvailable: "Update 2.0.2 available",
            linkCopied: "Link copied",
            updatingProfile: "Updating profile…",
            updateFailed: "Couldn't update",
            updateFailedHint: "The subscription server returned 502",
            addProfile: "Add this profile?",
            addProfileSource: "Source: example.com",
            add: "Add",
            profileAdded: "Profile added",
            longTitle: "Couldn't save the configuration for a server with a really long name",
            pingFailed: "Couldn't ping",
        },
    },

    // ─── Ядро Xray ──────────────────────────────────────────────────────

    core: {
        title: "Xray core",
        description: "Diagnostics and config inspection.",
        logs: {
            title: "Core logs",
            description: "Writes the Xray core log to memory and core.log. Turning it off frees memory right away, which is the most noticeable way to save it.",
        },
        tunLogs: {
            title: "TUN logs",
            description: "Extended tunnel diagnostics (beam-debug) and log files in logs/. Off by default, so nothing gets written anywhere.",
        },
        trace: {
            title: "TRACE logging",
            description: "Enables the TRACE level for Xray. Applies on the next connection.",
        },
        reality: {
            title: "REALITY debug logs",
            description: "REALITY handshake details for troubleshooting. Applies on the next connection.",
        },
        config: {
            title: "Current config",
            description: "Shows the JSON config of the active profile, ready to copy.",
            open: "Open",
            dialogTitle: "Xray config",
            noProfile: "No active profile",
            close: "Close",
        },
    },

    // ─── Опасная зона ───────────────────────────────────────────────────

    danger: {
        title: "Danger zone",
        description: "Irreversible actions with app data.",
        reset: {
            title: "Reset all data",
            description: "Deletes all profiles and settings. Developer mode stays on.",
            button: "Reset",
        },
        disable: {
            title: "Turn off developer mode",
            description: "Hides this section from settings. To bring it back, click the logo 10 times in About.",
            button: "Turn off",
        },
    },

    resetDialog: {
        title: "Reset all data",
        // <b> — жирный фрагмент
        description: "This will delete <b>all profiles</b> and reset the app settings. This can't be undone.",
        resetting: "Resetting...",
        confirm: "Yes, reset",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        coreLogsFailed: "Couldn't toggle core logs",
        tunLogsFailed: "Couldn't toggle TUN logs",
        logLevelFailed: "Couldn't change the log level",
        realityFailed: "Couldn't toggle REALITY debug logs",
        emulateFailed: "Emulation failed",
        resetFailed: "Reset failed",
    },
} satisfies LocaleShape<typeof ru>
