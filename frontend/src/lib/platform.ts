import { GetBuildInfo } from "@wailsjs/go/handlers/SystemHandler"
import { isWailsNative } from "@/lib/wails-safe"

export type Platform = 'windows' | 'darwin' | 'linux'

const DEV_PLATFORM_KEY = 'beam:dev-platform'

const RESOLVED_PLATFORM_KEY = 'beam:platform'
const DEV_BUILD_KEY = 'beam:is-dev-build'

export const PLATFORM_OVERRIDE_CHANGED_EVENT = 'beam:platform-override-changed'

function parsePlatform(value: string | null | undefined): Platform | null {
    if (value === 'windows' || value === 'darwin' || value === 'linux') return value
    return null
}

let resolvedPlatform: Platform | null = parsePlatform(localStorage.getItem(RESOLVED_PLATFORM_KEY))
let isDevBuild = localStorage.getItem(DEV_BUILD_KEY) === 'true'

function guessPlatformFromUserAgent(): Platform {
    const ua = navigator.userAgent
    if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'darwin'
    if (ua.includes('Linux')) return 'linux'
    return 'windows'
}

export function getPlatform(): Platform {
    if (isDevBuild) {
        const override = parsePlatform(localStorage.getItem(DEV_PLATFORM_KEY))
        if (override) return override
    }
    return resolvedPlatform ?? guessPlatformFromUserAgent()
}

export async function initPlatform(): Promise<void> {
    if (!isWailsNative()) return

    const before = getPlatform()

    try {
        const result = await GetBuildInfo()
        if (!result.success || !result.data) return

        isDevBuild = result.data.isDev === true
        localStorage.setItem(DEV_BUILD_KEY, String(isDevBuild))

        if (!isDevBuild && localStorage.getItem(DEV_PLATFORM_KEY) !== null) {
            localStorage.removeItem(DEV_PLATFORM_KEY)
        }

        const reported = parsePlatform(result.data.os)
        if (reported) {
            resolvedPlatform = reported
            localStorage.setItem(RESOLVED_PLATFORM_KEY, reported)
        } else {
            console.warn('[platform] backend returned no platform, keeping:', before)
        }
    } catch (error) {
        console.warn('[platform] failed to get platform from Go:', error)
        return
    }

    if (getPlatform() !== before) {
        window.dispatchEvent(new Event(PLATFORM_OVERRIDE_CHANGED_EVENT))
    }
}

export function isDevPlatformOverrideAllowed(): boolean {
    return isDevBuild
}

export function setDevPlatformOverride(p: Platform | null) {
    if (!isDevBuild) return
    if (p) localStorage.setItem(DEV_PLATFORM_KEY, p)
    else localStorage.removeItem(DEV_PLATFORM_KEY)
    window.dispatchEvent(new Event(PLATFORM_OVERRIDE_CHANGED_EVENT))
}

export function getDevPlatformOverride(): Platform | null {
    if (!isDevBuild) return null
    return parsePlatform(localStorage.getItem(DEV_PLATFORM_KEY))
}
