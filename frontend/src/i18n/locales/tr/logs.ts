/**
 * Логи и активные соединения.
 * Турецкий. Структура повторяет ru/logs.ts.
 */
import type ru from "../ru/logs"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Günlükler",

    tabs: {
        logs: "Günlükler",
        connections: "Bağlantılar",
    },

    // ─── Панель управления ──────────────────────────────────────────────

    toolbar: {
        recording: "Kayıt",
        levelHint: "Çekirdek günlüklerinin ne kadar ayrıntılı olacağı",
        levelPlaceholder: "Günlük düzeyi",
        levelShort: "Düzey",
        openFolder: "Günlük klasörü",
        openFolderHint: "Günlük klasörünü aç (hata bildirimleri için crash.log da orada)",
        show: "Göster",
        all: "Tümü",
        rawView: "Ham görünüm",
        autoScroll: "Otomatik kaydırma",
        autoScrollOn: "Otomatik kaydırma açık",
        autoScrollOff: "Otomatik kaydırma kapalı",
        showRaw: "Ham hâlini göster",
        showParsed: "Ayrıştırılmış hâlini göster",
    },

    // Уровень, с которым ядро пишет логи
    level: {
        off: "Kapalı",
        error: "Yalnızca hatalar",
        info: "Normal",
        debug: "Ayrıntılı",
    },

    // ─── Пустые состояния ───────────────────────────────────────────────

    empty: {
        logs: "Henüz günlük yok",
        connections: "Etkin bağlantı yok",
        loggingOff: "Kayıt kapalı",
        loggingOffHint: "Neler olup bittiğini görmek için aşağıdan açın",
        enableLogging: "Kaydı aç",
    },

    tooSmall: {
        title: "Pencere çok küçük",
        description: "Günlükleri görmek için pencereyi büyütün",
    },

    raw: {
        closed: "(kapandı)",
    },

    // ─── Вкладка «Соединения» ───────────────────────────────────────────

    connections: {
        summary: {
            apps_one: "<b>{{count}}</b> uygulama",
            apps_other: "<b>{{count}}</b> uygulama",
            connections_one: "<b>{{count}}</b> bağlantı",
            connections_other: "<b>{{count}}</b> bağlantı",
            noPerApp: "Uygulama bazında döküm yok",
            noPerAppHint: "Sistem proxy modunda uygulamalar birbirinden ayırt edilemez. Her uygulamayı görmek için TUN'a geçin.",
        },

        empty: "Etkin bağlantı yok",
        emptyHint: "Bağlandığınızda uygulamalarınız ve bağlantıları burada görünür",
        noConnections: "Bağlantı yok",

        // Группы без имени процесса
        system: "Sistem",
        all: "Tüm bağlantılar",

        group: {
            idle: "boşta",
            active: "{{count}} etkin",
        },

        section: {
            active: "Etkin",
            closed: "Son kapananlar",
            of: "/ {{total}}",
            closedHint: "Kısa istekler saniyenin altında sürer, bu yüzden 2 dakika daha burada görünür kalırlar.",
        },

        row: {
            closedAgo: "{{ago}} kapandı",
            close: "Kapat",
        },

        detail: {
            closeAll: "Tümünü kapat",
            speed: "Hız",
            downloaded: "İndirilen",
            uploaded: "Yüklenen",
            uptime: "Süre",
        },

        // Куда ушло соединение
        route: {
            vpn: "VPN",
            direct: "Doğrudan",
            block: "Engellendi",
            dns: "DNS",
            mixed: "VPN + doğrudan",
        },

        // Почему соединение ушло туда, куда ушло
        rule: {
            user: "Kural: {{label}}",
            routing: "Yönlendirme kuralı",
            app: "Uygulama kuralı",
            lan: "Yerel ağ",
            dns: "DNS sorgusu",
            final: "Varsayılan",
        },

        // Размеры и скорость в этой вкладке
        unit: {
            perSecond: "{{value}}/sn",
        },
    },

    // ─── Выбор запущенного процесса ─────────────────────────────────────

    processPicker: {
        title: "Çalışan işlemler",
        refresh: "Listeyi yenile",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        toggleFailed: "Kayıt açılıp kapatılamadı",
        levelFailed: "Günlük düzeyi değiştirilemedi",
        openFolderFailed: "Günlük klasörü açılamadı",
        closeFailed: "Bağlantı kapatılamadı",
        closedMany: "{{count}} bağlantı kapatıldı",
        connectionsFailed: "Bağlantılar yüklenemedi",
        processesFailed: "Çalışan işlemler yüklenemedi",
    },
} satisfies LocaleShape<typeof ru>
