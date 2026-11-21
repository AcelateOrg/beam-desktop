/**
 * Главная: кнопка подключения и всё вокруг неё.
 * Турецкий. Структура повторяет ru/home.ts.
 */
import type ru from "../ru/home"
import type { LocaleShape } from "../../locale-shape"

export default {
    // ─── Подпись под кнопкой подключения ────────────────────────────────

    status: {
        paused: "İnternet duraklatıldı",
        error: "Bağlantı başarısız",
        switching: "Sunucu değiştiriliyor...",
        switched: "Sunucu değiştirildi!",
        connecting: "Bağlanıyor...",
        unhealthy: "Bağlantı sorunları",
        connected: "Bağlandınız!",
        noProfile: "Profil ekleyin",
        idle: "Bağlanmak için dokunun",
    },

    // ─── Статистика под кнопкой ─────────────────────────────────────────

    stats: {
        unstable: "Bağlantı kararsız",
        ping: "Ping",
        time: "Süre",
        downloaded: "İndirme",
        uploaded: "Yükleme",
    },

    // ─── Выбор сервера (выпадающий список) ──────────────────────────────

    nodeSelector: {
        placeholder: "Sunucu seçin",
        switching: "Değiştiriliyor...",
        pinned: "Sabitlenenler",
        allServers: "Tüm sunucular",
    },

    // ─── Радиальное меню серверов (зажать кнопку подключения) ───────────

    radial: {
        hintHold: "Bir sunucuya sürükleyin",
        hintClick: "Bir sunucu seçin",
        alreadyHere: "mevcut",
        connect: "bağlan",
        switch: "değiştir",
        allServers: "Tüm sunucular",
        allShort: "Tümü",
        more: "{{count}} tane daha",
    },

    // ─── Плашка Kill Switch ─────────────────────────────────────────────

    killSwitch: {
        failed: "Kill Switch başarısız oldu: {{error}}",
        title: "Kill Switch açık",
        details: "Ayrıntılar",
        tooltip: "İnternete yalnızca BEAM ve yerel ağınız erişebilir. Geri kalan her şey VPN yeniden bağlanır bağlanmaz geri gelir.",
        reason: "Neden: {{reason}}",
        description: "VPN koptu, sızıntıyı önlemek için internet duraklatıldı",
        reconnect: "Yeniden bağlan",
        restoreInternet: "İnterneti geri aç",

        toast: {
            restoreFailed: "İnternet geri açılamadı",
            saveFailed: "Kaydedilemedi",
        },
    },

    // ─── Ошибки подключения ─────────────────────────────────────────────

    toast: {
        disconnectError: "Bağlantı kesilemedi",
    },
} satisfies LocaleShape<typeof ru>
