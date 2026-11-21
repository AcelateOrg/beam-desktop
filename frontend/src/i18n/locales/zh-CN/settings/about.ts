/**
 * Настройки → О приложении и экран «Лицензии»
 * Упрощённый китайский. Структура повторяет ru/settings/about.ts.
 */
import type ru from "../../ru/settings/about"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "关于",

    version: "版本",
    build: "构建",
    copyHashHint: "点击复制构建哈希",
    checking: "正在检查…",
    updateTo: "更新到 {{version}}",
    checkUpdates: "检查更新",
    licenses: "许可证",

    beta: {
        badgeTitle: "测试版，标签 {{tag}}",
        title: "封闭测试",
        description: "此版本的 BEAM 不得向第三方传播，仅限封闭测试团队使用。",
    },

    footer: {
        // «Powered by Wails & Xray & React» — названия ссылками, слова между ними тут
        poweredBy: "Powered by",
        rights: "© {{year}} Acelate. 保留所有权利。",
        love: "用心打造",
    },

    toast: {
        checkFailed: "无法检查更新",
        upToDate: "已是最新版本",
        devModeOn: "已开启开发者模式",
        hashCopied: "构建哈希已复制",
        hashCopyFailed: "无法复制哈希",
    },

    // ─── Экран «Лицензии» ───────────────────────────────────────────────

    licensesPage: {
        title: "许可证",
        search: "按名称、作者或许可证搜索",
        clear: "清除",
        licenseText: "许可证全文",
        thanks: "Beam 基于开源软件构建，感谢所有作者！",
        nothingFound: "没有找到结果",
        footer: "点击项目可打开其网站，点击许可证可阅读全文。",

        // Разделы списка сторонних компонентов
        section: {
            core: { title: "内核与网络", hint: "Xray、协议、隧道" },
            desktop: { title: "桌面端", hint: "窗口、托盘、系统" },
            ui: { title: "界面", hint: "React 及组件" },
            fonts: { title: "字体", hint: "Google Fonts" },
            data: { title: "数据", hint: "单独下载" },
        },

        // Пометки у отдельных компонентов
        note: {
            modified: "修改版",
            windowsDriver: "Windows 驱动",
            staticLinkingException: "附带静态链接例外",
            iconSets: "图标遵循各图标集的许可证",
            geoData: "geoip.dat 和 geosite.dat",
        },
    },

    // ─── Карточка «Лицензия Beam» ───────────────────────────────────────
    // Пересказ Beam Source License 1.0 простыми словами. Юридически действует
    // английский текст LICENSE — при правке лицензии обнови и эти пункты.

    beamLicense: {
        title: "Beam 许可证",
        description: "代码公开可查看，但不是开源软件。内核和隧道是开源的。",
        appAndBridge: "应用与桥接层 · Beam Source License 1.0",

        component: {
            desktop: "应用",
            bridge: "内核桥接层",
            core: "基于 Xray 的内核",
            tun: "隧道",
        },

        allowedTitle: "允许",
        allowed: {
            use: { title: "使用", hint: "使用官方版本，在家、在工作中或在公司内都可以" },
            read: { title: "阅读代码", hint: "研究并核实 Beam 做了什么、怎么做的" },
            build: { title: "自行构建和修改", hint: "在自己的设备上，供个人或内部使用" },
            contribute: { title: "提交修改", hint: "按 CLA 条款提交 Pull Request" },
            fork: { title: "在 GitHub 上 Fork", hint: "用于准备和提交你的修改" },
            quote: { title: "引用", hint: "在文章和讨论中引用简短片段，需注明出处" },
            recommend: { title: "推荐给客户", hint: "服务商可提供版本下载链接和订阅标头" },
        },

        forbiddenTitle: "禁止",
        forbidden: {
            distribute: { title: "分发和销售", hint: "Beam 及其修改版，无论源码还是安装包" },
            stores: { title: "上架应用商店", hint: "以及镜像站、软件包仓库、安装包下载站" },
            rebrand: { title: "更换品牌", hint: "换个名称、标志，或基于 Beam 做自己的产品" },
            compete: { title: "开发竞品", hint: "把代码、设计或素材用于自己或他人的客户端" },
            saas: { title: "作为服务运营", hint: "为他人提供云端或托管的 Beam" },
            copyright: { title: "删除版权声明", hint: "删除或隐藏作者和许可证声明" },
            bypass: { title: "绕过保护", hint: "绕过签名、更新和完整性检查以便分发" },
        },

        mpl: {
            title: "beam-core 和 beam-tun · MPL-2.0",
            description: "可以使用、修改和分发，包括用于你自己的产品。修改过的文件须以 MPL-2.0 开源，并保留版权声明。",
        },

        fineTitle: "须知",
        fine: {
            trademarks: "“Beam”“Acelate”名称及标志均为商标，本许可证不授予相关权利。",
            termination: "违反条款即丧失权利。若为初次违反，且在收到通知后 30 天内纠正，权利可恢复。",
            warranty: "Beam 按“原样”提供，不附带任何保证。",
            permission: "需要做被禁止的事？可以在获得 Acelate 书面许可后进行。",
            legal: "具有法律效力的是仓库中 LICENSE 文件的完整文本。",
        },
    },
} satisfies LocaleShape<typeof ru>
