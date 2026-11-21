/**
 * Настройки → главный экран со списком разделов
 * Упрощённый китайский. Структура повторяет ru/settings/menu.ts.
 */
import type ru from "../../ru/settings/menu"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "设置",

    appearance: {
        title: "外观",
        description: "主题、字体、圆角",
    },
    app: {
        title: "应用",
        description: "语言、开机启动、托盘、延迟测试、HWID",
    },
    connection: {
        title: "连接",
        description: "模式、DNS、分片",
    },
    analytics: {
        title: "统计",
        description: "流量、时长、节点和应用",
    },
    logs: {
        title: "日志",
        description: "Xray 内核运行日志",
    },
    developer: {
        title: "开发者选项",
        description: "开发与调试工具",
    },
    about: {
        title: "关于",
        description: "版本与信息",
    },
} satisfies LocaleShape<typeof ru>
