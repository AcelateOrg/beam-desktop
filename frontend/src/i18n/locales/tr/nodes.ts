/**
 * Конфигурации (список серверов) и редактор параметров сервера.
 * Турецкий. Структура повторяет ru/nodes.ts.
 */
import type ru from "../ru/nodes"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "Yapılandırmalar",

    // ─── Шапка и группы ─────────────────────────────────────────────────

    header: {
        pingAll: "Tümüne ping at",
        pingAllHint: "Tüm kategorilerdeki her sunucuya ping at",
        pinging: "Ping atılıyor...",
        switching: "Değiştiriliyor...",
    },

    group: {
        selectedHere: "Seçili sunucu bu grupta",
        ping: "Bu gruptaki sunuculara ping at",
    },

    // ─── Объявление провайдера над списком ──────────────────────────────

    banner: {
        openLink: "Bu duyurudaki bağlantıyı aç",
        collapse: "Daralt",
        expand: "Devamını göster",
        support: "Destek",
        hide: "Gizle",
    },

    // ─── Строка сервера ─────────────────────────────────────────────────

    node: {
        timeout: "Zaman aşımı",
        latency: "{{value}} ms",
        edited: "düzenlendi",
        pinned: "Abonelikten güncellenmez",
        insecure: "Güvensiz: sunucu sertifikası doğrulanmıyor, trafik ele geçirilebilir.",
    },

    contextMenu: {
        selected: "Zaten seçili",
        select: "Sunucuyu seç",
        edit: "Yapılandırmayı düzenle",
    },

    empty: {
        title: "Sunucu yok",
        description: "Sunucularını görmek için bir profil ekleyin",
    },

    // ─── Редактор параметров сервера ────────────────────────────────────

    config: {
        fallbackTitle: "Yapılandırma",
        subtitle: "Sunucu ayarları düzenleyicisi",
        notSet: "belirtilmemiş",
        resetToProvider: "Sağlayıcının değerini geri yükle",
        hint: "Asıl parametre adını görmek için alanın yanındaki \"?\" işaretinin üzerine gelin. Değişiklikler yeniden bağlandıktan sonra uygulanır.",
        resetEdits: "Değişiklikleri sıfırla ({{count}})",
        staleLink:
            "Bu sunucu bağlantı dışa aktarımına dahil edilmez: özgün bağlantı, düzenlemelerinizden önceki yapılandırmayı içerir; başka bir istemciyle paylaşılırsa eski ayarlar geri gelir.",

        // Разделы редактора
        section: {
            main: "Genel",
            server: "Sunucu",
            access: "Kimlik doğrulama",
            tls: "TLS",
            reality: "REALITY",
            transport: "Aktarım",
            core: "Çekirdek",
            chain: "Zincir",
            subscription: "Abonelik",
            other: "Diğer",
        },

        // «Основное»
        name: {
            label: "Ad",
            help: "Yalnızca listede görüntülemek için kullanılır. Bağlantıyı etkilemez.",
            providerName: "sağlayıcının verdiği ad: {{name}}",
        },

        // Поля протокола: label — подпись, help — подсказка под «?»
        field: {
            server: { label: "Adres", help: "Bağlanılacak alan adı veya IP adresi." },
            port: { label: "Port", help: "Sunucu portu. REALITY için neredeyse her zaman 443." },

            uuid: { label: "UUID", help: "VLESS ve VMess için kullanıcı kimliği." },
            password: { label: "Parola", help: "Trojan ve Shadowsocks için parola." },
            method: { label: "Şifreleme yöntemi", help: "Shadowsocks şifreleme yöntemi, ör. aes-256-gcm." },
            encryption: { label: "Şifreleme", help: "VLESS'in kendi şifrelemesi yoktur, bu yüzden \"none\" normal değerdir." },
            flow: {
                label: "XTLS flow",
                help: "Sunucuyla eşleşmelidir. Eksik ya da fazla flow bağlantıyı bozar.",
            },
            packetEncoding: {
                label: "UDP paket kodlaması",
                help: "UDP'nin bağlantı içinde nasıl taşındığı. VLESS için genellikle xudp seçilir.",
            },

            tlsEnabled: { label: "TLS kullan", help: "Bağlantıyı TLS ile şifrele." },
            sni: {
                label: "SNI",
                help: "El sıkışmada gönderilen sunucu adı. REALITY'de taklit edilen sitedir, ör. dl.google.com.",
            },
            alpn: { label: "ALPN", help: "Virgülle ayrılmış protokoller, ör. h2, http/1.1." },
            utls: { label: "El sıkışma kamuflajı", help: "TLS düzeyinde gerçek bir tarayıcı gibi görün (uTLS)." },
            fingerprint: {
                label: "Tarayıcı parmak izi",
                help: "Hangi tarayıcının taklit edileceği. Her parmak izini sunucu kabul etmeyebilir. Bağlantı kurulmazsa chrome deneyin.",
            },
            insecure: {
                label: "Sertifika denetimini atla",
                help: "Sertifika doğrulamasını kapatır. Güvensizdir, yalnızca sorun gidermek için kullanın.",
            },

            realityEnabled: {
                label: "REALITY kullan",
                help: "Normal bir TLS sertifikası yerine başka bir web sitesi gibi görün.",
            },
            publicKey: { label: "Açık anahtar", help: "Sunucunun anahtarı. Abonelik bağlantılarında pbk olarak geçer." },
            shortId: {
                label: "Short ID",
                help: "Kısa istemci kimliği. Abonelik bağlantılarında sid olarak geçer.",
            },

            transportType: { label: "Tür", help: "ws, grpc, httpupgrade, xhttp. Düz TCP için boş bırakın." },
            transportPath: { label: "Yol", help: "WebSocket, HTTPUpgrade ve XHTTP için istek yolu." },
            xhttpMode: { label: "XHTTP modu", help: "auto, packet-up, stream-up veya stream-one. auto için boş bırakın." },
            grpcService: { label: "gRPC hizmeti", help: "gRPC hizmet adı." },
        },

        // «Ядро»
        fragment: {
            label: "Parçalama",
            help: "Kapalıyken bu sunucu, bağlantı ayarlarında parçalama açık olsa bile hiç parçalanmaz.",
        },
        mux: {
            label: "Mux",
            help: "Genel Mux ayarını geçersiz kılar. Mux, XTLS Vision ve Hysteria ile hiç çalışmaz; XHTTP ile yalnızca Açık seçildiğinde çalışır.",
            inherit: "genel ayarı kullan",
            on: "Açık",
            off: "Kapalı",
        },

        // «Цепочка»
        chain: {
            label: "Ara sunucu",
            help: "Trafik önce seçilen sunucudan (giriş), ardından bu sunucudan (çıkış) geçer. Yalnızca TCP: Hysteria2 ve WireGuard çıkış olarak desteklenmez.",
            none: "Yok",
        },

        // «Подписка»
        pin: {
            label: "Abonelikten güncelleme",
            help: "Açıkken yapılandırmanın tamamı kilitlenir. Kapalıyken düzenlemeleriniz sağlayıcının verilerinin üzerine uygulanır.",
        },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        pingFailed: "Ping atılamadı",
        switchFailed: "Sunucu değiştirilemedi",
        switchError: "Sunucu değiştirilirken hata oluştu",
        openConfigFailed: "Yapılandırma açılamadı",
        saveConfigFailed: "Yapılandırma kaydedilemedi",
        saveConfigError: "Yapılandırma kaydedilirken hata oluştu",
    },
} satisfies LocaleShape<typeof ru>
