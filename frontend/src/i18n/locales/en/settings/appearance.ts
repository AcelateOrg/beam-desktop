/**
 * Настройки → Внешний вид
 * Структура повторяет ru/settings/appearance.ts.
 */
import type ru from "../../ru/settings/appearance"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Appearance",

    // ─── Карточка «Темы» ────────────────────────────────────────────────

    themes: {
        title: "Themes",
        description: "Choose a look for the app or create your own.",
        builtinSection: "Built-in",
        customSection: "Custom",
        wallpaper: "From wallpaper",
        newTheme: "New theme",
        edit: "Edit theme \"{{name}}\"",
        delete: "Delete theme \"{{name}}\"",
        collapse: "Show less",
        showMore: "Show more",

        // Встроенные темы: название плитки и подсказка
        builtin: {
            system: { label: "System", description: "Follows your OS appearance." },
            light: { label: "Light", description: "The classic light Beam theme." },
            dark: { label: "Dark", description: "The classic dark Beam theme." },
            amoled: { label: "AMOLED", description: "Pure black background for OLED screens." },
            cosmic: { label: "Cosmic", description: "Deep background with a teal accent." },
            purple: { label: "Purple", description: "Velvety purple with a neon accent." },
            blue: { label: "Blue", description: "Soft navy, like a code editor." },
            slate: { label: "Slate", description: "Cool gray with a hint of blue." },
            stone: { label: "Stone", description: "Warm graphite with calm contrast." },
            emerald: { label: "Emerald", description: "Deep green with an emerald accent." },
            sunset: { label: "Sunset", description: "Warm amber with orange highlights." },
            nord: { label: "Nord", description: "Arctic gray with a frosty blue accent." },
            rose: { label: "Rose", description: "Pink undertone with a bright pink accent." },
            mocha: { label: "Catppuccin Mocha", description: "Pastel dark palette with a lavender accent." },
            latte: { label: "Catppuccin Latte", description: "Light pastels with a purple accent." },
            dracula: { label: "Dracula", description: "The classic dark theme with a purple accent." },
            tokyo: { label: "Tokyo Night", description: "Night-time indigo with blue neon." },
            gruvbox: { label: "Gruvbox", description: "Warm retro graphite with a yellow accent." },
        },
    },

    // ─── Редактор своей темы (диалог) ───────────────────────────────────

    editor: {
        titleNew: "New theme",
        titleEdit: "Edit theme",
        description: "Pick an accent and a background, and the rest of the palette is generated for you.",
        defaultName: "My theme",
        name: "Name",
        section: "Section",
        create: "Create theme",

        tab: {
            accent: "Accent",
            surface: "Background",
        },

        accentColor: "Accent color",
        quickPick: "Quick pick",
        saturationBrightness: "Saturation and brightness",
        hue: "Hue",

        base: {
            title: "Base",
            dark: "Dark",
            light: "Light",
            amoled: "AMOLED",
        },

        surface: {
            title: "Background tint",
            fromAccent: "Match accent",
            custom: "Custom",
        },

        depth: {
            title: "Depth",
            aria: "Background depth",
            deeper: "Deeper",
            lighter: "Lighter",
            amoledHint: "AMOLED backgrounds are always black.",
        },

        saturation: {
            title: "Saturation",
            aria: "Background saturation",
            amoledHint: "Only affects cards and menus.",
        },

        // Подписи плашек под превью: из чего строится палитра
        palette: {
            title: "Palette",
            background: "Background",
            sidebar: "Sidebar",
            card: "Cards",
            hover: "Hover",
            border: "Borders",
            accent: "Accent",
        },

        // Текст в мини-превью окна. Это макет, значения выдуманные
        preview: {
            usage: "19 of 50 GB · 23 days",
            search: "Search servers…",
            connect: "Connect",
        },
    },

    // ─── Карточка «Акцентный цвет» ──────────────────────────────────────

    accent: {
        title: "Accent color",
        description: "Buttons, highlights and charts. The theme stays the same.",
        fromTheme: "Theme default",
        custom: "Custom color",
        done: "Done",
        wallpaperHint: "\"From wallpaper\" takes its accent from the image.",
        customThemeHint: "Custom themes set their accent in the theme editor.",
    },

    // ─── Карточка «Фон» ─────────────────────────────────────────────────

    backdrop: {
        title: "Background",
        description: "An image behind the interface.",
        off: "None",
        wallpaper: "Wallpaper",
        wallpaperMissing: "No wallpaper found",
        photo: "Your photo",
        replace: "Replace",
        remove: "Remove",
        blur: "Blur",
        brightness: "Brightness",
        density: "Panel opacity",
        resetSliders: "Reset sliders",
        matchColors: "Match colors",

        style: {
            content: "Glass menu",
            sidebar: "Dark menu",
        },

        error: {
            change: "Couldn't change the background",
            save: "Couldn't save the background",
            upload: "Couldn't upload the photo",
            remove: "Couldn't remove the photo",
            savePhoto: "Couldn't save the photo",
            readPhoto: "Couldn't read the photo",
            unsupportedFormat: "This image format isn't supported",
            processPhoto: "Couldn't process the photo",
            appOnly: "Only available in the desktop app",
        },
    },

    // ─── Карточка «Шрифт интерфейса» ────────────────────────────────────

    font: {
        title: "Interface font",
        description: "The font used for text throughout the app.",
        // Слово на плитке шрифта: показывает, как выглядят буквы этого языка
        sample: "Hello",
        custom: "Custom font",
        customHint: "TTF, OTF, WOFF, WOFF2, up to 10 MB",
        delete: "Delete font \"{{name}}\"",
    },

    // ─── Карточка «Скругление углов» ────────────────────────────────────

    radius: {
        title: "Corner radius",
        description: "How rounded buttons, cards and other elements are.",
        small: "Small",
        medium: "Medium",
        large: "Large",
        round: "Round",
    },

    // ─── Карточка «Анимация переходов» ──────────────────────────────────

    animation: {
        title: "Transitions",
        description: "Animation style when switching tabs and pages.",
        slide: { label: "Slide", description: "From the right" },
        slideUp: { label: "Rise", description: "From the bottom" },
        fade: { label: "Fade", description: "Smooth" },
        none: { label: "None", description: "Instant" },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        fontTooLarge: "Font file is larger than 10 MB",
        fontReadFailed: "Couldn't read the font",
        fontFormats: "Supported formats: TTF, OTF, WOFF and WOFF2",
        fontSaveFailed: "Couldn't save the font",
        fontAdded: "Font \"{{name}}\" added",
        fontDeleteFailed: "Couldn't delete the font",
        themeSaveFailed: "Couldn't save the theme",
        themeDeleteFailed: "Couldn't delete the theme",
        themeDeleted: "Theme \"{{name}}\" deleted",
        undo: "Undo",
    },
} satisfies LocaleShape<typeof ru>
