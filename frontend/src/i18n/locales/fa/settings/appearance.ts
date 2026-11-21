/**
 * Настройки → Внешний вид
 * Фарси (RTL). Структура повторяет ru/settings/appearance.ts.
 */
import type ru from "../../ru/settings/appearance"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "ظاهر",

    // ─── Карточка «Темы» ────────────────────────────────────────────────

    themes: {
        title: "پوسته‌ها",
        description: "یک ظاهر برای برنامه انتخاب کنید یا پوستهٔ خودتان را بسازید.",
        builtinSection: "آماده",
        customSection: "سفارشی",
        wallpaper: "از والپیپر",
        newTheme: "پوستهٔ جدید",
        edit: "ویرایش پوستهٔ «{{name}}»",
        delete: "حذف پوستهٔ «{{name}}»",
        collapse: "جمع کردن",
        showMore: "نمایش بیشتر",

        // Встроенные темы: название плитки и подсказка
        builtin: {
            system: { label: "سیستم", description: "از ظاهر سیستم‌عامل پیروی می‌کند." },
            light: { label: "روشن", description: "پوستهٔ روشن کلاسیک Beam." },
            dark: { label: "تیره", description: "پوستهٔ تیرهٔ کلاسیک Beam." },
            amoled: { label: "AMOLED", description: "پس‌زمینهٔ کاملاً مشکی برای نمایشگرهای OLED." },
            cosmic: { label: "کیهانی", description: "پس‌زمینهٔ عمیق با تأکید فیروزه‌ای." },
            purple: { label: "بنفش", description: "بنفش مخملی با تأکید نئونی." },
            blue: { label: "آبی", description: "سرمه‌ای ملایم به سبک ویرایشگرهای کد." },
            slate: { label: "Slate", description: "خاکستری سرد با ته‌رنگ آبی." },
            stone: { label: "Stone", description: "گرافیتی گرم با کنتراست آرام." },
            emerald: { label: "زمردی", description: "سبز تیره با تأکید زمردی." },
            sunset: { label: "غروب", description: "کهربایی گرم با درخشش نارنجی." },
            nord: { label: "Nord", description: "خاکستری قطبی با تأکید آبی یخی." },
            rose: { label: "رز", description: "ته‌رنگ صورتی با تأکید صورتی روشن." },
            mocha: { label: "Catppuccin Mocha", description: "پالت تیرهٔ پاستلی با تأکید اسطوخودوسی." },
            latte: { label: "Catppuccin Latte", description: "پاستل‌های روشن با تأکید بنفش." },
            dracula: { label: "Dracula", description: "پوستهٔ تیرهٔ کلاسیک با تأکید بنفش." },
            tokyo: { label: "Tokyo Night", description: "نیلی شبانه با نئون آبی." },
            gruvbox: { label: "Gruvbox", description: "گرافیتی گرم رترو با تأکید زرد." },
        },
    },

    // ─── Редактор своей темы (диалог) ───────────────────────────────────

    editor: {
        titleNew: "پوستهٔ جدید",
        titleEdit: "ویرایش پوسته",
        description: "رنگ تأکید و پس‌زمینه را انتخاب کنید؛ بقیهٔ پالت خودکار ساخته می‌شود.",
        defaultName: "پوستهٔ من",
        name: "نام",
        section: "بخش",
        create: "ساخت پوسته",

        tab: {
            accent: "تأکید",
            surface: "پس‌زمینه",
        },

        accentColor: "رنگ تأکید",
        quickPick: "انتخاب سریع",
        saturationBrightness: "اشباع و روشنایی",
        hue: "فام",

        base: {
            title: "پایه",
            dark: "تیره",
            light: "روشن",
            amoled: "AMOLED",
        },

        surface: {
            title: "ته‌رنگ پس‌زمینه",
            fromAccent: "مثل رنگ تأکید",
            custom: "سفارشی",
        },

        depth: {
            title: "عمق",
            aria: "عمق پس‌زمینه",
            deeper: "عمیق‌تر",
            lighter: "روشن‌تر",
            amoledHint: "در AMOLED پس‌زمینه همیشه مشکی است.",
        },

        saturation: {
            title: "اشباع",
            aria: "اشباع پس‌زمینه",
            amoledHint: "فقط روی کارت‌ها و منوها اثر دارد.",
        },

        // Подписи плашек под превью: из чего строится палитра
        palette: {
            title: "پالت",
            background: "پس‌زمینه",
            sidebar: "نوار کناری",
            card: "کارت‌ها",
            hover: "نشانگر روی آن",
            border: "حاشیه‌ها",
            accent: "تأکید",
        },

        // Текст в мини-превью окна. Это макет, значения выдуманные
        preview: {
            usage: "19 از 50 GB · 23 روز",
            search: "جستجوی سرور…",
            connect: "اتصال",
        },
    },

    // ─── Карточка «Акцентный цвет» ──────────────────────────────────────

    accent: {
        title: "رنگ تأکید",
        description: "دکمه‌ها، برجسته‌سازی‌ها و نمودارها. پوسته همان می‌ماند.",
        fromTheme: "مثل پوسته",
        custom: "رنگ دلخواه",
        done: "تمام",
        wallpaperHint: "«از والپیپر» رنگ تأکید را از تصویر برمی‌دارد.",
        customThemeHint: "رنگ تأکید پوستهٔ سفارشی در ویرایشگر خودش تعیین می‌شود.",
    },

    // ─── Карточка «Фон» ─────────────────────────────────────────────────

    backdrop: {
        title: "پس‌زمینه",
        description: "تصویری زیر رابط کاربری.",
        off: "هیچ",
        wallpaper: "والپیپر",
        wallpaperMissing: "والپیپر پیدا نشد",
        photo: "عکس خودم",
        replace: "جایگزینی",
        remove: "حذف",
        blur: "تاری",
        brightness: "روشنایی",
        density: "کدری پنل‌ها",
        resetSliders: "بازنشانی اسلایدرها",
        matchColors: "هماهنگی رنگ‌ها با پس‌زمینه",

        style: {
            content: "منوی شیشه‌ای",
            sidebar: "منوی تیره",
        },

        error: {
            change: "تغییر پس‌زمینه انجام نشد",
            save: "ذخیرهٔ پس‌زمینه انجام نشد",
            upload: "بارگذاری عکس انجام نشد",
            remove: "حذف عکس انجام نشد",
            savePhoto: "ذخیرهٔ عکس انجام نشد",
            readPhoto: "خواندن عکس انجام نشد",
            unsupportedFormat: "این قالب تصویر پشتیبانی نمی‌شود",
            processPhoto: "پردازش عکس انجام نشد",
            appOnly: "فقط در برنامهٔ دسکتاپ در دسترس است",
        },
    },

    // ─── Карточка «Шрифт интерфейса» ────────────────────────────────────

    font: {
        title: "فونت رابط کاربری",
        description: "فونتی که برای متن‌های کل برنامه استفاده می‌شود.",
        // Слово на плитке шрифта: показывает, как выглядят буквы этого языка
        // Шрифты интерфейса не содержат арабской графики, фарси всегда рисуется
        // Vazirmatn. Выбор шрифта меняет только латиницу и цифры, их и показываем.
        sample: "Aa 123",
        custom: "فونت دلخواه",
        customHint: "TTF، OTF، WOFF، WOFF2، حداکثر 10 MB",
        delete: "حذف فونت «{{name}}»",
    },

    // ─── Карточка «Скругление углов» ────────────────────────────────────

    radius: {
        title: "گردی گوشه‌ها",
        description: "میزان گردی دکمه‌ها، کارت‌ها و دیگر اجزای رابط.",
        small: "کم",
        medium: "متوسط",
        large: "زیاد",
        round: "گرد",
    },

    // ─── Карточка «Анимация переходов» ──────────────────────────────────

    animation: {
        title: "انیمیشن جابه‌جایی",
        description: "سبک انیمیشن هنگام رفتن بین زبانه‌ها و صفحه‌ها.",
        slide: { label: "لغزش", description: "از کنار" },
        slideUp: { label: "از پایین", description: "از پایین به بالا" },
        fade: { label: "محو", description: "نرم" },
        none: { label: "هیچ", description: "فوری" },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        fontTooLarge: "حجم فایل فونت بیش از 10 MB است",
        fontReadFailed: "خواندن فونت انجام نشد",
        fontFormats: "قالب‌های پشتیبانی‌شده: TTF، OTF، WOFF و WOFF2",
        fontSaveFailed: "ذخیرهٔ فونت انجام نشد",
        fontAdded: "فونت «{{name}}» اضافه شد",
        fontDeleteFailed: "حذف فونت انجام نشد",
        themeSaveFailed: "ذخیرهٔ پوسته انجام نشد",
        themeDeleteFailed: "حذف پوسته انجام نشد",
        themeDeleted: "پوستهٔ «{{name}}» حذف شد",
        undo: "واگرد",
    },
} satisfies LocaleShape<typeof ru>
