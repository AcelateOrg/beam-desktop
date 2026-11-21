/**
 * Настройки → Соединение
 * Структура повторяет ru/settings/connection.ts.
 */
import type ru from "../../ru/settings/connection"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Connection",

    // ─── Карточка «Режим работы» ────────────────────────────────────────

    mode: {
        title: "Mode",
        description: "How BEAM routes your network traffic",
        tun: {
            title: "TUN interface",
            description: "Recommended. All system traffic on this device goes through the tunnel.",
        },
        systemProxy: {
            title: "System proxy",
            description: "Traffic goes through the system proxy settings. Some apps may bypass it.",
        },
        flakyMac: "On macOS, the system proxy doesn't work everywhere. TUN is a better choice",
        flakyLinux: "On Linux, the system proxy doesn't work everywhere. TUN is a better choice",
        address: "Address",
        port: "Port",
    },

    // ─── Карточка «Защита от утечек» (Kill Switch) ──────────────────────

    killSwitch: {
        title: "Leak protection",
        description: "Nothing gets past the VPN",
        row: "If the VPN drops, internet is paused until it reconnects",
        details: "Only kicks in if the VPN drops on its own. If you disconnect manually, internet goes back to normal right away. While paused, BEAM and your local network still work.",
        detailsTun: " In TUN mode, it also blocks DNS and IPv6 leaks.",
        enabled: "Kill Switch on",
        disabled: "Kill Switch off",
    },

    // ─── Карточка «DNS» ─────────────────────────────────────────────────

    dns: {
        title: "DNS",
        description: "Queries go through the VPN",
        adguardCaption: "Blocks ads",
        custom: "Custom",
        customCaption: "Your own server",
        primary: "Primary",
        primaryPlaceholder: "1.1.1.1 or https://…",
        secondary: "Secondary",
        secondaryPlaceholder: "optional",
        fromProfile: {
            title: "Use profile DNS",
            description: "If the subscription config has its own DNS, use it. The one selected above is used for servers that don't",
        },
        error: {
            empty: "Enter a DNS server",
            local: "A local DNS server won't work: queries would loop inside the tunnel",
        },
    },

    // ─── Карточка «Фрагментация» ────────────────────────────────────────

    fragment: {
        title: "Fragmentation",
        description: "Helps if your ISP blocks VPNs",
        mode: {
            off: { label: "Off", caption: "No changes" },
            standard: { label: "Standard", caption: "Works for most" },
            strong: { label: "Strong", caption: "If standard fails" },
            custom: { label: "Custom", caption: "Your own settings" },
        },
        packets: "Packets",
        packetsPlaceholder: "tlshello or 1-3",
        length: "Chunk size, bytes",
        interval: "Delay, ms",
        maxSplit: "Max chunks",
        maxSplitPlaceholder: "no limit",
        noise: "Noise before connecting",
        noiseAdd: "Add",
        noiseDelay: "ms",
        noiseRemove: "Remove",
        noiseType: {
            rand: "Random",
            str: "String",
            hex: "HEX",
            base64: "Base64",
        },
        direct: {
            title: "Direct traffic",
            description: "Also fragment sites that bypass the VPN",
        },
    },

    // ─── Карточка «Мультиплексирование» ─────────────────────────────────

    mux: {
        title: "Multiplexing",
        description: "Multiple streams over a single connection to the server",
        row: "Opens connections faster. The server must support it",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "Couldn't load settings",
        checkDns: "Check your DNS settings",
        saved: "Settings saved",
        savedHint: "They'll apply after you reconnect",
        saveFailed: "Couldn't save settings",
        noData: "no data",
        sectionSaveFailed: "couldn't save",
    },
} satisfies LocaleShape<typeof ru>
