/**
 * Настройки → Для разработчиков (скрытый раздел)
 * Турецкий. Структура повторяет ru/settings/developer.ts.
 */
import type ru from "../../ru/settings/developer"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Geliştirici",

    // ─── Эмуляция статуса VPN ───────────────────────────────────────────

    emulate: {
        title: "VPN durumu öykünmesi",
        description: "Gerçek VPN olmadan bağlantı düğmesinin görünümünü değiştirir. Animasyonları denetlemek için kullanışlı.",
        current: "Geçerli durum:",
        note: "Gerçek bir VPN bağlantısı kurulmaz ya da kesilmez.",
        status: {
            disconnected: "Bağlı değil",
            connecting: "Bağlanıyor...",
            connected: "Bağlı",
            connectedNoInternet: "İnternet yok",
            disconnecting: "Bağlantı kesiliyor...",
            error: "Hata",
        },
    },

    // ─── Симуляция платформы ────────────────────────────────────────────

    platform: {
        title: "Platform simülasyonu",
        description: "Başka bir işletim sisteminin arayüzünü gösterir: pencere düğmeleri, logo. Hemen uygulanır.",
        current: "Geçerli platform:",
        auto: "Otomatik",
        note: "Etkin düğmeye yeniden tıklamak otomatik algılamaya, yani Go'dan gelen platforma döndürür.",
    },

    // ─── Проверка уведомлений ───────────────────────────────────────────
    // button.* — подписи кнопок, sample.* — текст самих тестовых тостов

    toastDemo: {
        title: "Bildirimler",
        description: "Her türden bildirimi gösterir: görünümü, yığılmayı ve düğme davranışını denetlemek için.",
        button: {
            success: "Başarılı",
            error: "Hata",
            warning: "Uyarı",
            info: "Bilgi",
            plain: "Simgesiz",
            loadingSuccess: "Yükleme → başarılı",
            loadingError: "Yükleme → hata",
            actions: "Düğmeli",
            long: "Uzun metin",
            burst: "Toplu",
            dismissAll: "Tümünü kapat",
        },
        sample: {
            profileUpdated: "Profil güncellendi",
            serverSwitchFailed: "Sunucu değiştirilemedi",
            subscriptionExpiring: "Aboneliğin bitmesine 3 gün kaldı",
            subscriptionExpiringHint: "Erişimi kaybetmemek için sağlayıcınızdan yenileyin.",
            updateAvailable: "2.0.2 güncellemesi mevcut",
            linkCopied: "Bağlantı kopyalandı",
            updatingProfile: "Profil güncelleniyor…",
            updateFailed: "Güncellenemedi",
            updateFailedHint: "Abonelik sunucusu 502 döndürdü",
            addProfile: "Profil eklensin mi?",
            addProfileSource: "Kaynak: example.com",
            add: "Ekle",
            profileAdded: "Profil eklendi",
            longTitle: "Çok uzun adlı bir düğümün yapılandırması kaydedilemedi",
            pingFailed: "Ping ölçülemedi",
        },
    },

    // ─── Ядро Xray ──────────────────────────────────────────────────────

    core: {
        title: "Xray çekirdeği",
        description: "Tanılama ve yapılandırma incelemesi.",
        logs: {
            title: "Çekirdek günlükleri",
            description: "Xray çekirdek günlüğünü belleğe ve core.log dosyasına yazar. Kapatmak belleği hemen boşaltır; bellek tasarrufunun en etkili yolu budur.",
        },
        tunLogs: {
            title: "TUN günlükleri",
            description: "Gelişmiş tünel tanılaması (beam-debug) ve günlüklerin logs/ klasörüne yazılması. Varsayılan olarak kapalı, hiçbir şey yazılmaz.",
        },
        trace: {
            title: "TRACE günlüğü",
            description: "Xray için TRACE düzeyini açar. Bir sonraki bağlantıda uygulanır.",
        },
        reality: {
            title: "REALITY hata ayıklama günlükleri",
            description: "Tanılama için REALITY el sıkışmasının ayrıntıları. Bir sonraki bağlantıda uygulanır.",
        },
        config: {
            title: "Geçerli yapılandırma",
            description: "Etkin profilin JSON yapılandırmasını gösterir, kopyalanabilir.",
            open: "Aç",
            dialogTitle: "Xray yapılandırması",
            noProfile: "Etkin profil yok",
            close: "Kapat",
        },
    },

    // ─── Опасная зона ───────────────────────────────────────────────────

    danger: {
        title: "Tehlikeli bölge",
        description: "Uygulama verileriyle ilgili geri alınamaz işlemler.",
        reset: {
            title: "Tüm verileri sıfırla",
            description: "Tüm profilleri ve ayarları siler. Geliştirici modu açık kalır.",
            button: "Sıfırla",
        },
        disable: {
            title: "Geliştirici modunu kapat",
            description: "Bu bölümü ayarlardan gizler. Yeniden açmak için \"Hakkında\" bölümünde logoya 10 kez tıklayın.",
            button: "Kapat",
        },
    },

    resetDialog: {
        title: "Tüm verileri sıfırla",
        // <b> — жирный фрагмент
        description: "Bu işlem <b>tüm profilleri</b> silecek ve uygulama ayarlarını sıfırlayacak. Geri alınamaz.",
        resetting: "Sıfırlanıyor...",
        confirm: "Evet, sıfırla",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        coreLogsFailed: "Çekirdek günlükleri açılıp kapatılamadı",
        tunLogsFailed: "TUN günlükleri açılıp kapatılamadı",
        logLevelFailed: "Günlük düzeyi değiştirilemedi",
        realityFailed: "REALITY hata ayıklama günlükleri değiştirilemedi",
        emulateFailed: "Öykünme hatası",
        resetFailed: "Sıfırlama hatası",
    },
} satisfies LocaleShape<typeof ru>
