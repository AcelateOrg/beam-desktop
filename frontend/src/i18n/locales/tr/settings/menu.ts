/**
 * Настройки → главный экран со списком разделов
 * Турецкий. Структура повторяет ru/settings/menu.ts.
 */
import type ru from "../../ru/settings/menu"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Ayarlar",

    appearance: {
        title: "Görünüm",
        description: "Tema, yazı tipi, köşe yuvarlaklığı",
    },
    app: {
        title: "Uygulama",
        description: "Dil, otomatik başlatma, tepsi, ping, HWID",
    },
    connection: {
        title: "Bağlantı",
        description: "Mod, DNS, parçalama",
    },
    analytics: {
        title: "İstatistikler",
        description: "Trafik, süre, sunucular ve uygulamalar",
    },
    logs: {
        title: "Günlükler",
        description: "Xray çekirdeğinin çalışma günlüğü",
    },
    developer: {
        title: "Geliştirici",
        description: "Geliştirme ve hata ayıklama araçları",
    },
    about: {
        title: "Hakkında",
        description: "Sürüm ve bilgiler",
    },
} satisfies LocaleShape<typeof ru>
