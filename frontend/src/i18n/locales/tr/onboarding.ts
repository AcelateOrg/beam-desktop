/**
 * Мастер первого запуска.
 * Турецкий. Структура повторяет ru/onboarding.ts.
 */
import type ru from "../ru/onboarding"
import type { LocaleShape } from "../../locale-shape"

export default {
    // Шаги мастера: eyebrow — маленькая подпись над заголовком
    step: {
        language: {
            eyebrow: "Dil",
            title: "Dilinizi seçin",
            description: "Daha sonra Ayarlar'dan istediğiniz zaman değiştirebilirsiniz.",
        },
        welcome: {
            eyebrow: "Başlangıç",
            title: "BEAM'e hoş geldiniz",
            description: "İlk bağlantıdan önce birkaç basit ayar yapalım.",
        },
        theme: {
            eyebrow: "Görünüm",
            title: "Tema seçin",
            description: "Gözünüze hoş gelen bir arayüz seçin.",
        },
        profile: {
            eyebrow: "İçe aktarma",
            title: "Profil ekleyin",
            description: "Abonelik, BEAM dosyası veya JSON yapılandırması ekleyin.",
        },
        behavior: {
            eyebrow: "Bitiş",
            title: "Son ayarlar",
            description: "Günlük kullanım için birkaç seçeneği açın.",
        },
    },

    // ─── Шаг «Старт» ────────────────────────────────────────────────────

    welcome: {
        title: "BEAM'e hoş geldiniz",
        description: "İlk bağlantıya hızlıca hazırlanalım: bir tema seçin, profil ekleyin ve uygulamanın nasıl çalışacağını ayarlayın.",
    },

    // ─── Шаг «Тема» ─────────────────────────────────────────────────────

    theme: {
        followsSystem: {
            windows: "Windows'a uyar",
            macos: "macOS'e uyar",
            linux: "Sisteme uyar",
        },
        fixed: "Sabit tema",
    },

    // ─── Шаг «Профиль» ──────────────────────────────────────────────────

    profile: {
        intro: "Profiliniz varsa şimdi içe aktarabilirsiniz. Yoksa bu adımı atlayabilirsiniz.",
        found: "Profil bulundu",
        notAdded: "Henüz profil eklenmedi",
        available_one: "{{count}} profil kullanılabilir",
        available_other: "{{count}} profil kullanılabilir",
        canSkip: "Profil eklemeden de devam edebilirsiniz",
        addMore: "Bir tane daha ekle",
        import: "İçe aktar",
    },

    // ─── Шаг «Последние настройки» ──────────────────────────────────────

    behavior: {
        autostart: {
            title: {
                windows: "Windows ile birlikte başlat",
                macos: "Oturum açıldığında başlat",
                linux: "Oturum açıldığında başlat",
            },
            description: "Beam'i her gün kullanıyorsanız kullanışlıdır.",
            unavailableMacos: "macOS'te henüz kullanılamıyor.",
        },
        tray: {
            title: "Tepsiye küçült",
            description: "Pencereyi kapattığınızda uygulama kapanmaz, gizlenir.",
            descriptionMacos: "macOS'te bunu sistem Dock üzerinden yönetir.",
        },
    },

    // ─── Кнопки внизу ───────────────────────────────────────────────────

    nav: {
        skip: "Atla",
        back: "Geri",
        next: "İleri",
        finish: "Bitir",
        finishing: "Kaydediliyor...",
    },

    toast: {
        saveFailed: "Ayarlar kaydedilemedi",
        finishFailed: "İlk kurulum tamamlanamadı",
    },
} satisfies LocaleShape<typeof ru>
