/**
 * Настройки → Для разработчиков (скрытый раздел)
 * Упрощённый китайский. Структура повторяет ru/settings/developer.ts.
 */
import type ru from "../../ru/settings/developer"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "开发者选项",

    // ─── Эмуляция статуса VPN ───────────────────────────────────────────

    emulate: {
        title: "模拟 VPN 状态",
        description: "无需真实 VPN 即可改变连接按钮的状态，方便检查动画。",
        current: "当前状态：",
        note: "不会真正建立或断开 VPN 连接。",
        status: {
            disconnected: "未连接",
            connecting: "正在连接...",
            connected: "已连接",
            connectedNoInternet: "无网络",
            disconnecting: "正在断开...",
            error: "错误",
        },
    },

    // ─── Симуляция платформы ────────────────────────────────────────────

    platform: {
        title: "模拟平台",
        description: "显示其他系统的界面，比如窗口按钮和标志，立即生效。",
        current: "当前平台：",
        auto: "自动",
        note: "再次点击当前选中的按钮会恢复自动检测，即使用 Go 提供的平台。",
    },

    // ─── Проверка уведомлений ───────────────────────────────────────────
    // button.* — подписи кнопок, sample.* — текст самих тестовых тостов

    toastDemo: {
        title: "通知",
        description: "显示各种类型的提示，用于检查外观、堆叠和按钮行为。",
        button: {
            success: "成功",
            error: "错误",
            warning: "警告",
            info: "信息",
            plain: "无图标",
            loadingSuccess: "加载 → 成功",
            loadingError: "加载 → 错误",
            actions: "带按钮",
            long: "长文本",
            burst: "批量",
            dismissAll: "全部关闭",
        },
        sample: {
            profileUpdated: "配置文件已更新",
            serverSwitchFailed: "无法切换节点",
            subscriptionExpiring: "订阅将在 3 天后到期",
            subscriptionExpiringHint: "请向服务商续订，以免失去访问权限。",
            updateAvailable: "有可用更新 2.0.2",
            linkCopied: "链接已复制",
            updatingProfile: "正在更新配置文件…",
            updateFailed: "更新失败",
            updateFailedHint: "订阅服务器返回 502",
            addProfile: "添加配置文件？",
            addProfileSource: "来源：example.com",
            add: "添加",
            profileAdded: "配置文件已添加",
            longTitle: "无法保存一个名称非常非常长的节点的配置",
            pingFailed: "无法测试延迟",
        },
    },

    // ─── Ядро Xray ──────────────────────────────────────────────────────

    core: {
        title: "Xray 内核",
        description: "诊断与配置检查。",
        logs: {
            title: "内核日志",
            description: "将 Xray 内核日志写入内存和 core.log。关闭后立即释放内存，是最明显的省内存方式。",
        },
        tunLogs: {
            title: "TUN 日志",
            description: "隧道高级诊断（beam-debug），并将日志写入 logs/ 目录。默认关闭，不会写入任何内容。",
        },
        trace: {
            title: "TRACE 日志",
            description: "为 Xray 启用 TRACE 级别日志，下次连接时生效。",
        },
        reality: {
            title: "REALITY 调试日志",
            description: "输出 REALITY 握手细节用于诊断，下次连接时生效。",
        },
        config: {
            title: "当前配置",
            description: "显示当前配置文件的 JSON 配置，可复制。",
            open: "打开",
            dialogTitle: "Xray 配置",
            noProfile: "没有正在使用的配置文件",
            close: "关闭",
        },
    },

    // ─── Опасная зона ───────────────────────────────────────────────────

    danger: {
        title: "危险区域",
        description: "对应用数据的不可逆操作。",
        reset: {
            title: "重置所有数据",
            description: "删除所有配置文件和设置，开发者模式将保持开启。",
            button: "重置",
        },
        disable: {
            title: "关闭开发者模式",
            description: "从设置中隐藏此分区。如需重新打开，在“关于”中点击标志 10 次。",
            button: "关闭",
        },
    },

    resetDialog: {
        title: "重置所有数据",
        // <b> — жирный фрагмент
        description: "此操作将删除<b>所有配置文件</b>并重置应用设置，且无法撤销。",
        resetting: "正在重置...",
        confirm: "确定重置",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        coreLogsFailed: "无法切换内核日志",
        tunLogsFailed: "无法切换 TUN 日志",
        logLevelFailed: "无法更改日志级别",
        realityFailed: "无法更改 REALITY 调试日志",
        emulateFailed: "模拟失败",
        resetFailed: "重置失败",
    },
} satisfies LocaleShape<typeof ru>
