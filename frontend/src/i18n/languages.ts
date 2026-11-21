// Реестр языков интерфейса. Новый язык: добавить сюда запись, положить
// словарь в locales/<code>/ и подключить его в RESOURCES (index.ts).
export type LanguageCode = "ru" | "en" | "zh-CN" | "tr" | "fa"

export interface LanguageInfo {
    code: LanguageCode
    // Название на самом языке: пользователь ищет свой язык, а не перевод его названия.
    nativeName: string
    // ISO-код страны для флага (flag-icons).
    flag: string
    // BCP 47-локаль для Intl: даты, числа, названия стран.
    intlLocale: string
    dir: "ltr" | "rtl"
}

export const SOURCE_LANGUAGE: LanguageCode = "ru"

export const LANGUAGES: readonly LanguageInfo[] = [
    { code: "ru", nativeName: "Русский", flag: "ru", intlLocale: "ru-RU", dir: "ltr" },
    { code: "en", nativeName: "English", flag: "gb", intlLocale: "en-US", dir: "ltr" },
    { code: "zh-CN", nativeName: "简体中文", flag: "cn", intlLocale: "zh-CN", dir: "ltr" },
    { code: "tr", nativeName: "Türkçe", flag: "tr", intlLocale: "tr-TR", dir: "ltr" },
    { code: "fa", nativeName: "فارسی", flag: "ir", intlLocale: "fa-IR-u-nu-latn", dir: "rtl" },
]

export function getLanguageInfo(code: string): LanguageInfo {
    return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}
