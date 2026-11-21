/**
 * Настройки → Соединение
 * Фарси (RTL). Структура повторяет ru/settings/connection.ts.
 */
import type ru from "../../ru/settings/connection"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "اتصال",

    // ─── Карточка «Режим работы» ────────────────────────────────────────

    mode: {
        title: "حالت کار",
        description: "BEAM ترافیک شبکه را چگونه هدایت کند",
        tun: {
            title: "رابط TUN",
            description: "حالت پیشنهادی. کل ترافیک سیستم از تونل عبور می‌کند.",
        },
        systemProxy: {
            title: "پروکسی سیستم",
            description: "ترافیک از طریق تنظیمات سیستم می‌رود. برخی برنامه‌ها ممکن است آن را دور بزنند.",
        },
        flakyMac: "در macOS پروکسی سیستم همه‌جا کار نمی‌کند؛ TUN بهتر است",
        flakyLinux: "در Linux پروکسی سیستم همه‌جا کار نمی‌کند؛ TUN بهتر است",
        address: "آدرس",
        port: "پورت",
    },

    // ─── Карточка «Защита от утечек» (Kill Switch) ──────────────────────

    killSwitch: {
        title: "محافظت در برابر نشت",
        description: "هیچ چیز خارج از VPN نمی‌رود",
        row: "اگر VPN قطع شود، اینترنت تا اتصال دوباره متوقف می‌شود",
        details: "فقط وقتی فعال می‌شود که VPN خودبه‌خود قطع شود. اگر دستی قطع کنید، اینترنت بلافاصله عادی می‌شود. در زمان توقف، BEAM و شبکهٔ محلی کار می‌کنند.",
        detailsTun: " در حالت TUN نشت DNS و IPv6 را هم می‌بندد.",
        enabled: "Kill Switch روشن است",
        disabled: "Kill Switch خاموش است",
    },

    // ─── Карточка «DNS» ─────────────────────────────────────────────────

    dns: {
        title: "DNS",
        description: "درخواست‌ها از طریق VPN می‌روند",
        adguardCaption: "بدون تبلیغات",
        custom: "دستی",
        customCaption: "سرور خودتان",
        primary: "اصلی",
        primaryPlaceholder: "1.1.1.1 یا \u2066https://…\u2069",
        secondary: "پشتیبان",
        secondaryPlaceholder: "اختیاری",
        fromProfile: {
            title: "DNS پروفایل",
            description: "اگر کانفیگ اشتراک DNS خودش را دارد، از همان استفاده شود. برای سرورهای بدون DNS، گزینهٔ بالا به کار می‌رود",
        },
        error: {
            empty: "یک سرور DNS وارد کنید",
            local: "DNS محلی مناسب نیست: درخواست‌ها درون تونل در حلقه می‌افتند",
        },
    },

    // ─── Карточка «Фрагментация» ────────────────────────────────────────

    fragment: {
        title: "فرگمنت",
        description: "اگر اپراتور VPN را مسدود می‌کند کمک می‌کند",
        mode: {
            off: { label: "خاموش", caption: "بدون تغییر" },
            standard: { label: "عادی", caption: "برای بیشتر کاربران" },
            strong: { label: "قوی", caption: "اگر عادی جواب نداد" },
            custom: { label: "دستی", caption: "پارامترهای دلخواه" },
        },
        packets: "بسته‌ها",
        packetsPlaceholder: "tlshello یا 1-3",
        length: "اندازهٔ قطعه، بایت",
        interval: "مکث، ms",
        maxSplit: "حداکثر قطعه‌ها",
        maxSplitPlaceholder: "بدون محدودیت",
        noise: "نویز پیش از اتصال",
        noiseAdd: "افزودن",
        noiseDelay: "ms",
        noiseRemove: "حذف",
        noiseType: {
            rand: "تصادفی",
            str: "رشته",
            hex: "HEX",
            base64: "Base64",
        },
        direct: {
            title: "ترافیک مستقیم",
            description: "سایت‌هایی را که خارج از VPN می‌روند هم فرگمنت کن",
        },
    },

    // ─── Карточка «Мультиплексирование» ─────────────────────────────────

    mux: {
        title: "مالتی‌پلکس",
        description: "چند جریان در یک اتصال با سرور",
        row: "اتصال‌ها را سریع‌تر برقرار می‌کند. سرور باید پشتیبانی کند",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "بارگذاری تنظیمات انجام نشد",
        checkDns: "DNS را بررسی کنید",
        saved: "تنظیمات ذخیره شد",
        savedHint: "پس از اتصال دوباره اعمال می‌شود",
        saveFailed: "ذخیرهٔ تنظیمات انجام نشد",
        noData: "بدون داده",
        sectionSaveFailed: "ذخیره نشد",
    },
} satisfies LocaleShape<typeof ru>
