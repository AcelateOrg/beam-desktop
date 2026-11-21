import { t } from "@/i18n"

// Сторонние компоненты, которые входят в Beam.
// Список собран по фактическим зависимостям сборки (go list -deps,
// package.json). При добавлении зависимости — добавь её сюда.

export type LicenseId =
    | "MIT"
    | "Apache-2.0"
    | "BSD-2-Clause"
    | "BSD-3-Clause"
    | "MPL-2.0"
    | "ISC"
    | "OFL-1.1"
    | "LGPL-3.0"
    | "GPL-3.0"
    | "MIT / Apache-2.0"
    | "Wintun"

export interface ThirdPartyItem {
    name: string
    holder: string
    license: LicenseId
    url: string
    note?: string
}

export interface ThirdPartySection {
    id: string
    title: string
    hint: string
    items: ThirdPartyItem[]
}

export const LICENSE_URLS: Record<LicenseId, string> = {
    "MIT": "https://opensource.org/license/mit",
    "Apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
    "BSD-2-Clause": "https://opensource.org/license/bsd-2-clause",
    "BSD-3-Clause": "https://opensource.org/license/bsd-3-clause",
    "MPL-2.0": "https://www.mozilla.org/MPL/2.0/",
    "ISC": "https://opensource.org/license/isc-license-txt",
    "OFL-1.1": "https://openfontlicense.org",
    "LGPL-3.0": "https://www.gnu.org/licenses/lgpl-3.0.html",
    "GPL-3.0": "https://www.gnu.org/licenses/gpl-3.0.html",
    "MIT / Apache-2.0": "https://opensource.org/license/mit",
    "Wintun": "https://git.zx2c4.com/wintun/tree/prebuilt-binaries-license.txt",
}

const gh = (repo: string) => `https://github.com/${repo}`

