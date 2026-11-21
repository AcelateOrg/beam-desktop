/**
 * Маршрутизация ProTun: холст со схемой правил.
 * Турецкий. Структура повторяет ru/protun.ts.
 */
import type ru from "../ru/protun"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Yönlendirme",

    tooSmall: {
        title: "Pencereyi biraz büyütün",
        description: "ProTun tuvali daha fazla alana ihtiyaç duyuyor. Pencereyi büyütün, kurallarınız çalışmaya devam ediyor.",
    },

    // ─── Панель над холстом ─────────────────────────────────────────────

    toolbar: {
        blocks: "Bloklar",
        showPalette: "Blok panelini göster",
        hidePalette: "Blok panelini gizle",
        open: "Aç",
        export: ".protun olarak dışa aktar",
        newCanvas: "Yeni tuval",
    },

    // ─── Чьи правила редактируем (переключатель слева вверху) ───────────

    scope: {
        global: "Genel",
        globalHint: "Tüm profiller için geçerli",
        profilesHeader: "Profiller · genel kurallardan önce gelir",
        profileFallback: "Profil",
        providerRules: "Sağlayıcı kuralları",
        ownRules: "Kendi kurallarım",
        active: "Etkin",
    },

    // ─── Плашки над холстом ─────────────────────────────────────────────

    notice: {
        providerLocked: "Bu profilin kurallarını sağlayıcı belirler. Kendi kurallarınızı \"Genel\" bölümüne ekleyin, sağlayıcı kurallarından sonra uygulanırlar.",
        providerPreset: "Bunlar sağlayıcının kuralları. Değiştirirseniz bu profil için sizin kurallarınız hâline gelirler.",
        profileRules: "Yalnızca bu profil için geçerlidir ve genel kurallardan önce gelir.",
    },

    conflicts: {
        one: "Kural çakışması",
        many: "{{count}} kural çakışması",
        blocksConnect: ": düzeltilene kadar VPN bağlanmaz",
        blocksPro: ": Pro modunda bu şemayla VPN bağlanmaz",
        showOnCanvas: "Tuvalde göster",
        andMore: "{{count}} tane daha",
    },

    // ─── Холст ──────────────────────────────────────────────────────────

    canvas: {
        placeHint: "Yerleştirmek için tuvale tıklayın · iptal için Esc",
        emptyTitle: "Tuval boş",
        emptyDescription: "Bir trafik kaynağı ve bir hedef ekleyip bunları birbirine bağlayın.",
        openFile: ".protun aç",
        addHere: "Buraya ekle",
        cutEdge: "Bağlantıyı sil",
    },

    newCanvasDialog: {
        title: "Yeni tuval açılsın mı?",
        description: "\"{{scope}}\" içindeki tüm kurallar silinecek (diskteki dahil). Hâlâ lazımsa önce .protun olarak dışa aktarın.",
        confirm: "Temizle",
    },

    // ─── Панель блоков и меню добавления ────────────────────────────────

    palette: {
        title: "Bloklar",
        hint: "Tuvale sürükleyin ya da tıklayıp ardından tuvale tıklayın",
        hide: "Paneli gizle",
        alreadyOnCanvas: "Zaten tuvalde",
        alreadyOnCanvasSuffix: " · zaten tuvalde",
        emptyList: "Liste boş",
        add: "Ekle",

        group: {
            sources: "Trafik kaynakları",
            fallback: "Kalan trafik",
            destinations: "Hedefler",
            logic: "Mantık",
            other: "Diğer",
        },
    },

    contextMenu: {
        duplicate: "Çoğalt",
        delete: "Sil",
        countSuffix: " ({{count}})",
    },

    // ─── Карточки правил ────────────────────────────────────────────────
    // label — название, description — подпись под ним, itemLabel/itemHint —
    // поле ввода значения, statusText — что происходит с трафиком

    kind: {
        apps: {
            label: "Uygulamalar",
            description: "İşlem adına göre",
            itemLabel: "İşlem adı",
            itemHint: "Virgülle birden fazla: chrome.exe, telegram.exe",
        },
        domains: {
            label: "Alan adları",
            description: "Siteler ve alt alan adları",
            itemLabel: "Alan adı veya joker",
            itemHint: "Virgülle birden fazla: youtube.com, *.google.com",
        },
        ipRanges: {
            label: "IP / alt ağlar",
            description: "IP adresleri ve CIDR",
            itemLabel: "IP adresi veya CIDR",
            itemHint: "Virgülle birden fazla: 192.168.1.0/24, 10.0.0.1",
        },
        geoip: {
            label: "Ülkeler",
            description: "Ülkeye göre IP'ler",
        },
        geosite: {
            label: "Site kategorileri",
            description: "Hazır alan adı listeleri",
        },
        ports: {
            label: "Portlar",
            description: "Port numaraları ve aralıkları",
            placeholder: "443 veya 1000-2000",
            itemLabel: "Port veya aralık",
            itemHint: "1–65535 arası portlar, aralıklar tire ile. Virgülle birden fazla: 80, 443, 1000-2000.",
            range: "aralık",
        },
        protocols: {
            label: "Protokoller",
            description: "Trafik türüne göre",
        },
        network: {
            label: "Ağ",
            description: "TCP veya UDP",
        },
        vpn: {
            label: "VPN üzerinden",
            description: "Tünelde şifrelenir",
            statusText: "VPN sunucusu üzerinden",
        },
        server: {
            label: "Belirli sunucu",
            description: "Seçtiğiniz tek bir sunucu",
            statusText: "Her zaman seçili sunucu üzerinden",
        },
        direct: {
            label: "Doğrudan",
            description: "Tünelin dışından",
            statusText: "VPN yokmuş gibi, kendi IP'nizle",
        },
        block: {
            label: "Engelle",
            description: "Bağlantıyı keser",
            statusText: "Site veya uygulama açılmaz",
        },
        other: {
            label: "Kalan trafik",
            description: "Hiçbir kurala uymayan trafik",
            statusText: "Tüm kurallardan sonra denetlenir",
        },
    },

    // Галочки в карточках «Протоколы» и «Сеть»
    protocol: {
        bittorrent: "Torrent: eşler, DHT, izleyiciler",
        quic: "HTTP/3: YouTube, Google ve diğerleri",
        tls: "Şifreli siteler (HTTPS)",
        http: "Şifresiz siteler",
        tcp: "Web, indirmeler, çoğu uygulama",
        udp: "Oyunlar, aramalar, QUIC",
    },

    logic: {
        and: {
            label: "VE",
            description: "Tüm koşullar",
            note: "Tüm girişler eşleştiğinde çalışır",
        },
        or: {
            label: "VEYA",
            description: "Herhangi bir koşul",
            note: "En az bir giriş eşleştiğinde çalışır",
        },
    },

    comment: {
        title: "Not",
        description: "Tuvaldeki açıklama",
        placeholder: "Tuvalin bu kısmı için bir not yazın...",
    },

    // ─── Содержимое карточки правила ────────────────────────────────────

    rule: {
        only: "Yalnızca bunlar",
        except: "Bunlar dışında hepsi",
        allApps: "Tüm uygulamalar",
        everything: "İstisnasız her şey",
        emptyList: "Liste boş",
        searchIn: "{{count}} öğe içinde ara",
        clearSearch: "Aramayı temizle",
        legacyExcept: "İstisnalar: {{count}}",
        reset: "Sıfırla",
        add: "Ekle",
        pickRunning: "Çalışan uygulamalardan seç",
        invalidPort: "Geçersiz port: 1–65535 arası bir sayı ya da 1000-2000 gibi bir aralık girin.",
    },

    order: {
        priority: "Öncelik #{{rank}} / {{total}}",
        explain: "Tuvalde yukarıda olan kartın kuralları önce denetlenir.",
        overrides: "İki kurala birden uyan trafik {{ranks}} yerine buraya gelir.",
        rank: "#{{rank}}",
        shadowed: "Hiç çalışmaz: #{{rank}} daha yukarıda ve tüm trafiği alıyor. Bu kartı onun üstüne taşıyın.",
    },

    conflictCard: {
        title: "Kural çakışması",
        sameConditions:
            "Koşullar birebir aynı. Kartlardan birini diğerinin üstüne taşıyın (üstteki kazanır) ya da ikisini tek kartta birleştirin.",
        overlap: "Kartlardan birini diğerinin üstüne taşıyın (üstteki kazanır), yinelenen değerleri silin ya da kuralı VE bloğuyla daraltın.",
    },

    // ─── Карточка «Сервер» и выбор сервера ──────────────────────────────

    server: {
        fallbackName: "Sunucu",
        fallbackProfile: "Profil",
        choose: "Sunucu seçin",
        missing: "Sunucu bulunamadı",
        missingFallback: "Sunucu bulunamadı, VPN üzerinden gidiyor",
        notChosen: "Seçilmedi, şimdilik VPN üzerinden",
        via: "üzerinden",
        viaDirect: "doğrudan",
        removeVia: "Ara sunucuyu kaldır",

        picker: {
            title: "Bu kural için sunucu seçin",
            search: "Sunucu ara",
            ping: "Ping",
            pingHint: "Gecikmeyi ölç",
            noServers: "Bu profilde sunucu yok",
            latency: "{{value}} ms",
        },
    },

    // ─── Выбор стран и категорий сайтов ─────────────────────────────────

    geo: {
        titleCountries: "Ülkeler ve IP listeleri",
        titleCategories: "Site kategorileri",
        selected: "{{count}} seçili",
        searchCountries: "Almanya, de, ru-blocked…",
        searchCategories: "youtube, reklam, ru-blocked…",
        downloading: "Veritabanı indiriliyor…",
        downloadingHint: "Yalnızca bir kez indirilir, sonra kendiliğinden güncellenir",
        downloadFailed: "Veritabanı indirilemedi. Bağlantınızı kontrol edip tekrar deneyin.",
        loadFailed: "Veritabanı yüklenemedi",
        retry: "Tekrar dene",
        popular: "Popüler",
        all: "Tümü",
        attributes: "Kategori öznitelikleri (@ads, @cn …)",
        attributesLoading: "Öznitelikler okunuyor…",
        attributesFailed: "Öznitelikler okunamadı",
        attributesNone: "Bu kategorinin özniteliği yok",
        more: "{{count}} tane daha, aramayı daraltın",
        done: "Tamam",

        // Названия списков, у которых нет общепринятого имени бренда
        label: {
            private: "Yerel ağ",
            ruBlocked: "Rusya'da engelli",
            ruBlockedCommunity: "Rusya'da engelli (topluluk)",
            ruBlockedAll: "Rusya'da engelli (tümü)",
            ruAvailableOnlyInside: "Yalnızca Rusya içinden erişilebilir",
            categoryAdsAll: "Reklam",
            categoryAds: "Reklam (temel)",
            categoryRu: "Rus siteleri",
            categoryGovRu: "Rus devlet siteleri",
            categoryGames: "Oyunlar",
            categoryAi: "Yapay zekâ hizmetleri",
            yandex: "Yandex",
            vk: "VK",
        },
    },

    // ─── Файл .protun ───────────────────────────────────────────────────

    file: {
        untitled: "Adsız",
        saveFailed: "Dosya kaydedilemedi",
        readFailed: "Dosya okunamadı",
    },

    // Ошибки и предупреждения при открытии повреждённого файла
    parse: {
        nodeNotObject: "Düğüm #{{index}}: nesne bekleniyordu",
        nodeNoId: "Düğüm #{{index}}: id yok ya da boş",
        nodeBadPosition: "Düğüm \"{{id}}\": geçersiz konum",
        nodeUnknownKind: "Düğüm \"{{id}}\": bilinmeyen tür \"{{kind}}\"",
        edgesBroken: "Bağlantı listesi bozuk, yok sayıldı",
        edgeBroken: "Bağlantı #{{index}}: bozuk, atlandı",
        edgeMissingNode: "Bağlantı #{{index}}: var olmayan bir düğüme işaret ediyor, atlandı",
        edgeComment: "Bağlantı #{{index}}: notlar bağlanamaz, atlandı",
        edgeDirection: "Bağlantı #{{index}}: geçersiz yön, atlandı",
        edgeOtherToLogic: "Bağlantı #{{index}}: \"Kalan trafik\" mantık bloğuna bağlanamaz, atlandı",
        edgeDuplicateSource: "Bağlantı #{{index}}: kaynağın zaten bir çıkış bağlantısı var, atlandı",
        notJson: "Dosya bozuk: JSON değil",
        notObject: "Dosya bozuk: nesne bekleniyordu",
        notProtun: "Bu bir .protun dosyası değil",
        unsupportedVersion: "Desteklenmeyen biçim sürümü ({{version}}). Uygulamayı güncelleyin.",
        noGraph: "Dosya bozuk: graf verisi yok",
        duplicateId: "Yinelenen düğüm id'si: \"{{id}}\"",
        multipleOther: "Birden fazla \"Kalan trafik\" kartı var, yalnızca biri kullanılacak",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        otherOnlyToDestination: "\"Kalan trafik\" yalnızca bir hedefe (VPN, doğrudan veya engelle) bağlanabilir",
        logicCycle: "Mantık blokları döngü oluşturamaz",
        saveFailed: "Kurallar kaydedilemedi",
        loadFailed: "ProTun kuralları yüklenemedi",
        exported: "Şema kaydedildi",
        exportFailed: "Şema kaydedilemedi",
        importWarnings: "Yüklendi, {{count}} uyarı var",
        importFailed: "Yüklenemedi",
        modeFailed: "Mod değiştirilemedi",
    },
} satisfies LocaleShape<typeof ru>
