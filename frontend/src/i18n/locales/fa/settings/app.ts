/**
 * Настройки → Приложение
 * Фарси (RTL). Структура повторяет ru/settings/app.ts.
 */
import type ru from "../../ru/settings/app"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "برنامه",

    // ─── Карточка «Язык» ────────────────────────────────────────────────

    language: {
        title: "زبان",
        description: "زبان رابط کاربری BEAM",
        unavailable: "ترجمه به‌زودی",
    },

    // ─── Карточка «Поведение» ───────────────────────────────────────────

    behavior: {
        title: "رفتار",
        description: "نحوهٔ اجرا و کار برنامه در سیستم",

        launchOnStartup: {
            title: "اجرا هنگام روشن شدن سیستم",
            description: "برنامه هنگام ورود به سیستم خودکار اجرا می‌شود.",
            descriptionMacos: "در macOS در دسترس نیست.",
        },
        autoConnect: {
            title: "اتصال خودکار",
            description: "بلافاصله پس از اجرا با آخرین پروفایل وصل می‌شود.",
        },
        subscriptionAutoRefresh: {
            title: "به‌روزرسانی خودکار اشتراک‌ها",
            description: "لینک‌های اشتراک را به‌طور دوره‌ای برای سرورهای جدید بررسی می‌کند.",
        },
        minimizeToTray: {
            title: "کوچک کردن به سینی سیستم",
            description: "به‌جای بستن، پنجره را در ناحیهٔ اعلان‌ها پنهان می‌کند.",
            descriptionMacos: "سیستم از طریق Dock آن را مدیریت می‌کند.",
        },
    },

    // ─── Карточка «Пинг и диагностика» ──────────────────────────────────

    ping: {
        title: "پینگ و عیب‌یابی",
        description: "نحوهٔ سنجش تأخیر و دسترس‌پذیری سرورها",

        nodeMode: {
            title: "بررسی سرورها",
            description: "روش بررسی سرورهای فهرست پیش از اتصال.",
            auto: "خودکار (بر اساس پروتکل)",
            protocol: "بر اساس پروتکل",
            tcp: "پینگ TCP",
        },
        connectionMode: {
            title: "پینگ اتصال",
            description: "HTTP تونل واقعی سرتاسری را می‌سنجد و TCP مسیر مستقیم را.",
            http: "HTTP (تونل)",
            tcp: "TCP (مستقیم)",
        },
    },

    // ─── Карточка «Идентификация (HWID)» ────────────────────────────────

    hwid: {
        title: "شناسهٔ دستگاه (HWID)",
        description: "برای سرورها و اشتراک‌هایی که محدودیت دستگاه دارند",

        send: {
            title: "ارسال HWID",
            description: "یک هش یکتای دستگاه را همراه درخواست‌های اشتراک می‌فرستد.",
        },
        value: {
            title: "مقدار HWID",
            description: "روش ساخت: {{mode}}",
            configure: "تنظیم",
        },
        mode: {
            disabled: "خاموش",
            manual: "دستی",
            auto: "خودکار",
        },
    },

    // Отдельный экран HWID (src/pages/settings/Hwid.tsx), открывается кнопкой «Настроить»
    hwidPage: {
        title: "HWID",
        cardTitle: "شناسهٔ دستگاه",
        cardDescription: "یک UUID تصادفی که Beam هنگام به‌روزرسانی اشتراک می‌فرستد. به سخت‌افزار شما وابسته نیست.",
        mode: "روش",
        modeAuto: "خودکار ساخته شده",
        modeManual: "دستی تعیین شده",
        value: "مقدار",
        regenerate: "ساخت دوباره",
        loadFailed: "بارگذاری تنظیمات HWID انجام نشد",
        saveFailed: "ذخیرهٔ HWID انجام نشد",
    },

    // ─── Карточка «Служебные действия» ──────────────────────────────────

    service: {
        title: "نگهداری",
        description: "بازنشانی راهنماها و آشنایی اولیه با برنامه",

        onboarding: {
            title: "صفحهٔ خوشامد",
            description: "راهنمای گام‌به‌گام راه‌اندازی را دوباره اجرا می‌کند.",
            action: "اجرای دوباره",
            resetting: "در حال بازنشانی...",
        },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "بارگذاری تنظیمات برنامه انجام نشد",
        saveError: "خطا هنگام ذخیره",
        saved: "تنظیمات ذخیره شد",
        saveFailed: "ذخیرهٔ تنظیمات برنامه انجام نشد",
        onboardingResetFailed: "بازنشانی صفحهٔ خوشامد انجام نشد",
    },
} satisfies LocaleShape<typeof ru>
