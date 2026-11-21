/**
 * Маршрутизация ProTun: холст со схемой правил.
 * Структура повторяет ru/protun.ts.
 */
import type ru from "../ru/protun"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Routing",

    tooSmall: {
        title: "Make the window bigger",
        description: "The ProTun canvas needs more room. Resize the window. Your rules are still there and still working.",
    },

    // ─── Панель над холстом ─────────────────────────────────────────────

    toolbar: {
        blocks: "Blocks",
        showPalette: "Show blocks panel",
        hidePalette: "Hide blocks panel",
        open: "Open",
        export: "Export .protun",
        newCanvas: "New canvas",
    },

    // ─── Чьи правила редактируем (переключатель слева вверху) ───────────

    scope: {
        global: "Global",
        globalHint: "For all profiles",
        profilesHeader: "Profiles · run before global",
        profileFallback: "Profile",
        providerRules: "Provider rules",
        ownRules: "Your rules",
        active: "active",
    },

    // ─── Плашки над холстом ─────────────────────────────────────────────

    notice: {
        providerLocked: "This profile's rules are set by the provider. Add your own under Global: they run after the provider's rules.",
        providerPreset: "These are the provider's rules. If you edit them, they become your own rules for this profile.",
        profileRules: "These only apply to this profile and run before the global rules.",
    },

    conflicts: {
        one: "Rule conflict",
        many: "{{count}} rule conflicts",
        blocksConnect: ": the VPN won't connect until you fix it",
        blocksPro: ": in Pro mode, the VPN won't connect with this setup",
        showOnCanvas: "Show on canvas",
        andMore: "and {{count}} more",
    },

    // ─── Холст ──────────────────────────────────────────────────────────

    canvas: {
        placeHint: "Click the canvas to place · Esc to cancel",
        emptyTitle: "Empty canvas",
        emptyDescription: "Add a traffic source and a destination, then connect them.",
        openFile: "Open .protun",
        addHere: "add here",
        cutEdge: "Remove connection",
    },

    newCanvasDialog: {
        title: "Start a new canvas?",
        description: "All rules in \"{{scope}}\" will be cleared, including on disk. If you still need them, export to .protun first.",
        confirm: "Clear",
    },

    // ─── Панель блоков и меню добавления ────────────────────────────────

    palette: {
        title: "Blocks",
        hint: "Drag onto the canvas, or click and then click where to place it",
        hide: "Hide panel",
        alreadyOnCanvas: "Already on canvas",
        alreadyOnCanvasSuffix: " · already on canvas",
        emptyList: "List is empty",
        add: "Add",

        group: {
            sources: "Traffic sources",
            fallback: "Fallback",
            destinations: "Destinations",
            logic: "Logic",
            other: "Other",
        },
    },

    contextMenu: {
        duplicate: "Duplicate",
        delete: "Delete",
        countSuffix: " ({{count}})",
    },

    // ─── Карточки правил ────────────────────────────────────────────────
    // label — название, description — подпись под ним, itemLabel/itemHint —
    // поле ввода значения, statusText — что происходит с трафиком

    kind: {
        apps: {
            label: "Apps",
            description: "By process name",
            itemLabel: "Process name",
            itemHint: "Separate multiple with commas: chrome.exe, telegram.exe",
        },
        domains: {
            label: "Domains",
            description: "Sites and subdomains",
            itemLabel: "Domain or wildcard",
            itemHint: "Separate multiple with commas: youtube.com, *.google.com",
        },
        ipRanges: {
            label: "IPs / Networks",
            description: "IP addresses and CIDR",
            itemLabel: "IP address or CIDR",
            itemHint: "Separate multiple with commas: 192.168.1.0/24, 10.0.0.1",
        },
        geoip: {
            label: "Countries",
            description: "IP addresses by country",
        },
        geosite: {
            label: "Site categories",
            description: "Ready-made domain lists",
        },
        ports: {
            label: "Ports",
            description: "Numbers and ranges",
            placeholder: "443 or 1000-2000",
            itemLabel: "Port or range",
            itemHint: "A port from 1 to 65535, or a range with a hyphen. Separate multiple with commas: 80, 443, 1000-2000.",
            range: "range",
        },
        protocols: {
            label: "Protocols",
            description: "By traffic type",
        },
        network: {
            label: "Network",
            description: "TCP or UDP",
        },
        vpn: {
            label: "Via VPN",
            description: "Encrypted in the tunnel",
            statusText: "Goes through the VPN server",
        },
        server: {
            label: "Server",
            description: "A specific server",
            statusText: "Always through the selected server",
        },
        direct: {
            label: "Direct",
            description: "Bypass the tunnel",
            statusText: "As if there's no VPN, from your own IP",
        },
        block: {
            label: "Block",
            description: "Drop the connection",
            statusText: "The site or app won't load",
        },
        other: {
            label: "Everything else",
            description: "Anything no rule matched",
            statusText: "Checked after all other rules",
        },
    },

    // Галочки в карточках «Протоколы» и «Сеть»
    protocol: {
        bittorrent: "Torrents: peers, DHT, trackers",
        quic: "HTTP/3: YouTube, Google and more",
        tls: "Encrypted sites (HTTPS)",
        http: "Unencrypted sites",
        tcp: "Websites, downloads, most apps",
        udp: "Games, calls, QUIC",
    },

    logic: {
        and: {
            label: "AND block",
            description: "All conditions",
            note: "Matches only if ALL inputs match",
        },
        or: {
            label: "OR block",
            description: "Any condition",
            note: "Matches if AT LEAST ONE input matches",
        },
    },

    comment: {
        title: "Note",
        description: "A comment on the canvas",
        placeholder: "Add a note about this part of the canvas...",
    },

    // ─── Содержимое карточки правила ────────────────────────────────────

    rule: {
        only: "Only these",
        except: "All except",
        allApps: "All apps",
        everything: "Everything, no exceptions",
        emptyList: "List is empty",
        searchIn: "Search {{count}} entries",
        clearSearch: "Clear search",
        legacyExcept: "Exceptions: {{count}}",
        reset: "reset",
        add: "Add",
        pickRunning: "Pick from running apps",
        invalidPort: "Invalid port: use a number from 1 to 65535 or a range like 1000-2000.",
    },

    order: {
        priority: "Priority #{{rank}} of {{total}}",
        explain: "The higher a card sits on the canvas, the earlier its rule is checked.",
        overrides: "Takes traffic that matches both rules away from {{ranks}}.",
        rank: "#{{rank}}",
        shadowed: "Never matches: #{{rank}} sits higher and takes all the traffic. Move this card above it.",
    },

    conflictCard: {
        title: "Rule conflict",
        sameConditions:
            "The conditions are identical. Move one card above the other (the top one wins), or merge them into a single card.",
        overlap: "Move one card above the other (the top one wins), remove the shared value, or narrow the rule with an AND block.",
    },

    // ─── Карточка «Сервер» и выбор сервера ──────────────────────────────

    server: {
        fallbackName: "Server",
        fallbackProfile: "Profile",
        choose: "Choose a server",
        missing: "Server not found",
        missingFallback: "Server not found, using VPN",
        notChosen: "Not selected yet, using VPN",
        via: "Via",
        viaDirect: "Direct",
        removeVia: "Remove hop",

        picker: {
            title: "Server for this rule",
            search: "Search servers",
            ping: "Ping",
            pingHint: "Check ping",
            noServers: "This profile has no servers",
            latency: "{{value}} ms",
        },
    },

    // ─── Выбор стран и категорий сайтов ─────────────────────────────────

    geo: {
        titleCountries: "Countries and IP lists",
        titleCategories: "Site categories",
        selected: "{{count}} selected",
        searchCountries: "Germany, de, ru-blocked…",
        searchCategories: "youtube, ads, ru-blocked…",
        downloading: "Downloading the database…",
        downloadingHint: "Just once, after that it updates on its own",
        downloadFailed: "Couldn't download the database. Check your internet connection and try again.",
        loadFailed: "Couldn't load the database",
        retry: "Retry",
        popular: "Popular",
        all: "All",
        attributes: "Category attributes (@ads, @cn …)",
        attributesLoading: "Loading attributes…",
        attributesFailed: "Couldn't load attributes",
        attributesNone: "This category has no attributes",
        more: "{{count}} more. Refine your search",
        done: "Done",

        // Названия списков, у которых нет общепринятого имени бренда
        label: {
            private: "Local networks",
            ruBlocked: "Blocked in Russia",
            ruBlockedCommunity: "Blocked in Russia (community)",
            ruBlockedAll: "Blocked in Russia (all)",
            ruAvailableOnlyInside: "Only work from Russia",
            categoryAdsAll: "Ads",
            categoryAds: "Ads (basic)",
            categoryRu: "Russian sites",
            categoryGovRu: "Russian government sites",
            categoryGames: "Games",
            categoryAi: "AI services",
            yandex: "Yandex",
            vk: "VK",
        },
    },

    // ─── Файл .protun ───────────────────────────────────────────────────

    file: {
        untitled: "Untitled",
        saveFailed: "Couldn't save the file",
        readFailed: "Couldn't read the file",
    },

    // Ошибки и предупреждения при открытии повреждённого файла
    parse: {
        nodeNotObject: "Node #{{index}}: expected an object",
        nodeNoId: "Node #{{index}}: id is missing or empty",
        nodeBadPosition: "Node \"{{id}}\": invalid position",
        nodeUnknownKind: "Node \"{{id}}\": unknown type \"{{kind}}\"",
        edgesBroken: "The connection list is corrupted and was ignored",
        edgeBroken: "Connection #{{index}}: corrupted, skipped",
        edgeMissingNode: "Connection #{{index}}: points to a node that doesn't exist, skipped",
        edgeComment: "Connection #{{index}}: notes can't be connected, skipped",
        edgeDirection: "Connection #{{index}}: invalid direction, skipped",
        edgeOtherToLogic: "Connection #{{index}}: \"Everything else\" can't be connected to a logic block, skipped",
        edgeDuplicateSource: "Connection #{{index}}: the source already has an outgoing connection, skipped",
        notJson: "The file is corrupted: it isn't JSON",
        notObject: "The file is corrupted: expected an object",
        notProtun: "This isn't a .protun file",
        unsupportedVersion: "Unsupported format version ({{version}}). Please update the app.",
        noGraph: "The file is corrupted: the graph is missing",
        duplicateId: "Duplicate node id: \"{{id}}\"",
        multipleOther: "Found more than one \"Everything else\" card. Only one of them will be used",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        otherOnlyToDestination: "\"Everything else\" can only connect to a destination (VPN, Direct or Block)",
        logicCycle: "Logic blocks can't be connected in a loop",
        saveFailed: "Couldn't save rules",
        loadFailed: "Couldn't load ProTun rules",
        exported: "Canvas saved",
        exportFailed: "Couldn't save the canvas",
        importWarnings: "Loaded with warnings ({{count}})",
        importFailed: "Couldn't load the file",
        modeFailed: "Couldn't switch mode",
    },
} satisfies LocaleShape<typeof ru>
