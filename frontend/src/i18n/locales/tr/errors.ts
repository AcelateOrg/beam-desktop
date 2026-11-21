/**
 * Экраны ошибок и сообщения о сбоях интерфейса.
 * Турецкий. Структура повторяет ru/errors.ts.
 */
import type ru from "../ru/errors"
import type { LocaleShape } from "../../locale-shape"

export default {
    unknown: "Bilinmeyen hata",

    // ─── Экран «Такой страницы нет» ─────────────────────────────────────

    notFound: {
        title: "Sayfa bulunamadı",
        description: "Bağlantı eskimiş olabilir ya da bu özellik BEAM sürümünüzde bulunmuyor.",
        goHome: "Ana sayfaya dön",
    },

    // ─── Экран падения интерфейса ───────────────────────────────────────

    crash: {
        title: "Bir şeyler ters gitti",
        description: "Bir hata buldunuz! Hatayı kopyalayıp geliştiricilere gönderin, hızlıca düzeltelim.",
        copy: "Kopyala",
        hint: "Bu, uygulamadaki bir hata. Geri dönmek için aşağıdaki düğmeyi kullanın.",
        goHome: "Ana sayfaya dön",
    },

    // ─── Уведомления после сбоя ─────────────────────────────────────────

    recovered: {
        uiRestarted: {
            title: "Arayüz bir çökmenin ardından yeniden başlatıldı",
            description: "VPN bağlantınız etkilenmedi. Bu tekrar ederse geliştiricilere haber verin.",
        },
        vpnRestored: {
            title: "Beam bir çökmeden kurtarıldı",
            description: "VPN otomatik olarak yeniden bağlandı.",
        },
        vpnNotRestored: {
            title: "Beam bir çökmenin ardından yeniden başlatıldı",
            description: "VPN yeniden bağlanamadı. Lütfen elle bağlanın.",
        },
    },
} satisfies LocaleShape<typeof ru>
