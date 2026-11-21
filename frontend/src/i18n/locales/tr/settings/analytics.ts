/**
 * Настройки → Статистика
 * Турецкий. Структура повторяет ru/settings/analytics.ts.
 */
import type ru from "../../ru/settings/analytics"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "İstatistikler",

    period: {
        today: "Bugün",
        week: "7 gün",
        month: "30 gün",
        all: "Tüm zamanlar",
    },

    reset: "İstatistikleri sıfırla",

    empty: {
        title: "Henüz boş",
        description: "VPN'e bağlanın; trafik, süre ve en çok kullanılan sunucular burada görünecek. Veriler yalnızca bu cihazda saklanır.",
        period: "Bu dönem için veri yok",
    },

    // ─── Плашки с итогами сверху ────────────────────────────────────────

    kpi: {
        downloaded: "İndirilen",
        uploaded: "Yüklenen",
        since: "{{date}} tarihinden beri",
        time: "VPN'de geçen süre",
        activeDays_one: "Bağlantılı {{count}} gün",
        activeDays_other: "Bağlantılı {{count}} gün",
        sessions: "Bağlantılar",
        average: "ortalama {{time}}",
    },

    // ─── Блок «Трафик» (столбики) ───────────────────────────────────────

    traffic: {
        title: "Trafik",
        hintHourly: "Bugün her saat VPN üzerinden geçen veri miktarı.",
        hintDaily: "Her gün VPN üzerinden geçen veri miktarı.",
        downloaded: "İndirilen",
        uploaded: "Yüklenen",
        empty: "Bu dönemde trafik olmadı",
    },

    // ─── Блок «Куда идёт трафик» ────────────────────────────────────────

    routes: {
        title: "Trafik nereye gidiyor",
        // <b> — жирный фрагмент
        hint: "<b>VPN üzerinden</b>: sunucu aracılığıyla. <b>Doğrudan</b>: yönlendirme kurallarına göre VPN'i atlayarak (yerel ağ, hariç tutulan siteler ve uygulamalar).",
        proxy: "VPN üzerinden",
        direct: "Doğrudan",
        proxyCaption: "VPN üzerinden",
        blocked: "Engellenen",
        blockedCount_one: "{{value}} bağlantı",
        blockedCount_other: "{{value}} bağlantı",
        empty: "Bağlandıktan sonra TUN modunda görünür",
    },

    // ─── Блоки «Профили» и «Конфиги» ────────────────────────────────────

    untitled: "Adsız",
    others: "Diğerleri ({{count}})",
    totalCaption: "toplam",

    profiles: {
        title: "Profiller",
        hint: "Trafiğin abonelikler ve profiller arasında nasıl paylaşıldığı.",
    },

    nodes: {
        title: "Yapılandırmalar",
        hint: "En çok kullanılan sunucular. Trafiğe veya süreye göre karşılaştırmak için değiştirin.",
        byTraffic: "Trafik",
        byTime: "Süre",
    },

    // ─── Блок «Приложения» ──────────────────────────────────────────────

    apps: {
        title: "Uygulamalar",
        hint: "Programların tüm trafiği, hem VPN üzerinden hem doğrudan. Yalnızca TUN modunda görünür: sistem proxy modunda uygulamalar ayırt edilemez ve \"Proxy üzerinden\" altında toplanır.",
        viaProxy: "Proxy üzerinden",
        system: "Sistem",
        tunOnly: "Trafiği uygulama bazında görmek için bağlantı ayarlarında TUN modunu açın.",
        collapse: "Daralt",
        more: "{{count}} tane daha · {{size}}",
    },

    // ─── Подтверждение сброса ───────────────────────────────────────────

    resetDialog: {
        title: "İstatistikler sıfırlansın mı?",
        description: "Tüm trafik ve süre geçmişi silinecek. Bu işlem geri alınamaz.",
        confirm: "Sıfırla",
    },

    toast: {
        reset: "İstatistikler sıfırlandı",
        resetFailed: "Sıfırlanamadı",
    },
} satisfies LocaleShape<typeof ru>
