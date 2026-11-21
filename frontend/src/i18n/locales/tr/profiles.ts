/**
 * Профили: список, добавление, экспорт, параметры.
 * Турецкий. Структура повторяет ru/profiles.ts.
 */
import type ru from "../ru/profiles"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Profiller",
    add: "Profil ekle",
    empty: "Henüz profil yok. İlk profilinizi ekleyin!",
    noProfile: "Profil yok",

    // ─── Карточка профиля ───────────────────────────────────────────────

    card: {
        active: "Etkin",
        providerChannel: "Sağlayıcı kanalı",
        unlimitedTraffic: "Sınırsız trafik",
        unlimited: "Sınırsız",
    },

    menu: {
        refresh: "Güncelle",
        settings: "Ayarlar",
        export: "Dışa aktar",
        delete: "Sil",
    },

    deleteDialog: {
        title: "Profil silinsin mi?",
        description: "\"{{name}}\" kalıcı olarak silinecek. Bu işlem geri alınamaz.",
        confirm: "Sil",
    },

    // ─── Окно «Добавить профиль» ────────────────────────────────────────

    addModal: {
        title: "Profil ekle",

        method: {
            url: { title: "URL", hint: "Abonelik bağlantısı" },
            beam: { title: "BEAM", hint: "Dosyadan içe aktar" },
        },

        url: {
            placeholder: "https://... veya vless://...",
            hint: "vless://, vmess://, trojan://, ss://, hy2:// ya da abonelik bağlantısı (HTTP/HTTPS)",
            insecure: "⚠️ Şifrelenmemiş bağlantı",
        },

        file: {
            choose: ".beam dosyası seçin",
            orDrop: "ya da buraya sürükleyin",
            dropHere: "Buraya bırakın",
        },

        submit: "İçe aktar",
        submitting: "İçe aktarılıyor...",

        error: {
            onlyBeam: "Yalnızca .BEAM dosyaları desteklenir",
            importFailed: "İçe aktarma başarısız",
            fillFields: "Lütfen alanları doldurun",
        },
    },

    // ─── Окно «Экспорт профиля» ─────────────────────────────────────────

    exportModal: {
        title: "Profili dışa aktar",

        method: {
            beam: { title: "BEAM", hint: ".beam dosyası" },
            raw: { title: "RAW", hint: "Sunucu bağlantıları" },
            qr: { title: "QR", hint: "Telefon için" },
        },

        copySubscription: "Abonelik bağlantısını kopyala",
        loading: "Yükleniyor...",

        qr: {
            subscription: "Abonelik bağlantısı",
            server: "Sunucu {{index}}",
            nothing: "Bu profilde abonelik bağlantısı ya da kayıtlı sunucu bağlantısı yok, QR koda konacak bir şey bulunmuyor",
            hintSubscription: "Telefonunuzdaki BEAM'de: Profil ekle → QR kod",
            hintServer: "Yalnızca bu sunucu. BEAM'de ya da başka bir istemcide tarayın",
            copyLink: "Bağlantı",
            copyImage: "QR'ı kopyala",
            copied: "Kopyalandı",
            tooLong: "Bağlantı QR kod için çok uzun. Bunun yerine BEAM ya da RAW olarak dışa aktarın.",
            ariaLabel: "QR kod",
        },

        beam: {
            fileName: "Dosya adı",
            download: "İndir",
            exporting: "Dışa aktarılıyor...",
        },

        raw: {
            none: "Bu profilde kayıtlı bağlantı yok: normal vless/vmess/trojan/ss/hy2 bağlantılarından içe aktarılmamış",
            untitled: "Adsız",
            copy: "Kopyala",
            copyAll: "Tümünü kopyala",
        },

        toast: {
            fileSaved: "Dosya kaydedildi",
            showInFolder: "Klasörde göster",
            linkCopied: "Bağlantı kopyalandı",
            imageCopyFailed: "Görsel kopyalanamadı",
        },
    },

    // ─── Окно «Параметры профиля» ───────────────────────────────────────

    settingsModal: {
        title: "Profil ayarları",

        autoRefresh: {
            title: "Aboneliği otomatik güncelle",
            disabled: "Kapalı: abonelik kendiliğinden güncellenmez",
            ownSchedule: "Sizin belirlediğiniz gibi {{hours}} saatte bir güncellenir",
            providerInterval: "{{hours}} saatte bir otomatik güncellenir",
            providerSchedule: "Sağlayıcının programına göre otomatik güncellenir",
        },

        override: {
            title: "Özel program",
            active: "Sağlayıcının programı yerine {{hours}} saatte bir güncelle",
            emptyWithInterval: "Sağlayıcının programını ({{hours}} sa) kullanmak için boş bırakın",
            empty: "Sağlayıcının programını kullanmak için boş bırakın",
            hoursUnit: "sa",
        },

        noSubscription: "Bu profilin aboneliği yok, bu yüzden otomatik güncelleme kullanılamaz.",
        done: "Tamam",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        refreshing: "Profil güncelleniyor…",
        refreshed: "Profil güncellendi",
        refreshFailed: "Güncellenemedi",
        autoRefreshFailed: "Otomatik güncelleme değiştirilemedi",
        scheduleFailed: "Güncelleme programı değiştirilemedi",
        exportFailed: "Dışa aktarılamadı",
        linksFailed: "Bağlantılar alınamadı",
        saveFileFailed: "Dosya kaydedilemedi",
        saveLinksFailed: "Bağlantılar kaydedilemedi",
    },

    // ─── Импорт по внешней ссылке (beam://, файл) ───────────────────────

    externalImport: {
        title: "Bu profil eklensin mi?",
        source: "Kaynak: {{source}}",
        beamLink: "beam:// bağlantısı",
        confirm: "Ekle",
        cancel: "İptal",
        failed: "Beam bağlantısı içe aktarılamadı",
    },
} satisfies LocaleShape<typeof ru>
