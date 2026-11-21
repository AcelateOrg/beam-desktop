/**
 * Настройки → Приложение
 * Турецкий. Структура повторяет ru/settings/app.ts.
 */
import type ru from "../../ru/settings/app"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Uygulama",

    // ─── Карточка «Язык» ────────────────────────────────────────────────

    language: {
        title: "Dil",
        description: "BEAM arayüz dili",
        unavailable: "Çeviri yakında",
    },

    // ─── Карточка «Поведение» ───────────────────────────────────────────

    behavior: {
        title: "Davranış",
        description: "Uygulamanın sistemde nasıl başlayıp çalıştığı",

        launchOnStartup: {
            title: "Sistem açılışında başlat",
            description: "Oturum açtığınızda uygulamayı otomatik başlatır.",
            descriptionMacos: "macOS'te kullanılamıyor.",
        },
        autoConnect: {
            title: "Otomatik bağlan",
            description: "Açılışın hemen ardından son profille bağlanır.",
        },
        subscriptionAutoRefresh: {
            title: "Abonelikleri otomatik güncelle",
            description: "Abonelik bağlantılarında sunucu güncellemelerini düzenli olarak denetler.",
        },
        minimizeToTray: {
            title: "Tepsiye küçült",
            description: "Pencereyi kapatmak yerine bildirim alanına gizler.",
            descriptionMacos: "Sistem tarafından Dock üzerinden yönetilir.",
        },
    },

    // ─── Карточка «Пинг и диагностика» ──────────────────────────────────

    ping: {
        title: "Ping ve tanılama",
        description: "Sunucu gecikmesinin ve erişilebilirliğinin nasıl ölçüldüğü",

        nodeMode: {
            title: "Sunucu denetimi",
            description: "Bağlanmadan önce listedeki sunucuların nasıl denetleneceği.",
            auto: "Otomatik (protokole göre)",
            protocol: "Protokole göre",
            tcp: "TCP ping",
        },
        connectionMode: {
            title: "Bağlantı ping'i",
            description: "HTTP gerçek uçtan uca tüneli, TCP doğrudan rotayı ölçer.",
            http: "HTTP (tünel)",
            tcp: "TCP (doğrudan)",
        },
    },

    // ─── Карточка «Идентификация (HWID)» ────────────────────────────────

    hwid: {
        title: "Cihaz kimliği (HWID)",
        description: "Cihaz sınırı olan sunucular ve abonelikler tarafından kullanılır",

        send: {
            title: "HWID gönder",
            description: "Abonelik isteklerine cihaza özgü bir karma ekler.",
        },
        value: {
            title: "HWID değeri",
            description: "Oluşturma yöntemi: {{mode}}",
            configure: "Ayarla",
        },
        mode: {
            disabled: "Kapalı",
            manual: "Elle",
            auto: "Otomatik",
        },
    },

    // Отдельный экран HWID (src/pages/settings/Hwid.tsx), открывается кнопкой «Настроить»
    hwidPage: {
        title: "HWID",
        cardTitle: "Cihaz kimliği",
        cardDescription: "Beam'in abonelikleri güncellerken gönderdiği rastgele bir UUID. Donanımınıza bağlı değildir.",
        mode: "Yöntem",
        modeAuto: "Otomatik oluşturuldu",
        modeManual: "Elle belirlendi",
        value: "Değer",
        regenerate: "Yeniden oluştur",
        loadFailed: "HWID ayarları yüklenemedi",
        saveFailed: "HWID kaydedilemedi",
    },

    // ─── Карточка «Служебные действия» ──────────────────────────────────

    service: {
        title: "Bakım",
        description: "İpuçlarını ve ilk kullanım tanıtımını sıfırla",

        onboarding: {
            title: "Karşılama ekranı",
            description: "Adım adım kurulum sihirbazını yeniden çalıştırır.",
            action: "Yeniden başlat",
            resetting: "Sıfırlanıyor...",
        },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "Uygulama ayarları yüklenemedi",
        saveError: "Kaydederken hata oluştu",
        saved: "Ayarlar kaydedildi",
        saveFailed: "Uygulama ayarları kaydedilemedi",
        onboardingResetFailed: "Karşılama sıfırlanamadı",
    },
} satisfies LocaleShape<typeof ru>
