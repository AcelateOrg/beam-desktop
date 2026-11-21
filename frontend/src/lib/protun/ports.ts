import { t } from "@/i18n"
// Ports card values: a single port ("443") or an inclusive range ("1000-2000").

const MAX_PORT = 65535

function parsePort(raw: string): number | null {
    if (!/^\d{1,5}$/.test(raw)) return null
    const port = Number(raw)
    return port >= 1 && port <= MAX_PORT ? port : null
}

// normalizePort returns the canonical form of a port or range, or null when
// the value is not one (the backend drops such values anyway, the card just
// refuses them up front).
export function normalizePort(raw: string): string | null {
    const value = raw.trim().replace(/[–—]/g, "-").replace(/\s+/g, "")
    const range = value.split("-")
    if (range.length === 1) {
        const port = parsePort(range[0])
        return port === null ? null : String(port)
    }
    if (range.length !== 2) return null
    const from = parsePort(range[0])
    const to = parsePort(range[1])
    if (from === null || to === null || from > to) return null
    return from === to ? String(from) : `${from}-${to}`
}

const WELL_KNOWN: Record<string, string> = {
    "20-21": "FTP",
    "21": "FTP",
    "22": "SSH",
    "23": "Telnet",
    "25": "SMTP",
    "53": "DNS",
    "80": "HTTP",
    "110": "POP3",
    "123": "NTP",
    "143": "IMAP",
    "443": "HTTPS",
    "465": "SMTPS",
    "587": "SMTP",
    "993": "IMAPS",
    "995": "POP3S",
    "1194": "OpenVPN",
    "3389": "RDP",
    "3478": "STUN",
    "5060": "SIP",
    "6881-6889": "BitTorrent",
    "8080": "HTTP",
    "8443": "HTTPS",
    "25565": "Minecraft",
    "27015-27050": "Steam",
    "51820": "WireGuard",
}

// portHint names well-known ports so a bare number is easier to read.
export function portHint(item: string): string | undefined {
    if (WELL_KNOWN[item]) return WELL_KNOWN[item]
    return item.includes("-") ? t("protun.kind.ports.range") : undefined
}

// formatPort shows ranges with an en dash.
export function formatPort(item: string): string {
    return item.replace("-", "–")
}
