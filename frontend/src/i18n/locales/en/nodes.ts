/**
 * Конфигурации (список серверов) и редактор параметров сервера.
 * Структура повторяет ru/nodes.ts.
 */
import type ru from "../ru/nodes"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Configurations",

    // ─── Шапка и группы ─────────────────────────────────────────────────

    header: {
        pingAll: "Ping all",
        pingAllHint: "Ping every server in every category",
        pinging: "Pinging...",
        switching: "Switching...",
    },

    group: {
        selectedHere: "The selected server is in this group",
        ping: "Ping servers in this group",
    },

    // ─── Объявление провайдера над списком ──────────────────────────────

    banner: {
        openLink: "Open the link from this announcement",
        collapse: "Collapse",
        expand: "Show more",
        support: "Support",
        hide: "Hide",
    },

    // ─── Строка сервера ─────────────────────────────────────────────────

    node: {
        timeout: "Timeout",
        latency: "{{value}} ms",
        edited: "edited",
        pinned: "Not updated from the subscription",
        insecure: "Insecure: the server certificate isn't verified, so traffic can be intercepted.",
    },

    contextMenu: {
        selected: "Already selected",
        select: "Select server",
        edit: "Edit configuration",
    },

    empty: {
        title: "No servers",
        description: "Add a profile to see its servers",
    },

    // ─── Редактор параметров сервера ────────────────────────────────────

    config: {
        fallbackTitle: "Configuration",
        subtitle: "Server settings editor",
        notSet: "not set",
        resetToProvider: "Restore the provider's value",
        hint: "Hover the \"?\" next to a field to see the actual parameter name. Changes apply after you reconnect.",
        resetEdits: "Reset changes ({{count}})",
        staleLink:
            "This server is excluded from link export: the original link describes the config before your edits, so sharing it with another client would bring back the old settings.",

        // Разделы редактора
        section: {
            main: "General",
            server: "Server",
            access: "Authentication",
            tls: "TLS",
            reality: "REALITY",
            transport: "Transport",
            core: "Core",
            chain: "Chain",
            subscription: "Subscription",
            other: "Other",
        },

        // «Основное»
        name: {
            label: "Name",
            help: "Only used for display in the list. Doesn't affect the connection.",
            providerName: "provider name: {{name}}",
        },

        // Поля протокола: label — подпись, help — подсказка под «?»
        field: {
            server: { label: "Address", help: "The domain or IP address to connect to." },
            port: { label: "Port", help: "Server port. Almost always 443 for REALITY." },

            uuid: { label: "UUID", help: "User ID for VLESS and VMess." },
            password: { label: "Password", help: "Password for Trojan and Shadowsocks." },
            method: { label: "Cipher", help: "Shadowsocks encryption method, e.g. aes-256-gcm." },
            encryption: { label: "Encryption", help: "VLESS has no encryption of its own, so \"none\" is the normal value." },
            flow: {
                label: "XTLS flow",
                help: "Must match the server. A missing or extra flow will break the connection.",
            },
            packetEncoding: {
                label: "UDP packet encoding",
                help: "How UDP is carried inside the connection. xudp is the usual choice for VLESS.",
            },

            tlsEnabled: { label: "Use TLS", help: "Encrypt the connection with TLS." },
            sni: {
                label: "SNI",
                help: "Server name sent in the handshake. For REALITY, this is the site you're disguising as, e.g. dl.google.com.",
            },
            alpn: { label: "ALPN", help: "Comma-separated protocols, e.g. h2, http/1.1." },
            utls: { label: "Handshake disguise", help: "Look like a real browser at the TLS level (uTLS)." },
            fingerprint: {
                label: "Browser fingerprint",
                help: "Which browser to imitate. Not every fingerprint is accepted by the server. If the connection won't come up, try chrome.",
            },
            insecure: {
                label: "Skip certificate check",
                help: "Disables certificate verification. Insecure, use only for troubleshooting.",
            },

            realityEnabled: {
                label: "Use REALITY",
                help: "Disguise as another website instead of using a regular TLS certificate.",
            },
            publicKey: { label: "Public key", help: "The server's key. Shown as pbk in subscription links." },
            shortId: {
                label: "Short ID",
                help: "Short client identifier. Shown as sid in subscription links.",
            },

            transportType: { label: "Type", help: "ws, grpc, httpupgrade, xhttp. Leave empty for plain TCP." },
            transportPath: { label: "Path", help: "Request path for WebSocket, HTTPUpgrade and XHTTP." },
            xhttpMode: { label: "XHTTP mode", help: "auto, packet-up, stream-up or stream-one. Leave empty for auto." },
            grpcService: { label: "gRPC service", help: "gRPC service name." },
        },

        // «Ядро»
        fragment: {
            label: "Fragmentation",
            help: "When off, this server is never fragmented, even if fragmentation is on in the connection settings.",
        },
        mux: {
            label: "Mux",
            help: "Overrides the global Mux switch. Mux never works with XTLS Vision or Hysteria; with XHTTP, only when set to On.",
            inherit: "use global setting",
            on: "On",
            off: "Off",
        },

        // «Цепочка»
        chain: {
            label: "Via server",
            help: "Traffic goes through the selected server first (entry), then through this one (exit). TCP only: Hysteria2 and WireGuard aren't supported as the exit.",
            none: "None",
        },

        // «Подписка»
        pin: {
            label: "Don't update from subscription",
            help: "When on, the whole config is locked. When off, your edits are applied on top of the provider's data.",
        },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        pingFailed: "Couldn't ping",
        switchFailed: "Couldn't switch server",
        switchError: "Error while switching server",
        openConfigFailed: "Couldn't open the configuration",
        saveConfigFailed: "Couldn't save the configuration",
        saveConfigError: "Error while saving the configuration",
    },
} satisfies LocaleShape<typeof ru>
