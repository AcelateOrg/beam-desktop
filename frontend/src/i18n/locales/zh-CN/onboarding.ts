/**
 * Мастер первого запуска
 * Упрощённый китайский. Структура повторяет ru/onboarding.ts.
 */
import type ru from "../ru/onboarding"
import type { LocaleShape } from "../../locale-shape"

export default {
    // Шаги мастера: eyebrow — маленькая подпись над заголовком
    step: {
        language: {
            eyebrow: "语言",
            title: "选择语言",
            description: "之后可以随时在设置中更改。",
        },
        welcome: {
            eyebrow: "开始",
            title: "欢迎使用 BEAM",
            description: "首次连接前，先完成几项简单设置。",
        },
        theme: {
            eyebrow: "外观",
            title: "选择主题",
            description: "挑一个看着舒服的界面风格。",
        },
        profile: {
            eyebrow: "导入",
            title: "添加配置文件",
            description: "添加订阅、BEAM 文件或 JSON 配置。",
        },
        behavior: {
            eyebrow: "完成",
            title: "最后几项设置",
            description: "开启几个日常使用的选项。",
        },
    },

    // ─── Шаг «Старт» ────────────────────────────────────────────────────

    welcome: {
        title: "欢迎使用 BEAM",
        description: "我们来快速完成首次连接前的准备：选择主题、添加配置文件，并设置应用的运行方式。",
    },

    // ─── Шаг «Тема» ─────────────────────────────────────────────────────

    theme: {
        followsSystem: {
            windows: "跟随 Windows",
            macos: "跟随 macOS",
            linux: "跟随系统",
        },
        fixed: "固定主题",
    },

    // ─── Шаг «Профиль» ──────────────────────────────────────────────────

    profile: {
        intro: "如果你已有配置文件，现在就可以导入。没有的话，可以直接跳过这一步。",
        found: "已找到配置文件",
        notAdded: "尚未添加配置文件",
        available_other: "有 {{count}} 个配置文件可用",
        canSkip: "不添加也可以继续",
        addMore: "再添加一个",
        import: "导入",
    },

    // ─── Шаг «Последние настройки» ──────────────────────────────────────

    behavior: {
        autostart: {
            title: {
                windows: "开机时随 Windows 启动",
                macos: "登录时启动",
                linux: "登录时启动",
            },
            description: "如果你每天都用 Beam，会很方便。",
            unavailableMacos: "macOS 暂不支持。",
        },
        tray: {
            title: "最小化到托盘",
            description: "关闭窗口时隐藏应用，而不是退出。",
            descriptionMacos: "在 macOS 上由系统通过程序坞管理。",
        },
    },

    // ─── Кнопки внизу ───────────────────────────────────────────────────

    nav: {
        skip: "跳过",
        back: "上一步",
        next: "下一步",
        finish: "完成",
        finishing: "正在保存...",
    },

    toast: {
        saveFailed: "无法保存设置",
        finishFailed: "无法完成初始设置",
    },
} satisfies LocaleShape<typeof ru>
