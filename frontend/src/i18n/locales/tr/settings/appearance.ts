/**
 * Настройки → Внешний вид
 * Турецкий. Структура повторяет ru/settings/appearance.ts.
 */
import type ru from "../../ru/settings/appearance"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Görünüm",

    // ─── Карточка «Темы» ────────────────────────────────────────────────

    themes: {
        title: "Temalar",
        description: "Uygulama için bir görünüm seçin ya da kendinizinkini oluşturun.",
        builtinSection: "Hazır",
        customSection: "Özel",
        wallpaper: "Duvar kâğıdından",
        newTheme: "Yeni tema",
        edit: "\"{{name}}\" temasını düzenle",
        delete: "\"{{name}}\" temasını sil",
        collapse: "Daralt",
        showMore: "Daha fazla göster",

        // Встроенные темы: название плитки и подсказка
        builtin: {
            system: { label: "Sistem", description: "İşletim sisteminin görünümünü izler." },
            light: { label: "Açık", description: "Beam'in klasik açık teması." },
            dark: { label: "Koyu", description: "Beam'in klasik koyu teması." },
            amoled: { label: "AMOLED", description: "OLED ekranlar için saf siyah arka plan." },
            cosmic: { label: "Kozmik", description: "Turkuaz vurgulu derin arka plan." },
            purple: { label: "Mor", description: "Neon vurgulu kadifemsi mor." },
            blue: { label: "Mavi", description: "Kod düzenleyicilerdeki gibi yumuşak lacivert." },
            slate: { label: "Slate", description: "Hafif mavi tonlu soğuk gri." },
            stone: { label: "Stone", description: "Sakin kontrastlı sıcak grafit." },
            emerald: { label: "Zümrüt", description: "Zümrüt vurgulu koyu yeşil." },
            sunset: { label: "Gün batımı", description: "Turuncu parıltılı sıcak kehribar." },
            nord: { label: "Nord", description: "Buz mavisi vurgulu kutup grisi." },
            rose: { label: "Gül", description: "Parlak pembe vurgulu pembe tonlar." },
            mocha: { label: "Catppuccin Mocha", description: "Lavanta vurgulu pastel koyu palet." },
            latte: { label: "Catppuccin Latte", description: "Mor vurgulu açık pasteller." },
            dracula: { label: "Dracula", description: "Mor vurgulu klasik koyu tema." },
            tokyo: { label: "Tokyo Night", description: "Mavi neonlu gece çivit mavisi." },
            gruvbox: { label: "Gruvbox", description: "Sarı vurgulu sıcak retro grafit." },
        },
    },

    // ─── Редактор своей темы (диалог) ───────────────────────────────────

    editor: {
        titleNew: "Yeni tema",
        titleEdit: "Temayı düzenle",
        description: "Bir vurgu rengi ve arka plan seçin, paletin geri kalanı otomatik oluşturulur.",
        defaultName: "Temam",
        name: "Ad",
        section: "Bölüm",
        create: "Tema oluştur",

        tab: {
            accent: "Vurgu",
            surface: "Arka plan",
        },

        accentColor: "Vurgu rengi",
        quickPick: "Hızlı seçim",
        saturationBrightness: "Doygunluk ve parlaklık",
        hue: "Ton",

        base: {
            title: "Temel",
            dark: "Koyu",
            light: "Açık",
            amoled: "AMOLED",
        },

        surface: {
            title: "Arka plan tonu",
            fromAccent: "Vurguyla aynı",
            custom: "Özel",
        },

        depth: {
            title: "Derinlik",
            aria: "Arka plan derinliği",
            deeper: "Daha koyu",
            lighter: "Daha açık",
            amoledHint: "AMOLED'de arka plan her zaman siyahtır.",
        },

        saturation: {
            title: "Doygunluk",
            aria: "Arka plan doygunluğu",
            amoledHint: "Yalnızca kartları ve menüleri etkiler.",
        },

        // Подписи плашек под превью: из чего строится палитра
        palette: {
            title: "Palet",
            background: "Arka plan",
            sidebar: "Kenar çubuğu",
            card: "Kartlar",
            hover: "Üzerine gelme",
            border: "Kenarlıklar",
            accent: "Vurgu",
        },

        // Текст в мини-превью окна. Это макет, значения выдуманные
        preview: {
            usage: "19 / 50 GB · 23 gün",
            search: "Sunucu ara…",
            connect: "Bağlan",
        },
    },

    // ─── Карточка «Акцентный цвет» ──────────────────────────────────────

    accent: {
        title: "Vurgu rengi",
        description: "Düğmeler, vurgular ve grafikler. Tema aynı kalır.",
        fromTheme: "Temadaki gibi",
        custom: "Özel renk",
        done: "Tamam",
        wallpaperHint: "\"Duvar kâğıdından\" vurgu rengini görselden alır.",
        customThemeHint: "Özel temalarda vurgu rengi tema düzenleyicisinde ayarlanır.",
    },

    // ─── Карточка «Фон» ─────────────────────────────────────────────────

    backdrop: {
        title: "Arka plan",
        description: "Arayüzün arkasındaki görsel.",
        off: "Yok",
        wallpaper: "Duvar kâğıdı",
        wallpaperMissing: "Duvar kâğıdı bulunamadı",
        photo: "Kendi fotoğrafım",
        replace: "Değiştir",
        remove: "Kaldır",
        blur: "Bulanıklık",
        brightness: "Parlaklık",
        density: "Panel opaklığı",
        resetSliders: "Kaydırıcıları sıfırla",
        matchColors: "Renkleri arka plana uydur",

        style: {
            content: "Cam menü",
            sidebar: "Koyu menü",
        },

        error: {
            change: "Arka plan değiştirilemedi",
            save: "Arka plan kaydedilemedi",
            upload: "Fotoğraf yüklenemedi",
            remove: "Fotoğraf kaldırılamadı",
            savePhoto: "Fotoğraf kaydedilemedi",
            readPhoto: "Fotoğraf okunamadı",
            unsupportedFormat: "Bu görsel biçimi desteklenmiyor",
            processPhoto: "Fotoğraf işlenemedi",
            appOnly: "Yalnızca masaüstü uygulamasında kullanılabilir",
        },
    },

    // ─── Карточка «Шрифт интерфейса» ────────────────────────────────────

    font: {
        title: "Arayüz yazı tipi",
        description: "Uygulamanın tamamında metinler için kullanılan yazı tipi.",
        // Слово на плитке шрифта: показывает, как выглядят буквы этого языка
        sample: "Merhaba",
        custom: "Özel yazı tipi",
        customHint: "TTF, OTF, WOFF, WOFF2, en fazla 10 MB",
        delete: "\"{{name}}\" yazı tipini sil",
    },

    // ─── Карточка «Скругление углов» ────────────────────────────────────

    radius: {
        title: "Köşe yuvarlaklığı",
        description: "Düğmelerin, kartların ve diğer öğelerin ne kadar yuvarlak olacağı.",
        small: "Küçük",
        medium: "Orta",
        large: "Büyük",
        round: "Yuvarlak",
    },

    // ─── Карточка «Анимация переходов» ──────────────────────────────────

    animation: {
        title: "Geçiş animasyonu",
        description: "Sekmeler ve sayfalar arasında geçerken kullanılan animasyon.",
        slide: { label: "Kaydır", description: "Sağdan" },
        slideUp: { label: "Yüksel", description: "Alttan" },
        fade: { label: "Solma", description: "Yumuşak" },
        none: { label: "Yok", description: "Anında" },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        fontTooLarge: "Yazı tipi dosyası 10 MB'tan büyük",
        fontReadFailed: "Yazı tipi okunamadı",
        fontFormats: "Desteklenen biçimler: TTF, OTF, WOFF ve WOFF2",
        fontSaveFailed: "Yazı tipi kaydedilemedi",
        fontAdded: "\"{{name}}\" yazı tipi eklendi",
        fontDeleteFailed: "Yazı tipi silinemedi",
        themeSaveFailed: "Tema kaydedilemedi",
        themeDeleteFailed: "Tema silinemedi",
        themeDeleted: "\"{{name}}\" teması silindi",
        undo: "Geri al",
    },
} satisfies LocaleShape<typeof ru>
