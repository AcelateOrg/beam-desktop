/**
 * Настройки → Соединение
 * Турецкий. Структура повторяет ru/settings/connection.ts.
 */
import type ru from "../../ru/settings/connection"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Bağlantı",

    // ─── Карточка «Режим работы» ────────────────────────────────────────

    mode: {
        title: "Çalışma modu",
        description: "BEAM'in ağ trafiğini nasıl yönlendireceği",
        tun: {
            title: "TUN arayüzü",
            description: "Önerilen mod. Cihazdaki tüm sistem trafiği tünele alınır.",
        },
        systemProxy: {
            title: "Sistem proxy'si",
            description: "Trafik sistem ayarları üzerinden gider. Bazı uygulamalar bunu atlayabilir.",
        },
        flakyMac: "macOS'te sistem proxy'si her yerde çalışmaz, TUN daha iyi",
        flakyLinux: "Linux'ta sistem proxy'si her yerde çalışmaz, TUN daha iyi",
        address: "Adres",
        port: "Port",
    },

    // ─── Карточка «Защита от утечек» (Kill Switch) ──────────────────────

    killSwitch: {
        title: "Sızıntı koruması",
        description: "Hiçbir şey VPN'in dışına çıkmaz",
        row: "VPN koparsa yeniden bağlanana kadar internet duraklatılır",
        details: "Yalnızca VPN kendiliğinden koptuğunda devreye girer. Elle bağlantıyı keserseniz internet hemen normale döner. Duraklatma sırasında BEAM ve yerel ağ çalışmaya devam eder.",
        detailsTun: " TUN modunda DNS ve IPv6 sızıntılarını da engeller.",
        enabled: "Kill Switch açık",
        disabled: "Kill Switch kapalı",
    },

    // ─── Карточка «DNS» ─────────────────────────────────────────────────

    dns: {
        title: "DNS",
        description: "Sorgular VPN üzerinden gider",
        adguardCaption: "Reklamsız",
        custom: "Özel",
        customCaption: "Kendi sunucunuz",
        primary: "Birincil",
        primaryPlaceholder: "1.1.1.1 veya https://…",
        secondary: "İkincil",
        secondaryPlaceholder: "isteğe bağlı",
        fromProfile: {
            title: "Profildeki DNS",
            description: "Abonelik yapılandırmasında kendi DNS'i varsa onu kullan. Kendi DNS'i olmayan sunucular için yukarıda seçilen kullanılır",
        },
        error: {
            empty: "Bir DNS sunucusu girin",
            local: "Yerel DNS kullanılamaz: sorgular tünel içinde döngüye girer",
        },
    },

    // ─── Карточка «Фрагментация» ────────────────────────────────────────

    fragment: {
        title: "Parçalama",
        description: "Sağlayıcınız VPN'i engelliyorsa işe yarar",
        mode: {
            off: { label: "Kapalı", caption: "Olduğu gibi" },
            standard: { label: "Normal", caption: "Çoğu kişiye uyar" },
            strong: { label: "Güçlü", caption: "Normal işe yaramazsa" },
            custom: { label: "Özel", caption: "Kendi parametreleriniz" },
        },
        packets: "Paketler",
        packetsPlaceholder: "tlshello veya 1-3",
        length: "Parça boyutu, bayt",
        interval: "Aralık, ms",
        maxSplit: "En fazla parça",
        maxSplitPlaceholder: "sınırsız",
        noise: "Bağlantı öncesi gürültü",
        noiseAdd: "Ekle",
        noiseDelay: "ms",
        noiseRemove: "Sil",
        noiseType: {
            rand: "Rastgele",
            str: "Metin",
            hex: "HEX",
            base64: "Base64",
        },
        direct: {
            title: "Doğrudan trafik",
            description: "VPN dışından giden siteleri de parçala",
        },
    },

    // ─── Карточка «Мультиплексирование» ─────────────────────────────────

    mux: {
        title: "Çoğullama",
        description: "Sunucuyla tek bağlantıda birden fazla akış",
        row: "Bağlantıları daha hızlı açar. Sunucu desteği gerekir",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "Ayarlar yüklenemedi",
        checkDns: "DNS'i kontrol edin",
        saved: "Ayarlar kaydedildi",
        savedHint: "Yeniden bağlandıktan sonra uygulanır",
        saveFailed: "Ayarlar kaydedilemedi",
        noData: "veri yok",
        sectionSaveFailed: "kaydedilemedi",
    },
} satisfies LocaleShape<typeof ru>
