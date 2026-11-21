/**
 * Профили: список, добавление, экспорт, параметры.
 * Структура повторяет ru/profiles.ts.
 */
import type ru from "../ru/profiles"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Profiles",
    add: "Add profile",
    empty: "No profiles yet. Add your first one!",
    noProfile: "No profile",

    // ─── Карточка профиля ───────────────────────────────────────────────

    card: {
        active: "Active",
        providerChannel: "Provider channel",
        unlimitedTraffic: "Unlimited traffic",
        unlimited: "Unlimited",
    },

    menu: {
        refresh: "Refresh",
        settings: "Settings",
        export: "Export",
        delete: "Delete",
    },

    deleteDialog: {
        title: "Delete profile?",
        description: "\"{{name}}\" will be permanently deleted. This can't be undone.",
        confirm: "Delete",
    },

    // ─── Окно «Добавить профиль» ────────────────────────────────────────

    addModal: {
        title: "Add profile",

        method: {
            url: { title: "URL", hint: "Subscription link" },
            beam: { title: "BEAM", hint: "Import from file" },
        },

        url: {
            placeholder: "https://... or vless://...",
            hint: "vless://, vmess://, trojan://, ss://, hy2:// or a subscription link (HTTP/HTTPS)",
            insecure: "⚠️ Unencrypted connection",
        },

        file: {
            choose: "Choose a .beam file",
            orDrop: "or drop it here",
            dropHere: "Drop it here",
        },

        submit: "Import",
        submitting: "Importing...",

        error: {
            onlyBeam: "Only .BEAM files are supported",
            importFailed: "Import failed",
            fillFields: "Please fill in the fields",
        },
    },

    // ─── Окно «Экспорт профиля» ─────────────────────────────────────────

    exportModal: {
        title: "Export profile",

        method: {
            beam: { title: "BEAM", hint: ".beam file" },
            raw: { title: "RAW", hint: "Server links" },
            qr: { title: "QR", hint: "For your phone" },
        },

        copySubscription: "Copy subscription link",
        loading: "Loading...",

        qr: {
            subscription: "Subscription link",
            server: "Server {{index}}",
            nothing: "This profile has no subscription link or saved server links, so there's nothing to put in a QR code",
            hintSubscription: "In BEAM on your phone: Add profile → QR code",
            hintServer: "This server only. Scan it in BEAM or any other client",
            copyLink: "Link",
            copyImage: "Copy QR",
            copied: "Copied",
            tooLong: "The link is too long for a QR code. Use BEAM or RAW export instead.",
            ariaLabel: "QR code",
        },

        beam: {
            fileName: "File name",
            download: "Download",
            exporting: "Exporting...",
        },

        raw: {
            none: "This profile has no saved links: it wasn't imported from regular vless/vmess/trojan/ss/hy2 links",
            untitled: "Untitled",
            copy: "Copy",
            copyAll: "Copy all",
        },

        toast: {
            fileSaved: "File saved",
            showInFolder: "Show in folder",
            linkCopied: "Link copied",
            imageCopyFailed: "Couldn't copy the image",
        },
    },

    // ─── Окно «Параметры профиля» ───────────────────────────────────────

    settingsModal: {
        title: "Profile settings",

        autoRefresh: {
            title: "Auto-update subscription",
            disabled: "Off: the subscription won't update on its own",
            ownSchedule: "Updates every {{hours}}h on your schedule",
            providerInterval: "Updates automatically every {{hours}}h",
            providerSchedule: "Updates automatically on the provider's schedule",
        },

        override: {
            title: "Custom schedule",
            active: "Update every {{hours}}h instead of the provider's schedule",
            emptyWithInterval: "Leave empty to use the provider's schedule ({{hours}}h)",
            empty: "Leave empty to use the provider's schedule",
            hoursUnit: "h",
        },

        noSubscription: "This profile has no subscription, so auto-update isn't available.",
        done: "Done",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        refreshing: "Updating profile…",
        refreshed: "Profile updated",
        refreshFailed: "Couldn't update",
        autoRefreshFailed: "Couldn't change auto-update",
        scheduleFailed: "Couldn't change the update schedule",
        exportFailed: "Couldn't export",
        linksFailed: "Couldn't get the links",
        saveFileFailed: "Couldn't save the file",
        saveLinksFailed: "Couldn't save the links",
    },

    // ─── Импорт по внешней ссылке (beam://, файл) ───────────────────────

    externalImport: {
        title: "Add this profile?",
        source: "Source: {{source}}",
        beamLink: "beam:// link",
        confirm: "Add",
        cancel: "Cancel",
        failed: "Couldn't import the Beam link",
    },
} satisfies LocaleShape<typeof ru>
