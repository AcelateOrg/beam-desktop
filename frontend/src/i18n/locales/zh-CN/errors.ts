/**
 * Экраны ошибок и сообщения о сбоях интерфейса
 * Упрощённый китайский. Структура повторяет ru/errors.ts.
 */
import type ru from "../ru/errors"
import type { LocaleShape } from "../../locale-shape"

export default {
    unknown: "未知错误",

    // ─── Экран «Такой страницы нет» ─────────────────────────────────────

    notFound: {
        title: "页面不存在",
        description: "链接可能已失效，或者当前版本的 BEAM 没有这项功能。",
        goHome: "返回首页",
    },

    // ─── Экран падения интерфейса ───────────────────────────────────────

    crash: {
        title: "出了点问题",
        description: "你发现了一个 bug！请复制错误信息并发送给开发者，帮助我们尽快修复。",
        copy: "复制",
        hint: "这是应用的 bug。点击下方按钮返回。",
        goHome: "返回首页",
    },

    // ─── Уведомления после сбоя ─────────────────────────────────────────

    recovered: {
        uiRestarted: {
            title: "界面在崩溃后已重新启动",
            description: "VPN 连接未受影响。如果反复出现，请告诉开发者。",
        },
        vpnRestored: {
            title: "Beam 已从崩溃中恢复",
            description: "VPN 已自动重新连接。",
        },
        vpnNotRestored: {
            title: "Beam 在崩溃后已重新启动",
            description: "无法重新连接 VPN，请手动连接。",
        },
    },
} satisfies LocaleShape<typeof ru>
