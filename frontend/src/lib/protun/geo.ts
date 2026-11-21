// Display helpers for the geoip / geosite cards. The codes themselves come
// from the downloaded databases; this file only names and orders them.

import { t } from "@/i18n"
import { intlLocale, regionName } from "@/i18n/intl"

export type GeoKind = "geoip" | "geosite"

export function isGeoKind(kind: string): kind is GeoKind {
    return kind === "geoip" || kind === "geosite"
}

// Two-letter codes are countries (flag + localized name); the rest are named
// lists such as ru-blocked or cloudflare.
export function isCountryCode(code: string): boolean {
    return /^[a-z]{2}$/i.test(code)
}

function countryName(code: string): string | undefined {
    return regionName(code)
}

const GEOIP_LABELS: Record<string, string> = {
    get private() { return t("protun.geo.label.private") },
    get "ru-blocked"() { return t("protun.geo.label.ruBlocked") },
    get "ru-blocked-community"() { return t("protun.geo.label.ruBlockedCommunity") },
    "re-filter": "Re:filter",
    cloudflare: "Cloudflare",
    cloudfront: "CloudFront",
    fastly: "Fastly",
    google: "Google",
    telegram: "Telegram",
    facebook: "Meta",
    twitter: "X (Twitter)",
    netflix: "Netflix",
    "ddos-guard": "DDoS-Guard",
    get yandex() { return t("protun.geo.label.yandex") },
}

const GEOSITE_LABELS: Record<string, string> = {
    get "category-ads-all"() { return t("protun.geo.label.categoryAdsAll") },
    get "category-ads"() { return t("protun.geo.label.categoryAds") },
    get "ru-blocked"() { return t("protun.geo.label.ruBlocked") },
    get "ru-blocked-all"() { return t("protun.geo.label.ruBlockedAll") },
    get "ru-available-only-inside"() { return t("protun.geo.label.ruAvailableOnlyInside") },
    get "category-ru"() { return t("protun.geo.label.categoryRu") },
    get "category-gov-ru"() { return t("protun.geo.label.categoryGovRu") },
    "category-porn": "18+",
    get "category-games"() { return t("protun.geo.label.categoryGames") },
    get "category-ai-!cn"() { return t("protun.geo.label.categoryAi") },
    youtube: "YouTube",
    google: "Google",
    telegram: "Telegram",
    discord: "Discord",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "X (Twitter)",
    tiktok: "TikTok",
    netflix: "Netflix",
    spotify: "Spotify",
    twitch: "Twitch",
    steam: "Steam",
    openai: "ChatGPT / OpenAI",
    anthropic: "Claude / Anthropic",
    microsoft: "Microsoft",
    apple: "Apple",
    github: "GitHub",
    cloudflare: "Cloudflare",
    get yandex() { return t("protun.geo.label.yandex") },
    get vk() { return t("protun.geo.label.vk") },
    mailru: "Mail.ru",
    linkedin: "LinkedIn",
    reddit: "Reddit",
    epicgames: "Epic Games",
    roblox: "Roblox",
}

const POPULAR: Record<GeoKind, string[]> = {
    geoip: ["ru", "ru-blocked", "us", "de", "nl", "fi", "gb", "fr", "tr", "kz", "by", "ua", "cn", "jp", "private"],
    geosite: [
        "ru-blocked",
        "ru-available-only-inside",
        "category-ads-all",
        "youtube",
        "telegram",
        "discord",
        "whatsapp",
        "instagram",
        "google",
        "openai",
        "twitter",
        "tiktok",
        "netflix",
        "spotify",
        "steam",
        "category-gov-ru",
    ],
}

export function geoLabel(kind: GeoKind, code: string): string {
    const key = code.toLowerCase()
    if (kind === "geoip") {
        if (isCountryCode(key)) return countryName(key) ?? key.toUpperCase()
        return GEOIP_LABELS[key] ?? key
    }
    // "google@ads" — только домены категории с атрибутом @ads.
    const at = key.indexOf("@")
    if (at > 0) {
        const base = key.slice(0, at)
        return `${GEOSITE_LABELS[base] ?? base} @${key.slice(at + 1)}`
    }
    return GEOSITE_LABELS[key] ?? key
}

export interface GeoOption {
    code: string
    label: string
    popular: boolean
}

// Popular codes first (in their curated order), then everything else by name.
export function geoOptions(kind: GeoKind, codes: string[]): GeoOption[] {
    const popularOrder = new Map(POPULAR[kind].map((code, index) => [code, index]))
    const options = codes.map((code) => ({
        code,
        label: geoLabel(kind, code),
        popular: popularOrder.has(code),
    }))
    return options.sort((a, b) => {
        if (a.popular !== b.popular) return a.popular ? -1 : 1
        if (a.popular) return popularOrder.get(a.code)! - popularOrder.get(b.code)!
        return a.label.localeCompare(b.label, intlLocale())
    })
}
