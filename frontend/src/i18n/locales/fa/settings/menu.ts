/**
 * Настройки → главный экран со списком разделов
 * Фарси (RTL). Структура повторяет ru/settings/menu.ts.
 */
import type ru from "../../ru/settings/menu"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "تنظیمات",

    appearance: {
        title: "ظاهر",
        description: "پوسته، فونت، گردی گوشه‌ها",
    },
    app: {
        title: "برنامه",
        description: "زبان، اجرای خودکار، سینی سیستم، پینگ، HWID",
    },
    connection: {
        title: "اتصال",
        description: "حالت، DNS، فرگمنت",
    },
    analytics: {
        title: "آمار",
        description: "ترافیک، زمان، سرورها و برنامه‌ها",
    },
    logs: {
        title: "لاگ‌ها",
        description: "گزارش کار هستهٔ Xray",
    },
    developer: {
        title: "توسعه‌دهنده",
        description: "ابزارهای توسعه و اشکال‌زدایی",
    },
    about: {
        title: "درباره",
        description: "نسخه و اطلاعات",
    },
} satisfies LocaleShape<typeof ru>
