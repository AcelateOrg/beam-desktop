/**
 * Маршрутизация, режим Easy: списки приложений, доменов и IP
 * Турецкий. Структура повторяет ru/settings/splitTunneling.ts.
 */
import type ru from "../../ru/settings/splitTunneling"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Yönlendirme",
    enabled: "Açık",
    disabled: "Kapalı",

    mode: {
        exclude: "Doğrudan",
        include: "VPN üzerinden",
        excludeHint: "Eklenen kurallar doğrudan gider, kalan trafik VPN'de kalır.",
        includeHint: "Eklenen kurallar VPN üzerinden gider, kalan trafik tüneli atlar.",
    },

    tabs: {
        apps: "Uygulamalar",
        domains: "Alan adları",
        ips: "IP adresleri",
    },

    // ─── Поле добавления правила ────────────────────────────────────────

    input: {
        processes: "İşlemler",
        processesHint: "Çalışan işlemlerden seç",
        file: "Dosya",
        pickApp: "Uygulama seç (.app)",
        pickExe: ".exe dosyası seç",
        domainHelp: "Belirli bir alan adı (example.com), joker (*.example.com) veya alan adı uzantısı (*.com) girebilirsiniz.",
        ipPlaceholder: "8.8.8.8 veya 10.0.0.0/8",
        ipHelp: "Tek bir IP adresi ya da bütün bir alt ağ ekleyebilirsiniz.",
        remove: "Sil",
    },

    empty: {
        apps: "Eklenmiş uygulama yok",
        domains: "Eklenmiş alan adı yok",
        ips: "Eklenmiş IP adresi yok",
    },

    // ─── Плашка о конфликте с правилами провайдера ──────────────────────
    // Собирается так: intro + target + «: » + список + more + outro

    conflict: {
        title: "Sağlayıcının yönlendirmesiyle çakışma",
        intro: "Bu kurallar, sağlayıcının",
        toBlock: " engellenmesini istediği trafiği VPN'e yönlendiriyor",
        toDirect: " doğrudan gitmesini istediği trafiği VPN'e yönlendiriyor",
        more: " ve {{count}} tane daha",
        outro: "Bu, sunucuların IP adreslerini açığa çıkarabilir.",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        loadFailed: "Ayarlar yüklenemedi",
        processesFailed: "İşlem listesi alınamadı",
        error: "Hata",
        saveFailed: "Kaydetme hatası",
        filePickerFailed: "Dosya seçici açılamadı",
    },
} satisfies LocaleShape<typeof ru>
