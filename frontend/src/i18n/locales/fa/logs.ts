/**
 * Логи и активные соединения.
 * Фарси (RTL). Структура повторяет ru/logs.ts.
 */
import type ru from "../ru/logs"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "لاگ‌ها",

    tabs: {
        logs: "لاگ‌ها",
        connections: "اتصال‌ها",
    },

    // ─── Панель управления ──────────────────────────────────────────────

    toolbar: {
        recording: "ثبت لاگ",
        levelHint: "میزان جزئیات لاگ‌های هسته",
        levelPlaceholder: "سطح لاگ",
        levelShort: "سطح",
        openFolder: "پوشهٔ لاگ‌ها",
        openFolderHint: "باز کردن پوشهٔ لاگ‌ها (فایل crash.log برای گزارش باگ هم آنجاست)",
        show: "نمایش",
        all: "همه",
        rawView: "نمای خام",
        autoScroll: "پیمایش خودکار",
        autoScrollOn: "پیمایش خودکار روشن",
        autoScrollOff: "پیمایش خودکار خاموش",
        showRaw: "نمایش خام",
        showParsed: "نمایش تفکیک‌شده",
    },

    // Уровень, с которым ядро пишет логи
    level: {
        off: "خاموش",
        error: "فقط خطاها",
        info: "عادی",
        debug: "مفصل",
    },

    // ─── Пустые состояния ───────────────────────────────────────────────

    empty: {
        logs: "هنوز لاگی نیست",
        connections: "اتصال فعالی وجود ندارد",
        loggingOff: "ثبت لاگ خاموش است",
        loggingOffHint: "برای دیدن اتفاقات، آن را از پایین روشن کنید",
        enableLogging: "روشن کردن ثبت لاگ",
    },

    tooSmall: {
        title: "پنجره خیلی کوچک است",
        description: "برای دیدن لاگ‌ها پنجره را بزرگ‌تر کنید",
    },

    raw: {
        closed: "(بسته شد)",
    },

    // ─── Вкладка «Соединения» ───────────────────────────────────────────

    connections: {
        summary: {
            apps_one: "<b>{{count}}</b> برنامه",
            apps_other: "<b>{{count}}</b> برنامه",
            connections_one: "<b>{{count}}</b> اتصال",
            connections_other: "<b>{{count}}</b> اتصال",
            noPerApp: "تفکیک بر اساس برنامه در دسترس نیست",
            noPerAppHint: "در حالت پروکسی سیستم، برنامه‌ها از هم قابل تشخیص نیستند. برای دیدن هر برنامه به TUN بروید.",
        },

        empty: "اتصال فعالی وجود ندارد",
        emptyHint: "وصل شوید تا برنامه‌ها و اتصال‌هایشان اینجا نمایش داده شوند",
        noConnections: "بدون اتصال",

        // Группы без имени процесса
        system: "سیستم",
        all: "همهٔ اتصال‌ها",

        group: {
            idle: "بیکار",
            active: "{{count}} فعال",
        },

        section: {
            active: "فعال",
            closed: "به‌تازگی بسته‌شده",
            of: "از {{total}}",
            closedHint: "درخواست‌های کوتاه کسری از ثانیه طول می‌کشند، پس 2 دقیقهٔ دیگر اینجا می‌مانند.",
        },

        row: {
            closedAgo: "{{ago}} بسته شد",
            close: "بستن",
        },

        detail: {
            closeAll: "بستن همه",
            speed: "سرعت",
            downloaded: "دانلودشده",
            uploaded: "آپلودشده",
            uptime: "مدت",
        },

        // Куда ушло соединение
        route: {
            vpn: "VPN",
            direct: "مستقیم",
            block: "مسدود",
            dns: "DNS",
            mixed: "VPN + مستقیم",
        },

        // Почему соединение ушло туда, куда ушло
        rule: {
            user: "قانون: {{label}}",
            routing: "قانون مسیریابی",
            app: "قانون برنامه",
            lan: "شبکهٔ محلی",
            dns: "درخواست DNS",
            final: "پیش‌فرض",
        },

        // Размеры и скорость в этой вкладке
        unit: {
            perSecond: "{{value}}/s",
        },
    },

    // ─── Выбор запущенного процесса ─────────────────────────────────────

    processPicker: {
        title: "فرایندهای در حال اجرا",
        refresh: "بازخوانی فهرست",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        toggleFailed: "تغییر وضعیت ثبت لاگ انجام نشد",
        levelFailed: "تغییر سطح لاگ انجام نشد",
        openFolderFailed: "باز کردن پوشهٔ لاگ‌ها انجام نشد",
        closeFailed: "بستن اتصال انجام نشد",
        closedMany: "{{count}} اتصال بسته شد",
        connectionsFailed: "بارگذاری اتصال‌ها انجام نشد",
        processesFailed: "بارگذاری فرایندهای در حال اجرا انجام نشد",
    },
} satisfies LocaleShape<typeof ru>