export const THIRD_PARTY: ThirdPartySection[] = [
    {
        id: "core",
        get title() {
            return t("settings.about.licensesPage.section.core.title")
        },
        get hint() {
            return t("settings.about.licensesPage.section.core.hint")
        },
        items: [
            { name: "Xray-core", holder: "Project X (XTLS)", license: "MPL-2.0", url: gh("XTLS/Xray-core"), get note() { return t("settings.about.licensesPage.note.modified") } },
            { name: "REALITY", holder: "Project X (XTLS)", license: "MPL-2.0", url: gh("XTLS/REALITY") },
            { name: "uTLS", holder: "Refraction Networking", license: "BSD-3-Clause", url: gh("refraction-networking/utls") },
            { name: "quic-go", holder: "The quic-go Authors, Aperture Internet Lab", license: "MIT", url: gh("apernet/quic-go") },
            { name: "qpack", holder: "Marten Seemann", license: "MIT", url: gh("quic-go/qpack") },
            { name: "gVisor", holder: "The gVisor Authors", license: "Apache-2.0", url: gh("google/gvisor") },
            { name: "wireguard-go", holder: "WireGuard LLC", license: "MIT", url: "https://git.zx2c4.com/wireguard-go" },
            { name: "Wintun", holder: "WireGuard LLC", license: "Wintun", url: "https://www.wintun.net", get note() { return t("settings.about.licensesPage.note.windowsDriver") } },
            { name: "DNS", holder: "Miek Gieben", license: "BSD-3-Clause", url: gh("miekg/dns") },
            { name: "gRPC-Go", holder: "The gRPC Authors", license: "Apache-2.0", url: gh("grpc/grpc-go") },
            { name: "Protocol Buffers", holder: "The Go Authors", license: "BSD-3-Clause", url: gh("protocolbuffers/protobuf-go") },
            { name: "Google APIs genproto", holder: "Google LLC", license: "Apache-2.0", url: gh("googleapis/go-genproto") },
            { name: "CIRCL", holder: "Cloudflare, Inc.", license: "BSD-3-Clause", url: gh("cloudflare/circl") },
            { name: "BLAKE3", holder: "Luke Champine", license: "MIT", url: gh("lukechampine/blake3") },
            { name: "go-proxyproto", holder: "Paulo Pires", license: "Apache-2.0", url: gh("pires/go-proxyproto") },
            { name: "compress", holder: "Klaus Post", license: "Apache-2.0", url: gh("klauspost/compress") },
            { name: "cpuid", holder: "Klaus Post", license: "MIT", url: gh("klauspost/cpuid") },
            { name: "brotli", holder: "Andy Balholm", license: "MIT", url: gh("andybalholm/brotli") },
            { name: "netipx", holder: "The Go Authors, Tailscale", license: "BSD-3-Clause", url: gh("go4org/netipx") },
            { name: "btree", holder: "Google LLC", license: "Apache-2.0", url: gh("google/btree") },
            { name: "ratelimit", holder: "Canonical Ltd.", license: "LGPL-3.0", url: gh("juju/ratelimit"), get note() { return t("settings.about.licensesPage.note.staticLinkingException") } },
            { name: "websocket", holder: "The Gorilla Authors", license: "BSD-2-Clause", url: gh("gorilla/websocket") },
            { name: "yaml.v2", holder: "Canonical Ltd.", license: "Apache-2.0", url: gh("go-yaml/yaml") },
            { name: "ghodss/yaml", holder: "Sam Ghods", license: "MIT", url: gh("ghodss/yaml") },
            { name: "go-toml", holder: "Thomas Pelletier", license: "MIT / Apache-2.0", url: gh("pelletier/go-toml") },
            { name: "netlink", holder: "Vishvananda Ishaya", license: "Apache-2.0", url: gh("vishvananda/netlink"), note: "Linux" },
            { name: "netns", holder: "Vishvananda Ishaya", license: "Apache-2.0", url: gh("vishvananda/netns"), note: "Linux" },
            { name: "errors", holder: "Dave Cheney", license: "BSD-2-Clause", url: gh("pkg/errors") },
            { name: "Go x/net, x/sys, x/crypto, x/text…", holder: "The Go Authors", license: "BSD-3-Clause", url: "https://go.googlesource.com" },
        ],
    },
    {
        id: "desktop",
        get title() {
            return t("settings.about.licensesPage.section.desktop.title")
        },
        get hint() {
            return t("settings.about.licensesPage.section.desktop.hint")
        },
        items: [
            { name: "Wails", holder: "Lea Anthony", license: "MIT", url: "https://wails.io" },
            { name: "go-webview2", holder: "Wails, John Chadwick", license: "MIT", url: gh("wailsapp/go-webview2"), note: "Windows" },
            { name: "systray", holder: "Fyne.io", license: "Apache-2.0", url: gh("fyne-io/systray") },
            { name: "dbus", holder: "Georg Reinke, The godbus Authors", license: "BSD-2-Clause", url: gh("godbus/dbus"), note: "Linux" },
            { name: "go-ps", holder: "Mitchell Hashimoto", license: "MIT", url: gh("mitchellh/go-ps") },
            { name: "slicer", holder: "Lea Anthony", license: "MIT", url: gh("leaanthony/slicer") },
            { name: "u", holder: "Lea Anthony", license: "MIT", url: gh("leaanthony/u") },
            { name: "go-ansi-parser", holder: "Lea Anthony", license: "MIT", url: gh("leaanthony/go-ansi-parser") },
            { name: "uniseg", holder: "Oliver Kuederle", license: "MIT", url: gh("rivo/uniseg") },
        ],
    },
    {
        id: "ui",
        get title() {
            return t("settings.about.licensesPage.section.ui.title")
        },
        get hint() {
            return t("settings.about.licensesPage.section.ui.hint")
        },
        items: [
            { name: "React", holder: "Meta Platforms, Inc.", license: "MIT", url: "https://react.dev" },
            { name: "Radix UI", holder: "WorkOS", license: "MIT", url: "https://www.radix-ui.com" },
            { name: "shadcn/ui", holder: "shadcn", license: "MIT", url: "https://ui.shadcn.com" },
            { name: "Tailwind CSS", holder: "Tailwind Labs, Inc.", license: "MIT", url: "https://tailwindcss.com" },
            { name: "Lucide", holder: "Lucide Contributors", license: "ISC", url: "https://lucide.dev" },
            { name: "React Icons", holder: "Goran Gajic", license: "MIT", url: gh("react-icons/react-icons"), get note() { return t("settings.about.licensesPage.note.iconSets") } },
            { name: "Motion", holder: "Motion Division", license: "MIT", url: "https://motion.dev" },
            { name: "React Router", holder: "Remix Software, Shopify", license: "MIT", url: "https://reactrouter.com" },
            { name: "Zustand", holder: "Poimandres", license: "MIT", url: gh("pmndrs/zustand") },
            { name: "Zod", holder: "Colin McDonnell", license: "MIT", url: "https://zod.dev" },
            { name: "React Hook Form", holder: "Beier (Bill) Luo", license: "MIT", url: "https://react-hook-form.com" },
            { name: "Hookform Resolvers", holder: "Beier (Bill) Luo", license: "MIT", url: gh("react-hook-form/resolvers") },
            { name: "Recharts", holder: "Recharts Group", license: "MIT", url: "https://recharts.org" },
            { name: "React Flow", holder: "webkid GmbH", license: "MIT", url: "https://reactflow.dev" },
            { name: "Sonner", holder: "Emil Kowalski", license: "MIT", url: gh("emilkowalski/sonner") },
            { name: "Vaul", holder: "Emil Kowalski", license: "MIT", url: gh("emilkowalski/vaul") },
            { name: "cmdk", holder: "Paco Coursey", license: "MIT", url: gh("pacocoursey/cmdk") },
            { name: "next-themes", holder: "Paco Coursey", license: "MIT", url: gh("pacocoursey/next-themes") },
            { name: "date-fns", holder: "Sasha Koss, Lesha Koss", license: "MIT", url: "https://date-fns.org" },
            { name: "Embla Carousel", holder: "David Jerleke", license: "MIT", url: "https://www.embla-carousel.com" },
            { name: "React DayPicker", holder: "Giampaolo Bellavite", license: "MIT", url: "https://daypicker.dev" },
            { name: "react-dropzone", holder: "Param Aggarwal", license: "MIT", url: gh("react-dropzone/react-dropzone") },
            { name: "react-resizable-panels", holder: "Brian Vaughn", license: "MIT", url: gh("bvaughn/react-resizable-panels") },
            { name: "react-country-flag", holder: "Dan Alloway", license: "MIT", url: gh("danalloway/react-country-flag") },
            { name: "input-otp", holder: "Guilherme Rodz", license: "MIT", url: gh("guilhermerodz/input-otp") },
            { name: "class-variance-authority", holder: "Joe Bell", license: "Apache-2.0", url: gh("joe-bell/cva") },
            { name: "clsx", holder: "Luke Edwards", license: "MIT", url: gh("lukeed/clsx") },
            { name: "tailwind-merge", holder: "Dany Castillo", license: "MIT", url: gh("dcastil/tailwind-merge") },
            { name: "tw-animate-css", holder: "Luca Bosin", license: "MIT", url: gh("Wombosvideo/tw-animate-css") },
        ],
    },
    {
        id: "fonts",
        get title() {
            return t("settings.about.licensesPage.section.fonts.title")
        },
        get hint() {
            return t("settings.about.licensesPage.section.fonts.hint")
        },
        items: [
            { name: "Rubik", holder: "Hubert & Fischer", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Rubik" },
            { name: "Inter", holder: "Rasmus Andersson", license: "OFL-1.1", url: "https://rsms.me/inter" },
            { name: "Manrope", holder: "Mikhail Sharanda", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Manrope" },
            { name: "Onest", holder: "Dmitri Voloshin", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Onest" },
            { name: "Geologica", holder: "Monokrom", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Geologica" },
            { name: "Nunito", holder: "Vernon Adams, Jacques Le Bailly", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Nunito" },
            { name: "Vazirmatn", holder: "Saber Rastikerdar", license: "OFL-1.1", url: "https://github.com/rastikerdar/vazirmatn" },
        ],
    },
    {
        id: "data",
        get title() {
            return t("settings.about.licensesPage.section.data.title")
        },
        get hint() {
            return t("settings.about.licensesPage.section.data.hint")
        },
        items: [
            { name: "russia-v2ray-rules-dat", holder: "runetfreedom", license: "GPL-3.0", url: gh("runetfreedom/russia-v2ray-rules-dat"), get note() { return t("settings.about.licensesPage.note.geoData") } },
        ],
    },
]
