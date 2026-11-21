/**
 * Маршрутизация, режим Easy: списки приложений, доменов и IP
 * Структура повторяет ru/settings/splitTunneling.ts.
 */
import type ru from "../../ru/settings/splitTunneling"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Routing",
    enabled: "On",
    disabled: "Off",

    mode: {
        exclude: "Direct",
        include: "Via VPN",
        excludeHint: "Listed items go direct, everything else stays on the VPN.",
        includeHint: "Listed items go through the VPN, everything else bypasses the tunnel.",
    },

    tabs: {
        apps: "Apps",
        domains: "Domains",
        ips: "IP addresses",
    },

    // ─── Поле добавления правила ────────────────────────────────────────

    input: {
        processes: "Processes",
        processesHint: "Pick from running processes",
        file: "File",
        pickApp: "Choose an app (.app)",
        pickExe: "Choose an .exe file",
        domainHelp: "You can add a specific domain (example.com), a wildcard (*.example.com) or a whole zone (*.com).",
        ipPlaceholder: "8.8.8.8 or 10.0.0.0/8",
        ipHelp: "You can add a single IP address or a whole subnet.",
        remove: "Remove",
    },

    empty: {
        apps: "No apps added",
        domains: "No domains added",
        ips: "No IP addresses added",
    },

    // ─── Плашка о конфликте с правилами провайдера ──────────────────────
    // Собирается так: intro + target + «: » + список + more + outro

    conflict: {
        title: "Conflicts with provider routing",
        intro: "These rules send traffic through the VPN that your provider wanted",
        toBlock: " blocked",
        toDirect: " sent direct",
        more: " and {{count}} more",
        outro: "This may expose server IP addresses.",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "Couldn't load settings",
        processesFailed: "Couldn't load running processes",
        error: "Error",
        saveFailed: "Couldn't save",
        filePickerFailed: "Couldn't open the file picker",
    },
} satisfies LocaleShape<typeof ru>
