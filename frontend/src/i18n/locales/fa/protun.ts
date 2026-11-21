/**
 * Маршрутизация ProTun: холст со схемой правил.
 * Фарси (RTL). Структура повторяет ru/protun.ts.
 */
import type ru from "../ru/protun"
import type { LocaleShape } from "../../locale-shape"

// \u2066…\u2069 (LRI…PDI) изолируют расширения файлов и схемы ссылок: без них точка
// в RTL уезжает в конец слова и выходит «protun.».
export default {
    title: "مسیریابی",

    tooSmall: {
        title: "پنجره را کمی بزرگ‌تر کنید",
        description: "بوم ProTun به فضای بیشتری نیاز دارد. پنجره را بزرگ کنید؛ قوانین شما همچنان کار می‌کنند.",
    },

    // ─── Панель над холстом ─────────────────────────────────────────────

    toolbar: {
        blocks: "بلوک‌ها",
        showPalette: "نمایش پنل بلوک‌ها",
        hidePalette: "پنهان کردن پنل بلوک‌ها",
        open: "باز کردن",
        export: "خروجی \u2066.protun\u2069",
        newCanvas: "بوم جدید",
    },

    // ─── Чьи правила редактируем (переключатель слева вверху) ───────────

    scope: {
        global: "سراسری",
        globalHint: "برای همهٔ پروفایل‌ها",
        profilesHeader: "پروفایل‌ها · مقدم بر قوانین سراسری",
        profileFallback: "پروفایل",
        providerRules: "قوانین ارائه‌دهنده",
        ownRules: "قوانین من",
        active: "فعال",
    },

    // ─── Плашки над холстом ─────────────────────────────────────────────

    notice: {
        providerLocked: "قوانین این پروفایل را ارائه‌دهنده تعیین می‌کند. قوانین خودتان را در «سراسری» اضافه کنید؛ بعد از قوانین ارائه‌دهنده اعمال می‌شوند.",
        providerPreset: "این‌ها قوانین ارائه‌دهنده‌اند. اگر تغییرشان دهید، به قوانین شخصی شما برای این پروفایل تبدیل می‌شوند.",
        profileRules: "فقط برای این پروفایل اعمال می‌شود و مقدم بر قوانین سراسری است.",
    },

    conflicts: {
        one: "تداخل قوانین",
        many: "{{count}} تداخل در قوانین",
        blocksConnect: ": تا رفع نشود، VPN وصل نمی‌شود",
        blocksPro: ": در حالت Pro با این طرح، VPN وصل نمی‌شود",
        showOnCanvas: "نمایش روی بوم",
        andMore: "و {{count}} مورد دیگر",
    },

    // ─── Холст ──────────────────────────────────────────────────────────

    canvas: {
        placeHint: "برای قرار دادن روی بوم کلیک کنید · Esc برای لغو",
        emptyTitle: "بوم خالی است",
        emptyDescription: "یک منبع ترافیک و یک مقصد اضافه کنید و آن‌ها را به هم وصل کنید.",
        openFile: "باز کردن \u2066.protun\u2069",
        addHere: "افزودن در اینجا",
        cutEdge: "حذف اتصال",
    },

    newCanvasDialog: {
        title: "بوم جدید؟",
        description: "همهٔ قوانین «{{scope}}» پاک می‌شوند (از جمله روی دیسک). اگر هنوز لازمشان دارید، اول خروجی \u2066.protun\u2069 بگیرید.",
        confirm: "پاک کردن",
    },

    // ─── Панель блоков и меню добавления ────────────────────────────────

    palette: {
        title: "بلوک‌ها",
        hint: "روی بوم بکشید، یا کلیک کنید و سپس روی بوم کلیک کنید",
        hide: "پنهان کردن پنل",
        alreadyOnCanvas: "از قبل روی بوم است",
        alreadyOnCanvasSuffix: " · از قبل روی بوم است",
        emptyList: "فهرست خالی است",
        add: "افزودن",

        group: {
            sources: "منابع ترافیک",
            fallback: "باقی ترافیک",
            destinations: "مقصدها",
            logic: "منطق",
            other: "سایر",
        },
    },

    contextMenu: {
        duplicate: "تکثیر",
        delete: "حذف",
        countSuffix: " ({{count}})",
    },

    // ─── Карточки правил ────────────────────────────────────────────────
    // label — название, description — подпись под ним, itemLabel/itemHint —
    // поле ввода значения, statusText — что происходит с трафиком

    kind: {
        apps: {
            label: "برنامه‌ها",
            description: "بر اساس نام فرایند",
            itemLabel: "نام فرایند",
            itemHint: "چند مورد را با کاما جدا کنید: chrome.exe, telegram.exe",
        },
        domains: {
            label: "دامنه‌ها",
            description: "سایت‌ها و زیردامنه‌ها",
            itemLabel: "دامنه یا الگو",
            itemHint: "چند مورد را با کاما جدا کنید: youtube.com, *.google.com",
        },
        ipRanges: {
            label: "IP / زیرشبکه",
            description: "آدرس‌های IP و CIDR",
            itemLabel: "آدرس IP یا CIDR",
            itemHint: "چند مورد را با کاما جدا کنید: 192.168.1.0/24, 10.0.0.1",
        },
        geoip: {
            label: "کشورها",
            description: "IPها بر اساس کشور",
        },
        geosite: {
            label: "دسته‌های سایت",
            description: "فهرست‌های آمادهٔ دامنه",
        },
        ports: {
            label: "پورت‌ها",
            description: "شماره و بازهٔ پورت",
            placeholder: "443 یا 1000-2000",
            itemLabel: "پورت یا بازه",
            itemHint: "پورت‌های 1 تا 65535، بازه‌ها با خط تیره. چند مورد را با کاما جدا کنید: 80, 443, 1000-2000.",
            range: "بازه",
        },
        protocols: {
            label: "پروتکل‌ها",
            description: "بر اساس نوع ترافیک",
        },
        network: {
            label: "شبکه",
            description: "TCP یا UDP",
        },
        vpn: {
            label: "از طریق VPN",
            description: "رمزنگاری‌شده در تونل",
            statusText: "از طریق سرور VPN",
        },
        server: {
            label: "سرور مشخص",
            description: "یک سرور مشخص",
            statusText: "همیشه از طریق سرور انتخاب‌شده",
        },
        direct: {
            label: "مستقیم",
            description: "خارج از تونل",
            statusText: "مثل حالت بدون VPN، با IP خودتان",
        },
        block: {
            label: "مسدود",
            description: "قطع اتصال",
            statusText: "سایت یا برنامه باز نمی‌شود",
        },
        other: {
            label: "باقی ترافیک",
            description: "ترافیکی که با هیچ قانونی جور نیست",
            statusText: "بعد از همهٔ قوانین بررسی می‌شود",
        },
    },

    // Галочки в карточках «Протоколы» и «Сеть»
    protocol: {
        bittorrent: "تورنت: همتاها، DHT، ترکرها",
        quic: "HTTP/3: یوتیوب، گوگل و غیره",
        tls: "سایت‌های رمزنگاری‌شده (HTTPS)",
        http: "سایت‌های بدون رمزنگاری",
        tcp: "وب، دانلودها، بیشتر برنامه‌ها",
        udp: "بازی‌ها، تماس‌ها، QUIC",
    },

    logic: {
        and: {
            label: "و (AND)",
            description: "همهٔ شرط‌ها",
            note: "وقتی همهٔ ورودی‌ها جور باشند اعمال می‌شود",
        },
        or: {
            label: "یا (OR)",
            description: "هر یک از شرط‌ها",
            note: "وقتی دست‌کم یک ورودی جور باشد اعمال می‌شود",
        },
    },

    comment: {
        title: "یادداشت",
        description: "توضیح روی بوم",
        placeholder: "برای این بخش از بوم یادداشتی بنویسید...",
    },

    // ─── Содержимое карточки правила ────────────────────────────────────

    rule: {
        only: "فقط این‌ها",
        except: "همه به‌جز این‌ها",
        allApps: "همهٔ برنامه‌ها",
        everything: "همه چیز، بدون استثنا",
        emptyList: "فهرست خالی است",
        searchIn: "جستجو در {{count}} مورد",
        clearSearch: "پاک کردن جستجو",
        legacyExcept: "استثناها: {{count}}",
        reset: "بازنشانی",
        add: "افزودن",
        pickRunning: "انتخاب از برنامه‌های در حال اجرا",
        invalidPort: "پورت نامعتبر: عددی بین 1 تا 65535 یا بازه‌ای مثل 1000-2000 وارد کنید.",
    },

    order: {
        priority: "اولویت #{{rank}} از {{total}}",
        explain: "کارتی که روی بوم بالاتر است، قوانینش زودتر بررسی می‌شود.",
        overrides: "ترافیکی که با هر دو قانون جور است، به‌جای {{ranks}} به اینجا می‌آید.",
        rank: "#{{rank}}",
        shadowed: "هرگز اعمال نمی‌شود: #{{rank}} بالاتر است و همهٔ ترافیک را می‌گیرد. این کارت را بالای آن ببرید.",
    },

    conflictCard: {
        title: "تداخل قوانین",
        sameConditions:
            "شرط‌ها دقیقاً یکسان‌اند. یکی از کارت‌ها را بالای دیگری ببرید (بالایی برنده است) یا هر دو را در یک کارت ادغام کنید.",
        overlap: "یکی از کارت‌ها را بالای دیگری ببرید (بالایی برنده است)، مقادیر تکراری را حذف کنید یا قانون را با بلوک «و» محدودتر کنید.",
    },

    // ─── Карточка «Сервер» и выбор сервера ──────────────────────────────

    server: {
        fallbackName: "سرور",
        fallbackProfile: "پروفایل",
        choose: "انتخاب سرور",
        missing: "سرور پیدا نشد",
        missingFallback: "سرور پیدا نشد، از طریق VPN می‌رود",
        notChosen: "انتخاب نشده، فعلاً از طریق VPN",
        via: "از طریق",
        viaDirect: "مستقیم",
        removeVia: "حذف سرور واسط",

        picker: {
            title: "انتخاب سرور برای این قانون",
            search: "جستجوی سرور",
            ping: "پینگ",
            pingHint: "سنجش تأخیر",
            noServers: "این پروفایل سروری ندارد",
            latency: "{{value}} ms",
        },
    },

    // ─── Выбор стран и категорий сайтов ─────────────────────────────────

    geo: {
        titleCountries: "کشورها و فهرست‌های IP",
        titleCategories: "دسته‌های سایت",
        selected: "{{count}} انتخاب‌شده",
        searchCountries: "آلمان، de، ru-blocked…",
        searchCategories: "youtube، تبلیغات، ru-blocked…",
        downloading: "در حال دانلود پایگاه داده…",
        downloadingHint: "فقط یک بار دانلود می‌شود و بعد خودکار به‌روز می‌شود",
        downloadFailed: "دانلود پایگاه داده انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید.",
        loadFailed: "بارگذاری پایگاه داده انجام نشد",
        retry: "تلاش دوباره",
        popular: "پرطرفدار",
        all: "همه",
        attributes: "ویژگی‌های دسته (@ads، @cn …)",
        attributesLoading: "در حال خواندن ویژگی‌ها…",
        attributesFailed: "خواندن ویژگی‌ها انجام نشد",
        attributesNone: "این دسته ویژگی ندارد",
        more: "{{count}} مورد دیگر، جستجو را محدودتر کنید",
        done: "تمام",

        // Названия списков, у которых нет общепринятого имени бренда
        label: {
            private: "شبکهٔ محلی",
            ruBlocked: "مسدود در روسیه",
            ruBlockedCommunity: "مسدود در روسیه (جامعه)",
            ruBlockedAll: "مسدود در روسیه (همه)",
            ruAvailableOnlyInside: "فقط از داخل روسیه",
            categoryAdsAll: "تبلیغات",
            categoryAds: "تبلیغات (پایه)",
            categoryRu: "سایت‌های روسی",
            categoryGovRu: "سایت‌های دولتی روسیه",
            categoryGames: "بازی‌ها",
            categoryAi: "سرویس‌های هوش مصنوعی",
            yandex: "Yandex",
            vk: "VK",
        },
    },

    // ─── Файл .protun ───────────────────────────────────────────────────

    file: {
        untitled: "بدون نام",
        saveFailed: "ذخیرهٔ فایل انجام نشد",
        readFailed: "خواندن فایل انجام نشد",
    },

    // Ошибки и предупреждения при открытии повреждённого файла
    parse: {
        nodeNotObject: "گره #{{index}}: باید شیء باشد",
        nodeNoId: "گره #{{index}}: id وجود ندارد یا خالی است",
        nodeBadPosition: "گره «{{id}}»: موقعیت نامعتبر",
        nodeUnknownKind: "گره «{{id}}»: نوع ناشناخته «{{kind}}»",
        edgesBroken: "فهرست اتصال‌ها خراب است و نادیده گرفته شد",
        edgeBroken: "اتصال #{{index}}: خراب است، رد شد",
        edgeMissingNode: "اتصال #{{index}}: به گرهٔ ناموجود اشاره می‌کند، رد شد",
        edgeComment: "اتصال #{{index}}: یادداشت قابل اتصال نیست، رد شد",
        edgeDirection: "اتصال #{{index}}: جهت نامعتبر، رد شد",
        edgeOtherToLogic: "اتصال #{{index}}: «باقی ترافیک» به بلوک منطق وصل نمی‌شود، رد شد",
        edgeDuplicateSource: "اتصال #{{index}}: منبع از قبل یک اتصال خروجی دارد، رد شد",
        notJson: "فایل خراب است: JSON نیست",
        notObject: "فایل خراب است: باید شیء باشد",
        notProtun: "این فایل \u2066.protun\u2069 نیست",
        unsupportedVersion: "نسخهٔ قالب پشتیبانی نمی‌شود ({{version}}). برنامه را به‌روز کنید.",
        noGraph: "فایل خراب است: دادهٔ گراف وجود ندارد",
        duplicateId: "id تکراری گره: «{{id}}»",
        multipleOther: "چند کارت «باقی ترافیک» وجود دارد؛ فقط یکی استفاده می‌شود",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        otherOnlyToDestination: "«باقی ترافیک» فقط به یک مقصد (VPN، مستقیم یا مسدود) وصل می‌شود",
        logicCycle: "بلوک‌های منطق نمی‌توانند حلقه بسازند",
        saveFailed: "ذخیرهٔ قوانین انجام نشد",
        loadFailed: "بارگذاری قوانین ProTun انجام نشد",
        exported: "طرح ذخیره شد",
        exportFailed: "ذخیرهٔ طرح انجام نشد",
        importWarnings: "بارگذاری شد، با {{count}} هشدار",
        importFailed: "بارگذاری انجام نشد",
        modeFailed: "تغییر حالت انجام نشد",
    },
} satisfies LocaleShape<typeof ru>
