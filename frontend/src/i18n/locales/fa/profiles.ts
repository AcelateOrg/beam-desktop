/**
 * Профили: список, добавление, экспорт, параметры.
 * Фарси (RTL). Структура повторяет ru/profiles.ts.
 */
import type ru from "../ru/profiles"
import type { LocaleShape } from "../../locale-shape"

// \u2066…\u2069 (LRI…PDI) изолируют расширения файлов и схемы ссылок: без них точка
// в RTL уезжает в конец слова и выходит «protun.».
export default {
    title: "پروفایل‌ها",
    add: "افزودن پروفایل",
    empty: "هنوز پروفایلی ندارید. اولین را اضافه کنید!",
    noProfile: "بدون پروفایل",

    // ─── Карточка профиля ───────────────────────────────────────────────

    card: {
        active: "فعال",
        providerChannel: "کانال ارائه‌دهنده",
        unlimitedTraffic: "ترافیک نامحدود",
        unlimited: "نامحدود",
    },

    menu: {
        refresh: "به‌روزرسانی",
        settings: "تنظیمات",
        export: "خروجی گرفتن",
        delete: "حذف",
    },

    deleteDialog: {
        title: "پروفایل حذف شود؟",
        description: "«{{name}}» برای همیشه حذف می‌شود. این کار قابل بازگشت نیست.",
        confirm: "حذف",
    },

    // ─── Окно «Добавить профиль» ────────────────────────────────────────

    addModal: {
        title: "افزودن پروفایل",

        method: {
            url: { title: "URL", hint: "لینک اشتراک" },
            beam: { title: "BEAM", hint: "وارد کردن از فایل" },
        },

        url: {
            placeholder: "\u2066https://...\u2069 یا \u2066vless://...\u2069",
            hint: "\u2066vless://\u2069، \u2066vmess://\u2069، \u2066trojan://\u2069، \u2066ss://\u2069، \u2066hy2://\u2069 یا لینک اشتراک (HTTP/HTTPS)",
            insecure: "⚠️ اتصال رمزنگاری‌نشده",
        },

        file: {
            choose: "انتخاب فایل \u2066.beam\u2069",
            orDrop: "یا آن را اینجا رها کنید",
            dropHere: "اینجا رها کنید",
        },

        submit: "وارد کردن",
        submitting: "در حال وارد کردن...",

        error: {
            onlyBeam: "فقط فایل‌های \u2066.BEAM\u2069 پشتیبانی می‌شوند",
            importFailed: "وارد کردن ناموفق بود",
            fillFields: "لطفاً فیلدها را پر کنید",
        },
    },

    // ─── Окно «Экспорт профиля» ─────────────────────────────────────────

    exportModal: {
        title: "خروجی پروفایل",

        method: {
            beam: { title: "BEAM", hint: "فایل \u2066.beam\u2069" },
            raw: { title: "RAW", hint: "لینک سرورها" },
            qr: { title: "QR", hint: "برای گوشی" },
        },

        copySubscription: "کپی لینک اشتراک",
        loading: "در حال بارگذاری...",

        qr: {
            subscription: "لینک اشتراک",
            server: "سرور {{index}}",
            nothing: "این پروفایل لینک اشتراک یا لینک سرور ذخیره‌شده ندارد، پس چیزی برای ساخت کد QR وجود ندارد",
            hintSubscription: "در BEAM روی گوشی: افزودن پروفایل ← کد QR",
            hintServer: "فقط همین سرور. آن را در BEAM یا هر کلاینت دیگری اسکن کنید",
            copyLink: "لینک",
            copyImage: "کپی QR",
            copied: "کپی شد",
            tooLong: "لینک برای کد QR بیش از حد طولانی است. به‌جای آن از خروجی BEAM یا RAW استفاده کنید.",
            ariaLabel: "کد QR",
        },

        beam: {
            fileName: "نام فایل",
            download: "دانلود",
            exporting: "در حال خروجی گرفتن...",
        },

        raw: {
            none: "این پروفایل لینک ذخیره‌شده ندارد: از لینک‌های معمولی vless/vmess/trojan/ss/hy2 وارد نشده است",
            untitled: "بدون نام",
            copy: "کپی",
            copyAll: "کپی همه",
        },

        toast: {
            fileSaved: "فایل ذخیره شد",
            showInFolder: "نمایش در پوشه",
            linkCopied: "لینک کپی شد",
            imageCopyFailed: "کپی تصویر انجام نشد",
        },
    },

    // ─── Окно «Параметры профиля» ───────────────────────────────────────

    settingsModal: {
        title: "تنظیمات پروفایل",

        autoRefresh: {
            title: "به‌روزرسانی خودکار اشتراک",
            disabled: "خاموش: اشتراک خودبه‌خود به‌روز نمی‌شود",
            ownSchedule: "طبق زمان‌بندی شما هر {{hours}} ساعت به‌روز می‌شود",
            providerInterval: "هر {{hours}} ساعت به‌طور خودکار به‌روز می‌شود",
            providerSchedule: "طبق زمان‌بندی ارائه‌دهنده به‌طور خودکار به‌روز می‌شود",
        },

        override: {
            title: "زمان‌بندی دلخواه",
            active: "به‌جای زمان‌بندی ارائه‌دهنده، هر {{hours}} ساعت به‌روز شود",
            emptyWithInterval: "برای استفاده از زمان‌بندی ارائه‌دهنده ({{hours}} ساعت) خالی بگذارید",
            empty: "برای استفاده از زمان‌بندی ارائه‌دهنده خالی بگذارید",
            hoursUnit: "ساعت",
        },

        noSubscription: "این پروفایل اشتراک ندارد، پس به‌روزرسانی خودکار در دسترس نیست.",
        done: "تمام",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        refreshing: "در حال به‌روزرسانی پروفایل…",
        refreshed: "پروفایل به‌روز شد",
        refreshFailed: "به‌روزرسانی انجام نشد",
        autoRefreshFailed: "تغییر به‌روزرسانی خودکار انجام نشد",
        scheduleFailed: "تغییر زمان‌بندی به‌روزرسانی انجام نشد",
        exportFailed: "خروجی گرفتن انجام نشد",
        linksFailed: "دریافت لینک‌ها انجام نشد",
        saveFileFailed: "ذخیرهٔ فایل انجام نشد",
        saveLinksFailed: "ذخیرهٔ لینک‌ها انجام نشد",
    },

    // ─── Импорт по внешней ссылке (beam://, файл) ───────────────────────

    externalImport: {
        title: "این پروفایل اضافه شود؟",
        source: "منبع: {{source}}",
        beamLink: "لینک \u2066beam://\u2069",
        confirm: "افزودن",
        cancel: "لغو",
        failed: "وارد کردن لینک Beam انجام نشد",
    },
} satisfies LocaleShape<typeof ru>
