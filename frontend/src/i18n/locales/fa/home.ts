/**
 * Главная: кнопка подключения и всё вокруг неё.
 * Фарси (RTL). Структура повторяет ru/home.ts.
 */
import type ru from "../ru/home"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Подпись под кнопкой подключения ────────────────────────────────

    status: {
        paused: "اینترنت متوقف شده",
        error: "اتصال ناموفق بود",
        switching: "در حال تغییر سرور...",
        switched: "سرور تغییر کرد!",
        connecting: "در حال اتصال...",
        unhealthy: "مشکل در اتصال",
        connected: "متصل هستید!",
        noProfile: "یک پروفایل اضافه کنید",
        idle: "برای اتصال بزنید",
    },

    // ─── Статистика под кнопкой ─────────────────────────────────────────

    stats: {
        unstable: "اتصال ناپایدار",
        ping: "پینگ",
        time: "زمان",
        downloaded: "دانلود",
        uploaded: "آپلود",
    },

    // ─── Выбор сервера (выпадающий список) ──────────────────────────────

    nodeSelector: {
        placeholder: "انتخاب سرور",
        switching: "در حال تغییر...",
        pinned: "سنجاق‌شده",
        allServers: "همهٔ سرورها",
    },

    // ─── Радиальное меню серверов (зажать кнопку подключения) ───────────

    radial: {
        hintHold: "روی یک سرور بکشید",
        hintClick: "یک سرور انتخاب کنید",
        alreadyHere: "فعلی",
        connect: "اتصال",
        switch: "تغییر",
        allServers: "همهٔ سرورها",
        allShort: "همه",
        more: "{{count}} مورد دیگر",
    },

    // ─── Плашка Kill Switch ─────────────────────────────────────────────

    killSwitch: {
        failed: "Kill Switch با خطا مواجه شد: {{error}}",
        title: "Kill Switch فعال است",
        details: "جزئیات",
        tooltip: "فقط BEAM و شبکهٔ محلی به اینترنت دسترسی دارند. بقیه به محض اتصال دوبارهٔ VPN برمی‌گردند.",
        reason: "دلیل: {{reason}}",
        description: "VPN قطع شد و برای جلوگیری از نشت، اینترنت متوقف شده است",
        reconnect: "اتصال دوباره",
        restoreInternet: "بازگرداندن اینترنت",

        toast: {
            restoreFailed: "بازگرداندن اینترنت انجام نشد",
            saveFailed: "ذخیره نشد",
        },
    },

    // ─── Ошибки подключения ─────────────────────────────────────────────

    toast: {
        disconnectError: "قطع اتصال انجام نشد",
    },
} satisfies LocaleShape<typeof ru>
