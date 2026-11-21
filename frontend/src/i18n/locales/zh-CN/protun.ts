/**
 * Маршрутизация ProTun: холст со схемой правил
 * Упрощённый китайский. Структура повторяет ru/protun.ts.
 */
import type ru from "../ru/protun"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "路由",

    tooSmall: {
        title: "请把窗口放大一些",
        description: "ProTun 画布需要更多空间。请调整窗口大小，你的规则仍然有效。",
    },

    // ─── Панель над холстом ─────────────────────────────────────────────

    toolbar: {
        blocks: "模块",
        showPalette: "显示模块面板",
        hidePalette: "隐藏模块面板",
        open: "打开",
        export: "导出 .protun",
        newCanvas: "新建画布",
    },

    // ─── Чьи правила редактируем (переключатель слева вверху) ───────────

    scope: {
        global: "全局",
        globalHint: "适用于所有配置文件",
        profilesHeader: "配置文件 · 优先于全局",
        profileFallback: "配置文件",
        providerRules: "服务商规则",
        ownRules: "自定义规则",
        active: "使用中",
    },

    // ─── Плашки над холстом ─────────────────────────────────────────────

    notice: {
        providerLocked: "此配置文件的规则由服务商设定。自定义规则请在“全局”中添加，它们会在服务商规则之后生效。",
        providerPreset: "这是服务商的规则。修改后，它们会成为你在此配置文件中的自定义规则。",
        profileRules: "仅对此配置文件生效，并优先于全局规则。",
    },

    conflicts: {
        one: "规则冲突",
        many: "{{count}} 处规则冲突",
        blocksConnect: "：修复前 VPN 无法连接",
        blocksPro: "：在 Pro 模式下，使用此方案 VPN 将无法连接",
        showOnCanvas: "在画布上显示",
        andMore: "还有 {{count}} 处",
    },

    // ─── Холст ──────────────────────────────────────────────────────────

    canvas: {
        placeHint: "点击画布放置 · 按 Esc 取消",
        emptyTitle: "画布为空",
        emptyDescription: "添加一个流量来源和一个目标，然后把它们连起来。",
        openFile: "打开 .protun",
        addHere: "在此添加",
        cutEdge: "删除连线",
    },

    newCanvasDialog: {
        title: "新建画布？",
        description: "“{{scope}}”中的所有规则都将被清除（包括磁盘上的）。如果还需要，请先导出为 .protun。",
        confirm: "清除",
    },

    // ─── Панель блоков и меню добавления ────────────────────────────────

    palette: {
        title: "模块",
        hint: "拖到画布上，或点击后再点击画布放置",
        hide: "隐藏面板",
        alreadyOnCanvas: "已在画布上",
        alreadyOnCanvasSuffix: " · 已在画布上",
        emptyList: "列表为空",
        add: "添加",

        group: {
            sources: "流量来源",
            fallback: "兜底",
            destinations: "目标",
            logic: "逻辑",
            other: "其他",
        },
    },

    contextMenu: {
        duplicate: "复制",
        delete: "删除",
        countSuffix: "（{{count}}）",
    },

    // ─── Карточки правил ────────────────────────────────────────────────
    // label — название, description — подпись под ним, itemLabel/itemHint —
    // поле ввода значения, statusText — что происходит с трафиком

    kind: {
        apps: {
            label: "应用",
            description: "按进程名",
            itemLabel: "进程名",
            itemHint: "多个用逗号分隔：chrome.exe, telegram.exe",
        },
        domains: {
            label: "域名",
            description: "网站及子域名",
            itemLabel: "域名或通配符",
            itemHint: "多个用逗号分隔：youtube.com, *.google.com",
        },
        ipRanges: {
            label: "IP / 网段",
            description: "IP 地址和 CIDR",
            itemLabel: "IP 地址或 CIDR",
            itemHint: "多个用逗号分隔：192.168.1.0/24, 10.0.0.1",
        },
        geoip: {
            label: "国家/地区",
            description: "按国家/地区划分的 IP",
        },
        geosite: {
            label: "网站分类",
            description: "现成的域名列表",
        },
        ports: {
            label: "端口",
            description: "端口号和范围",
            placeholder: "443 或 1000-2000",
            itemLabel: "端口或范围",
            itemHint: "端口范围 1–65535，范围用连字符表示。多个用逗号分隔：80, 443, 1000-2000。",
            range: "范围",
        },
        protocols: {
            label: "协议",
            description: "按流量类型",
        },
        network: {
            label: "网络",
            description: "TCP 或 UDP",
        },
        vpn: {
            label: "走 VPN",
            description: "在隧道中加密",
            statusText: "经由 VPN 服务器",
        },
        server: {
            label: "指定节点",
            description: "某个特定节点",
            statusText: "始终经由所选节点",
        },
        direct: {
            label: "直连",
            description: "绕过隧道",
            statusText: "和不开 VPN 一样，使用你自己的 IP",
        },
        block: {
            label: "拦截",
            description: "断开连接",
            statusText: "网站或应用将无法打开",
        },
        other: {
            label: "其余流量",
            description: "未匹配任何规则的流量",
            statusText: "在所有规则之后检查",
        },
    },

    // Галочки в карточках «Протоколы» и «Сеть»
    protocol: {
        bittorrent: "BT 下载：节点、DHT、Tracker",
        quic: "HTTP/3：YouTube、Google 等",
        tls: "加密网站（HTTPS）",
        http: "未加密网站",
        tcp: "网页、下载、大多数应用",
        udp: "游戏、通话、QUIC",
    },

    logic: {
        and: {
            label: "与（AND）",
            description: "满足全部条件",
            note: "所有输入都匹配时才生效",
        },
        or: {
            label: "或（OR）",
            description: "满足任一条件",
            note: "至少一个输入匹配时即生效",
        },
    },

    comment: {
        title: "备注",
        description: "画布上的说明",
        placeholder: "为这部分画布写点备注...",
    },

    // ─── Содержимое карточки правила ────────────────────────────────────

    rule: {
        only: "仅限这些",
        except: "除这些外全部",
        allApps: "所有应用",
        everything: "全部，无例外",
        emptyList: "列表为空",
        searchIn: "在 {{count}} 项中搜索",
        clearSearch: "清除搜索",
        legacyExcept: "例外：{{count}}",
        reset: "重置",
        add: "添加",
        pickRunning: "从运行中的应用选择",
        invalidPort: "端口无效：请输入 1–65535 之间的数字，或类似 1000-2000 的范围。",
    },

    order: {
        priority: "优先级 #{{rank}} / {{total}}",
        explain: "卡片在画布上的位置越高，其规则越先被检查。",
        overrides: "同时匹配两条规则的流量将从 {{ranks}} 转到这里。",
        rank: "#{{rank}}",
        shadowed: "永远不会生效：#{{rank}} 位置更高，拦下了全部流量。请把这张卡片移到它上方。",
    },

    conflictCard: {
        title: "规则冲突",
        sameConditions:
            "条件完全相同。请把其中一张卡片移到另一张上方（上方的优先），或者把它们合并成一张卡片。",
        overlap: "请把其中一张卡片移到另一张上方（上方的优先），或删除重复的值，或用“与”模块缩小规则范围。",
    },

    // ─── Карточка «Сервер» и выбор сервера ──────────────────────────────

    server: {
        fallbackName: "节点",
        fallbackProfile: "配置文件",
        choose: "选择节点",
        missing: "找不到节点",
        missingFallback: "找不到节点，改走 VPN",
        notChosen: "尚未选择，暂走 VPN",
        via: "经由",
        viaDirect: "直连",
        removeVia: "移除中转",

        picker: {
            title: "为此规则选择节点",
            search: "搜索节点",
            ping: "测速",
            pingHint: "测试延迟",
            noServers: "此配置文件中没有节点",
            latency: "{{value}} ms",
        },
    },

    // ─── Выбор стран и категорий сайтов ─────────────────────────────────

    geo: {
        titleCountries: "国家/地区与 IP 列表",
        titleCategories: "网站分类",
        selected: "已选 {{count}} 项",
        searchCountries: "德国, de, ru-blocked…",
        searchCategories: "youtube, 广告, ru-blocked…",
        downloading: "正在下载数据库…",
        downloadingHint: "只需下载一次，之后会自动更新",
        downloadFailed: "无法下载数据库。请检查网络后重试。",
        loadFailed: "无法加载数据库",
        retry: "重试",
        popular: "常用",
        all: "全部",
        attributes: "分类属性（@ads、@cn …）",
        attributesLoading: "正在读取属性…",
        attributesFailed: "无法读取属性",
        attributesNone: "此分类没有属性",
        more: "还有 {{count}} 项，请缩小搜索范围",
        done: "完成",

        // Названия списков, у которых нет общепринятого имени бренда
        label: {
            private: "局域网",
            ruBlocked: "在俄罗斯被封锁",
            ruBlockedCommunity: "在俄罗斯被封锁（社区版）",
            ruBlockedAll: "在俄罗斯被封锁（全部）",
            ruAvailableOnlyInside: "仅限俄罗斯境内访问",
            categoryAdsAll: "广告",
            categoryAds: "广告（基础）",
            categoryRu: "俄罗斯网站",
            categoryGovRu: "俄罗斯政府网站",
            categoryGames: "游戏",
            categoryAi: "AI 服务",
            yandex: "Yandex",
            vk: "VK",
        },
    },

    // ─── Файл .protun ───────────────────────────────────────────────────

    file: {
        untitled: "未命名",
        saveFailed: "无法保存文件",
        readFailed: "无法读取文件",
    },

    // Ошибки и предупреждения при открытии повреждённого файла
    parse: {
        nodeNotObject: "节点 #{{index}}：应为对象",
        nodeNoId: "节点 #{{index}}：id 缺失或为空",
        nodeBadPosition: "节点“{{id}}”：位置无效",
        nodeUnknownKind: "节点“{{id}}”：未知类型“{{kind}}”",
        edgesBroken: "连线列表已损坏，已忽略",
        edgeBroken: "连线 #{{index}}：已损坏，已跳过",
        edgeMissingNode: "连线 #{{index}}：指向不存在的节点，已跳过",
        edgeComment: "连线 #{{index}}：备注不能连线，已跳过",
        edgeDirection: "连线 #{{index}}：连接方向无效，已跳过",
        edgeOtherToLogic: "连线 #{{index}}：“其余流量”不能连接到逻辑模块，已跳过",
        edgeDuplicateSource: "连线 #{{index}}：来源已有一条输出连线，已跳过",
        notJson: "文件已损坏：不是 JSON",
        notObject: "文件已损坏：应为对象",
        notProtun: "这不是 .protun 文件",
        unsupportedVersion: "不支持的格式版本（{{version}}）。请更新应用。",
        noGraph: "文件已损坏：缺少图数据",
        duplicateId: "节点 id 重复：“{{id}}”",
        multipleOther: "发现多张“其余流量”卡片，只会使用其中一张",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        otherOnlyToDestination: "“其余流量”只能连接到目标（VPN、直连或拦截）",
        logicCycle: "逻辑模块不能形成循环连接",
        saveFailed: "无法保存规则",
        loadFailed: "无法加载 ProTun 规则",
        exported: "方案已保存",
        exportFailed: "无法保存方案",
        importWarnings: "已加载，但有 {{count}} 条警告",
        importFailed: "加载失败",
        modeFailed: "无法切换模式",
    },
} satisfies LocaleShape<typeof ru>
