/**
 * Каркас окна: навигация, сайдбар, обновления приложения.
 * Фарси (RTL). Структура повторяет ru/layout.ts.
 */
import type ru from "../ru/layout"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Навигация ──────────────────────────────────────────────────────
    // title — в сайдбаре, short — в нижней панели узкого окна

    nav: {
        home: { title: "اتصال", short: "خانه" },
        profiles: { title: "پروفایل‌ها", short: "پروفایل‌ها" },
        nodes: { title: "کانفیگ‌ها", short: "سرورها" },
        routing: { title: "مسیریابی", short: "مسیریابی" },
        settings: { title: "تنظیمات", short: "تنظیمات" },
    },

    sidebar: {
        toggle: "باز و بسته کردن نوار کناری",
    },

    // ─── Обновление приложения ──────────────────────────────────────────

    update: {
        available: "به‌روزرسانی موجود است",
        version: "نسخه {{version}}",
        mandatory: "به‌روزرسانی اجباری: این نسخه دیگر پشتیبانی نمی‌شود",
        noChangelog: "فهرست تغییرات موجود نیست",
        download: "دانلود",
        downloading: "در حال دانلود...",
        installAndRestart: "نصب و راه‌اندازی مجدد",
        linuxTunNote:
            "پس از راه‌اندازی مجدد، Beam یک بار مجوز TUN را درخواست می‌کند. این طبیعی است: دسترسی‌ها به فایل اجرایی گره خورده‌اند و این فایل همین حالا با نسخهٔ جدید جایگزین شد.",

        toast: {
            downloadFailed: "دانلود به‌روزرسانی انجام نشد",
            installFailed: "نصب به‌روزرسانی انجام نشد",
        },
    },
} satisfies LocaleShape<typeof ru>
