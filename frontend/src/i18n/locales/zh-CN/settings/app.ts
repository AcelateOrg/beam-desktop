/**
 * Настройки → Приложение
 * Упрощённый китайский. Структура повторяет ru/settings/app.ts.
 */
import type ru from "../../ru/settings/app"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "应用",

    // ─── Карточка «Язык» ────────────────────────────────────────────────

    language: {
        title: "语言",
        description: "BEAM 界面语言",
        unavailable: "翻译即将推出",
    },

    // ─── Карточка «Поведение» ───────────────────────────────────────────

    behavior: {
        title: "行为",
        description: "应用在系统中的启动和运行方式",

        launchOnStartup: {
            title: "开机自启",
            description: "登录系统时自动启动应用。",
            descriptionMacos: "macOS 暂不支持。",
        },
        autoConnect: {
            title: "自动连接",
            description: "启动后立即使用上次的配置文件连接。",
        },
        subscriptionAutoRefresh: {
            title: "自动更新订阅",
            description: "定期通过订阅链接检查节点更新。",
        },
        minimizeToTray: {
            title: "最小化到托盘",
            description: "关闭窗口时隐藏到通知区域，而不是退出。",
            descriptionMacos: "由系统通过程序坞管理。",
        },
    },

    // ─── Карточка «Пинг и диагностика» ──────────────────────────────────

    ping: {
        title: "延迟与诊断",
        description: "节点延迟和可用性的检测方式",

        nodeMode: {
            title: "节点检测",
            description: "连接前检测列表中节点的方式。",
            auto: "自动（按协议）",
            protocol: "按协议",
            tcp: "TCP 测速",
        },
        connectionMode: {
            title: "连接延迟",
            description: "HTTP 测量真实的端到端隧道，TCP 测量直连线路。",
            http: "HTTP（隧道）",
            tcp: "TCP（直连）",
        },
    },

    // ─── Карточка «Идентификация (HWID)» ────────────────────────────────

    hwid: {
        title: "设备标识（HWID）",
        description: "用于限制设备数量的节点和订阅",

        send: {
            title: "发送 HWID",
            description: "在订阅请求中附带唯一的设备哈希。",
        },
        value: {
            title: "HWID 值",
            description: "生成方式：{{mode}}",
            configure: "设置",
        },
        mode: {
            disabled: "已关闭",
            manual: "手动",
            auto: "自动",
        },
    },

    // Отдельный экран HWID (src/pages/settings/Hwid.tsx), открывается кнопкой «Настроить»
    hwidPage: {
        title: "HWID",
        cardTitle: "设备标识",
        cardDescription: "Beam 在更新订阅时发送的随机 UUID，与硬件无关。",
        mode: "方式",
        modeAuto: "自动生成",
        modeManual: "手动设置",
        value: "值",
        regenerate: "重新生成",
        loadFailed: "无法加载 HWID 设置",
        saveFailed: "无法保存 HWID",
    },

    // ─── Карточка «Служебные действия» ──────────────────────────────────

    service: {
        title: "维护",
        description: "重置提示和首次使用引导",

        onboarding: {
            title: "欢迎界面",
            description: "重新运行分步设置向导。",
            action: "重新开始",
            resetting: "正在重置...",
        },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "无法加载应用设置",
        saveError: "保存时出错",
        saved: "设置已保存",
        saveFailed: "无法保存应用设置",
        onboardingResetFailed: "无法重置引导",
    },
} satisfies LocaleShape<typeof ru>
