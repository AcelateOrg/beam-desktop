/**
 * Настройки → О приложении и экран «Лицензии»
 * Турецкий. Структура повторяет ru/settings/about.ts.
 */
import type ru from "../../ru/settings/about"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "Hakkında",

    version: "Sürüm",
    build: "derleme",
    copyHashHint: "Derleme karmasını kopyalamak için tıklayın",
    checking: "Denetleniyor…",
    updateTo: "{{version}} sürümüne güncelle",
    checkUpdates: "Güncellemeleri denetle",
    licenses: "Lisanslar",

    beta: {
        badgeTitle: "Beta sürüm, etiket {{tag}}",
        title: "Kapalı beta testi",
        description: "BEAM'in bu sürümü üçüncü kişilerle paylaşılamaz; kullanım hakkı yalnızca kapalı beta ekibine aittir.",
    },

    footer: {
        // «Powered by Wails & Xray & React» — названия ссылками, слова между ними тут
        poweredBy: "Powered by",
        rights: "© {{year}} Acelate. Tüm hakları saklıdır.",
        love: "Ürünümüze olan sevgiyle yapıldı",
    },

    toast: {
        checkFailed: "Güncellemeler denetlenemedi",
        upToDate: "En son sürümü kullanıyorsunuz",
        devModeOn: "Geliştirici modu açıldı",
        hashCopied: "Derleme karması kopyalandı",
        hashCopyFailed: "Karma kopyalanamadı",
    },

    // ─── Экран «Лицензии» ───────────────────────────────────────────────

    licensesPage: {
        title: "Lisanslar",
        search: "Ad, yazar veya lisansa göre ara",
        clear: "Temizle",
        licenseText: "Lisans metni",
        thanks: "Beam açık kaynak yazılımlar üzerine kurulu. Yazarlarına teşekkürler!",
        nothingFound: "Sonuç bulunamadı",
        footer: "Sitesini açmak için bir projeye, metnini okumak için bir lisansa tıklayın.",

        // Разделы списка сторонних компонентов
        section: {
            core: { title: "Çekirdek ve ağ", hint: "Xray, protokoller, tünel" },
            desktop: { title: "Masaüstü", hint: "Pencere, tepsi, sistem" },
            ui: { title: "Arayüz", hint: "React ve bileşenler" },
            fonts: { title: "Yazı tipleri", hint: "Google Fonts" },
            data: { title: "Veriler", hint: "Ayrıca indirilir" },
        },

        // Пометки у отдельных компонентов
        note: {
            modified: "Değiştirilmiş sürüm",
            windowsDriver: "Windows sürücüsü",
            staticLinkingException: "Statik bağlama istisnasıyla",
            iconSets: "Simgeler kendi setlerinin lisanslarıyla",
            geoData: "geoip.dat ve geosite.dat",
        },
    },

    // ─── Карточка «Лицензия Beam» ───────────────────────────────────────
    // Пересказ Beam Source License 1.0 простыми словами. Юридически действует
    // английский текст LICENSE — при правке лицензии обнови и эти пункты.

    beamLicense: {
        title: "Beam lisansı",
        description: "Kod incelemeye açık, ama açık kaynak değil. Çekirdek ve tünel açık kaynaklı.",
        appAndBridge: "Uygulama ve köprü · Beam Source License 1.0",

        component: {
            desktop: "Uygulama",
            bridge: "Çekirdek köprüsü",
            core: "Xray tabanlı çekirdek",
            tun: "Tünel",
        },

        allowedTitle: "Serbest",
        allowed: {
            use: { title: "Kullanmak", hint: "Resmî sürümleri evde, işte, şirkette" },
            read: { title: "Kodu okumak", hint: "Beam'in ne yaptığını ve nasıl yaptığını incelemek, doğrulamak" },
            build: { title: "Kendiniz için derlemek ve değiştirmek", hint: "Kendi cihazlarınızda, kişisel veya dahili kullanım için" },
            contribute: { title: "Değişiklik önermek", hint: "CLA koşullarıyla pull request göndererek" },
            fork: { title: "GitHub'da fork'lamak", hint: "Kendi değişikliklerinizi hazırlayıp göndermek için" },
            quote: { title: "Alıntı yapmak", hint: "Makale ve tartışmalarda kısa parçalar, kaynak göstererek" },
            recommend: { title: "Müşterilere önermek", hint: "Sağlayıcılar için: sürüm bağlantıları ve abonelik başlıkları" },
        },

        forbiddenTitle: "Yasak",
        forbidden: {
            distribute: { title: "Dağıtmak ve satmak", hint: "Beam'i ve değiştirilmiş sürümlerini, kod ya da derleme olarak" },
            stores: { title: "Mağazalarda yayımlamak", hint: "Aynalar, paket depoları ve kurulum dosyası siteleri dahil" },
            rebrand: { title: "Yeniden markalamak", hint: "Başka ad, logo ya da Beam tabanlı kendi ürününüz" },
            compete: { title: "Rakip ürün yapmak", hint: "Kodu, tasarımı veya varlıkları kendi ya da başkasının istemcisi için kullanmak" },
            saas: { title: "Hizmet olarak sunmak", hint: "Başkaları için bulut ya da yönetilen Beam" },
            copyright: { title: "Telif bildirimlerini kaldırmak", hint: "Yazarlık ve lisans bildirimlerini silmek ya da gizlemek" },
            bypass: { title: "Korumaları aşmak", hint: "Dağıtmak amacıyla imza, güncelleme ve bütünlük denetimlerini aşmak" },
        },

        mpl: {
            title: "beam-core ve beam-tun · MPL-2.0",
            description: "Kendi ürünlerinizde de dahil olmak üzere kullanabilir, değiştirebilir ve dağıtabilirsiniz. Değiştirilen dosyalar MPL-2.0 altında açık kalmalı, telif bildirimleri korunmalı.",
        },

        fineTitle: "Bilinmesi gerekenler",
        fine: {
            trademarks: "\"Beam\" ve \"Acelate\" adları ile logolar ticari markadır; lisans bunlar üzerinde hak vermez.",
            termination: "İhlal ederseniz haklarınız sona erer. İlk ihlalse ve bildirimden sonraki 30 gün içinde düzeltirseniz geri gelir.",
            warranty: "Beam \"olduğu gibi\", hiçbir garanti olmadan sunulur.",
            permission: "Yasaklardan birine mi ihtiyacınız var? Acelate'in yazılı izniyle mümkün.",
            legal: "Hukuken geçerli olan, depodaki LICENSE dosyasının tam metnidir.",
        },
    },
} satisfies LocaleShape<typeof ru>
