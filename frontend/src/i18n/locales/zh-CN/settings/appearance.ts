/**
 * Настройки → Внешний вид
 * Упрощённый китайский. Структура повторяет ru/settings/appearance.ts.
 */
import type ru from "../../ru/settings/appearance"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "外观",

    // ─── Карточка «Темы» ────────────────────────────────────────────────

    themes: {
        title: "主题",
        description: "为应用选择一种风格，或自己创建一个。",
        builtinSection: "内置",
        customSection: "自定义",
        wallpaper: "取自壁纸",
        newTheme: "新建主题",
        edit: "编辑主题“{{name}}”",
        delete: "删除主题“{{name}}”",
        collapse: "收起",
        showMore: "显示更多",

        // Встроенные темы: название плитки и подсказка
        builtin: {
            system: { label: "跟随系统", description: "跟随系统的外观设置。" },
            light: { label: "浅色", description: "Beam 经典浅色主题。" },
            dark: { label: "深色", description: "Beam 经典深色主题。" },
            amoled: { label: "AMOLED", description: "纯黑背景，适合 OLED 屏幕。" },
            cosmic: { label: "宇宙", description: "深邃背景配青绿色点缀。" },
            purple: { label: "紫色", description: "丝绒紫配霓虹点缀。" },
            blue: { label: "蓝色", description: "柔和的深蓝，像代码编辑器。" },
            slate: { label: "Slate", description: "带一丝蓝调的冷灰。" },
            stone: { label: "Stone", description: "温暖的石墨色，对比柔和。" },
            emerald: { label: "翡翠", description: "深绿配翡翠色点缀。" },
            sunset: { label: "日落", description: "暖琥珀色配橙色高光。" },
            nord: { label: "Nord", description: "极地灰配冰蓝色点缀。" },
            rose: { label: "玫瑰", description: "粉色基调配亮粉色点缀。" },
            mocha: { label: "Catppuccin Mocha", description: "柔和的深色调色板，配薰衣草色点缀。" },
            latte: { label: "Catppuccin Latte", description: "浅色马卡龙配紫色点缀。" },
            dracula: { label: "Dracula", description: "经典深色主题，配紫色点缀。" },
            tokyo: { label: "Tokyo Night", description: "夜色靛蓝配蓝色霓虹。" },
            gruvbox: { label: "Gruvbox", description: "复古暖石墨配黄色点缀。" },
        },
    },

    // ─── Редактор своей темы (диалог) ───────────────────────────────────

    editor: {
        titleNew: "新建主题",
        titleEdit: "编辑主题",
        description: "选择强调色和背景，其余配色会自动生成。",
        defaultName: "我的主题",
        name: "名称",
        section: "分组",
        create: "创建主题",

        tab: {
            accent: "强调色",
            surface: "背景",
        },

        accentColor: "强调色",
        quickPick: "快速选择",
        saturationBrightness: "饱和度和亮度",
        hue: "色相",

        base: {
            title: "基础",
            dark: "深色",
            light: "浅色",
            amoled: "AMOLED",
        },

        surface: {
            title: "背景色调",
            fromAccent: "与强调色一致",
            custom: "自定义",
        },

        depth: {
            title: "深度",
            aria: "背景深度",
            deeper: "更深",
            lighter: "更浅",
            amoledHint: "AMOLED 背景始终为纯黑。",
        },

        saturation: {
            title: "饱和度",
            aria: "背景饱和度",
            amoledHint: "仅影响卡片和菜单。",
        },

        // Подписи плашек под превью: из чего строится палитра
        palette: {
            title: "配色",
            background: "背景",
            sidebar: "侧边栏",
            card: "卡片",
            hover: "悬停",
            border: "边框",
            accent: "强调色",
        },

        // Текст в мини-превью окна. Это макет, значения выдуманные
        preview: {
            usage: "19 / 50 GB · 23 天",
            search: "搜索节点…",
            connect: "连接",
        },
    },

    // ─── Карточка «Акцентный цвет» ──────────────────────────────────────

    accent: {
        title: "强调色",
        description: "用于按钮、高亮和图表，主题保持不变。",
        fromTheme: "跟随主题",
        custom: "自定义颜色",
        done: "完成",
        wallpaperHint: "“取自壁纸”会从图片中提取强调色。",
        customThemeHint: "自定义主题的强调色请在主题编辑器中设置。",
    },

    // ─── Карточка «Фон» ─────────────────────────────────────────────────

    backdrop: {
        title: "背景",
        description: "界面下方的图片。",
        off: "无",
        wallpaper: "壁纸",
        wallpaperMissing: "未找到壁纸",
        photo: "自己的照片",
        replace: "更换",
        remove: "移除",
        blur: "模糊",
        brightness: "亮度",
        density: "面板不透明度",
        resetSliders: "重置滑块",
        matchColors: "配色匹配背景",

        style: {
            content: "毛玻璃菜单",
            sidebar: "深色菜单",
        },

        error: {
            change: "无法更改背景",
            save: "无法保存背景",
            upload: "无法上传照片",
            remove: "无法移除照片",
            savePhoto: "无法保存照片",
            readPhoto: "无法读取照片",
            unsupportedFormat: "不支持此图片格式",
            processPhoto: "无法处理照片",
            appOnly: "仅在桌面应用中可用",
        },
    },

    // ─── Карточка «Шрифт интерфейса» ────────────────────────────────────

    font: {
        title: "界面字体",
        description: "整个应用中显示文字所用的字体。",
        // Слово на плитке шрифта: показывает, как выглядят буквы этого языка
        sample: "你好",
        custom: "自定义字体",
        customHint: "TTF、OTF、WOFF、WOFF2，最大 10 MB",
        delete: "删除字体“{{name}}”",
    },

    // ─── Карточка «Скругление углов» ────────────────────────────────────

    radius: {
        title: "圆角",
        description: "按钮、卡片等界面元素的圆角大小。",
        small: "小",
        medium: "中",
        large: "大",
        round: "全圆",
    },

    // ─── Карточка «Анимация переходов» ──────────────────────────────────

    animation: {
        title: "切换动画",
        description: "切换标签页和页面时的动画效果。",
        slide: { label: "滑动", description: "从右侧" },
        slideUp: { label: "上浮", description: "从底部" },
        fade: { label: "淡入", description: "平滑" },
        none: { label: "无", description: "立即" },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        fontTooLarge: "字体文件超过 10 MB",
        fontReadFailed: "无法读取字体",
        fontFormats: "支持 TTF、OTF、WOFF 和 WOFF2",
        fontSaveFailed: "无法保存字体",
        fontAdded: "已添加字体“{{name}}”",
        fontDeleteFailed: "无法删除字体",
        themeSaveFailed: "无法保存主题",
        themeDeleteFailed: "无法删除主题",
        themeDeleted: "已删除主题“{{name}}”",
        undo: "撤销",
    },
} satisfies LocaleShape<typeof ru>
