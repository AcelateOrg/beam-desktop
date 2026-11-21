/**
 * Каркас окна: навигация, сайдбар, обновления приложения.
 * Турецкий. Структура повторяет ru/layout.ts.
 */
import type ru from "../ru/layout"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Навигация ──────────────────────────────────────────────────────
    // title — в сайдбаре, short — в нижней панели узкого окна

    nav: {
        home: { title: "Bağlantı", short: "Ana sayfa" },
        profiles: { title: "Profiller", short: "Profiller" },
        nodes: { title: "Yapılandırmalar", short: "Sunucular" },
        routing: { title: "Yönlendirme", short: "Yönlendirme" },
        settings: { title: "Ayarlar", short: "Ayarlar" },
    },

    sidebar: {
        toggle: "Kenar çubuğunu aç/kapat",
    },

    // ─── Обновление приложения ──────────────────────────────────────────

    update: {
        available: "Güncelleme mevcut",
        version: "Sürüm {{version}}",
        mandatory: "Zorunlu güncelleme: bu sürüm artık desteklenmiyor",
        noChangelog: "Sürüm notları yok",
        download: "İndir",
        downloading: "İndiriliyor...",
        installAndRestart: "Yükle ve yeniden başlat",
        linuxTunNote:
            "Yeniden başlatmanın ardından Beam bir kez TUN izni isteyecek. Bu normal: yetkiler çalıştırılabilir dosyaya bağlıdır ve bu dosya az önce yeni sürümle değiştirildi.",

        toast: {
            downloadFailed: "Güncelleme indirilemedi",
            installFailed: "Güncelleme yüklenemedi",
        },
    },
} satisfies LocaleShape<typeof ru>
