/**
 * Экраны ошибок и сообщения о сбоях интерфейса.
 * Структура повторяет ru/errors.ts.
 */
import type ru from "../ru/errors"
import type { LocaleShape } from "../../locale-shape"

export default {
    unknown: "Unknown error",

    // ─── Экран «Такой страницы нет» ─────────────────────────────────────

    notFound: {
        title: "Page not found",
        description: "The link may be outdated, or this feature isn't available in your version of BEAM.",
        goHome: "Go home",
    },

    // ─── Экран падения интерфейса ───────────────────────────────────────

    crash: {
        title: "Something went wrong",
        description: "You found a bug! Copy the error and send it to the developers so we can fix it fast.",
        copy: "Copy",
        hint: "This is a bug in the app. Use the button below to go back.",
        goHome: "Back to home",
    },

    // ─── Уведомления после сбоя ─────────────────────────────────────────

    recovered: {
        uiRestarted: {
            title: "The interface restarted after a crash",
            description: "Your VPN connection wasn't affected. If this keeps happening, let the developers know.",
        },
        vpnRestored: {
            title: "Beam recovered from a crash",
            description: "VPN reconnected automatically.",
        },
        vpnNotRestored: {
            title: "Beam restarted after a crash",
            description: "Couldn't reconnect the VPN. Please connect manually.",
        },
    },
} satisfies LocaleShape<typeof ru>
