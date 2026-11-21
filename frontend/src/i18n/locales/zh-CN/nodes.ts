/**
 * Конфигурации (список серверов) и редактор параметров сервера
 * Упрощённый китайский. Структура повторяет ru/nodes.ts.
 */
import type ru from "../ru/nodes"
import type { LocaleShape } from "../../locale-shape"

export default {
    title: "节点",

    // ─── Шапка и группы ─────────────────────────────────────────────────

    header: {
        pingAll: "全部测速",
        pingAllHint: "测试所有分组中所有节点的延迟",
        pinging: "正在测速...",
        switching: "正在切换...",
    },

    group: {
        selectedHere: "当前所选节点在此分组中",
        ping: "测试此分组的节点延迟",
    },

    // ─── Объявление провайдера над списком ──────────────────────────────

    banner: {
        openLink: "打开公告中的链接",
        collapse: "收起",
        expand: "展开全文",
        support: "客服",
        hide: "隐藏",
    },

    // ─── Строка сервера ─────────────────────────────────────────────────

    node: {
        timeout: "超时",
        latency: "{{value}} ms",
        edited: "已修改",
        pinned: "不随订阅更新",
        insecure: "不安全：未验证服务器证书，流量可能被拦截。",
    },

    contextMenu: {
        selected: "已选择",
        select: "选择节点",
        edit: "编辑配置",
    },

    empty: {
        title: "没有节点",
        description: "添加配置文件后即可看到节点",
    },

    // ─── Редактор параметров сервера ────────────────────────────────────

    config: {
        fallbackTitle: "配置",
        subtitle: "节点参数编辑器",
        notSet: "未设置",
        resetToProvider: "恢复服务商的值",
        hint: "将鼠标悬停在字段旁的“?”上可查看参数的实际名称。修改将在重新连接后生效。",
        resetEdits: "重置修改（{{count}}）",
        staleLink:
            "此节点已从链接导出中排除：原始链接描述的是修改前的配置，把它导入其他客户端会恢复旧参数。",

        // Разделы редактора
        section: {
            main: "基本",
            server: "服务器",
            access: "认证",
            tls: "TLS",
            reality: "REALITY",
            transport: "传输",
            core: "内核",
            chain: "链式代理",
            subscription: "订阅",
            other: "其他",
        },

        // «Основное»
        name: {
            label: "名称",
            help: "仅用于列表显示，不影响连接。",
            providerName: "服务商名称：{{name}}",
        },

        // Поля протокола: label — подпись, help — подсказка под «?»
        field: {
            server: { label: "地址", help: "要连接的域名或 IP 地址。" },
            port: { label: "端口", help: "服务器端口。REALITY 几乎总是 443。" },

            uuid: { label: "UUID", help: "VLESS 和 VMess 的用户 ID。" },
            password: { label: "密码", help: "Trojan 和 Shadowsocks 的密码。" },
            method: { label: "加密方式", help: "Shadowsocks 的加密方法，例如 aes-256-gcm。" },
            encryption: { label: "加密", help: "VLESS 本身不加密，所以通常填 none。" },
            flow: {
                label: "XTLS 流控",
                help: "必须与服务器设置一致：多填或漏填 flow 都会导致无法连接。",
            },
            packetEncoding: {
                label: "UDP 封装",
                help: "在连接内传输 UDP 的方式。VLESS 一般选 xudp。",
            },

            tlsEnabled: { label: "使用 TLS", help: "用 TLS 加密连接。" },
            sni: {
                label: "SNI",
                help: "握手时发送的服务器名称。对于 REALITY，这是用来伪装的目标网站，例如 dl.google.com。",
            },
            alpn: { label: "ALPN", help: "以逗号分隔的协议，例如 h2, http/1.1。" },
            utls: { label: "握手伪装", help: "在 TLS 层伪装成真实浏览器（uTLS）。" },
            fingerprint: {
                label: "浏览器指纹",
                help: "要伪装成哪种浏览器。服务器并不接受所有指纹，如果连不上，可以试试 chrome。",
            },
            insecure: {
                label: "跳过证书验证",
                help: "关闭证书验证。不安全，仅用于排查问题。",
            },

            realityEnabled: {
                label: "使用 REALITY",
                help: "伪装成其他网站，而不是使用普通的 TLS 证书。",
            },
            publicKey: { label: "公钥", help: "服务器的公钥，在订阅链接中记作 pbk。" },
            shortId: {
                label: "Short ID",
                help: "客户端短标识，在订阅链接中记作 sid。",
            },

            transportType: { label: "类型", help: "ws、grpc、httpupgrade、xhttp。留空即普通 TCP。" },
            transportPath: { label: "路径", help: "WebSocket、HTTPUpgrade 和 XHTTP 的请求路径。" },
            xhttpMode: { label: "XHTTP 模式", help: "auto、packet-up、stream-up 或 stream-one。留空即 auto。" },
            grpcService: { label: "gRPC 服务名", help: "gRPC 服务的名称。" },
        },

        // «Ядро»
        fragment: {
            label: "分片",
            help: "关闭后，即使连接设置中开启了分片，此节点也不会分片。",
        },
        mux: {
            label: "Mux",
            help: "覆盖全局 Mux 开关。XTLS Vision 和 Hysteria 永远不支持 Mux；XHTTP 仅在设为“开启”时可用。",
            inherit: "跟随全局设置",
            on: "开启",
            off: "关闭",
        },

        // «Цепочка»
        chain: {
            label: "前置节点",
            help: "流量先经过所选节点（入口），再经过此节点（出口）。仅支持 TCP：Hysteria2 和 WireGuard 不能作为出口。",
            none: "未选择",
        },

        // «Подписка»
        pin: {
            label: "不随订阅更新",
            help: "开启后整个配置被固定；关闭时，你的修改会叠加在服务商数据之上。",
        },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        pingFailed: "测速失败",
        switchFailed: "无法切换节点",
        switchError: "切换节点时出错",
        openConfigFailed: "无法打开配置",
        saveConfigFailed: "无法保存配置",
        saveConfigError: "保存配置时出错",
    },
} satisfies LocaleShape<typeof ru>
