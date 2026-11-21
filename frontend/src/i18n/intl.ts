import { getLanguage, getLanguageInfo } from "./index"

// Все форматы дат и чисел идут через локаль текущего языка, а не через "ru-RU".
export function intlLocale(): string {
    return getLanguageInfo(getLanguage()).intlLocale
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return value.toLocaleString(intlLocale(), options)
}

export function formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
    return new Date(value).toLocaleDateString(intlLocale(), options)
}

export function formatTime(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
    return new Date(value).toLocaleTimeString(intlLocale(), options)
}

export function formatDateTime(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
    return new Date(value).toLocaleString(intlLocale(), options)
}

const regionNamesCache = new Map<string, Intl.DisplayNames | null>()

export function regionName(code: string): string | undefined {
    const locale = intlLocale()
    if (!regionNamesCache.has(locale)) {
        try {
            regionNamesCache.set(locale, new Intl.DisplayNames([locale], { type: "region" }))
        } catch {
            regionNamesCache.set(locale, null)
        }
    }
    const names = regionNamesCache.get(locale)
    if (!names) return undefined
    try {
        const name = names.of(code.toUpperCase())
        return name && name.toUpperCase() !== code.toUpperCase() ? name : undefined
    } catch {
        return undefined
    }
}
