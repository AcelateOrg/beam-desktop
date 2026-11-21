import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import { getLanguageInfo, LANGUAGES, SOURCE_LANGUAGE, type LanguageCode } from "./languages"
import type { LocaleShape } from "./locale-shape"
import en from "./locales/en"
import zhCN from "./locales/zh-CN"
import fa from "./locales/fa"
import ru from "./locales/ru"
import tr from "./locales/tr"

// Языки, для которых есть словарь. Остальные из LANGUAGES видны в
// переключателе, но выбрать их нельзя, пока нет перевода.
const RESOURCES: Partial<Record<LanguageCode, { translation: LocaleShape<typeof ru> }>> = {
    ru: { translation: ru },
    en: { translation: en },
    "zh-CN": { translation: zhCN },
    tr: { translation: tr },
    fa: { translation: fa },
}

const STORAGE_KEY = "beam-language"

export function isLanguageAvailable(code: string): code is LanguageCode {
    return code in RESOURCES
}

function readStoredLanguage(): LanguageCode | null {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        return stored && isLanguageAvailable(stored) ? stored : null
    } catch {
        return null
    }
}

// Первый запуск: берём язык системы, если он у нас есть. Сравниваем и
// полный тег (zh-CN), и основной язык (ru из ru-RU).
function detectSystemLanguage(): LanguageCode | null {
    for (const tag of navigator.languages ?? [navigator.language]) {
        if (!tag) continue
        const exact = LANGUAGES.find((l) => l.code.toLowerCase() === tag.toLowerCase())
        if (exact && isLanguageAvailable(exact.code)) return exact.code
        const base = tag.split("-")[0].toLowerCase()
        const byBase = LANGUAGES.find((l) => l.code.split("-")[0].toLowerCase() === base)
        if (byBase && isLanguageAvailable(byBase.code)) return byBase.code
    }
    return null
}

function applyDocumentLanguage(code: LanguageCode) {
    const info = getLanguageInfo(code)
    document.documentElement.lang = info.code
    document.documentElement.dir = info.dir
}

const initialLanguage = readStoredLanguage() ?? detectSystemLanguage() ?? SOURCE_LANGUAGE

void i18next.use(initReactI18next).init({
    resources: RESOURCES,
    lng: initialLanguage,
    supportedLngs: LANGUAGES.map((l) => l.code),
    load: "currentOnly",
    // Недопереведённый язык добирает строки из английского, а тот из русского (исходника).
    fallbackLng: {
        "zh-CN": ["en", SOURCE_LANGUAGE],
        en: [SOURCE_LANGUAGE],
        tr: ["en", SOURCE_LANGUAGE],
        fa: ["en", SOURCE_LANGUAGE],
        default: [SOURCE_LANGUAGE],
    },
    interpolation: { escapeValue: false },
    initAsync: false,
})

applyDocumentLanguage(initialLanguage)

export const i18n = i18next

// Глобальный t для всего приложения, включая сторы, хуки и константы модулей.
// При смене языка App перемонтирует дерево роутов, поэтому компонентам не
// нужен useTranslation, чтобы перерисоваться.
export const t = i18next.t.bind(i18next) as typeof i18next.t

export function getLanguage(): LanguageCode {
    const lng = i18next.resolvedLanguage ?? i18next.language
    return isLanguageAvailable(lng) ? lng : SOURCE_LANGUAGE
}

export async function setLanguage(code: LanguageCode): Promise<void> {
    if (!isLanguageAvailable(code)) return
    try {
        window.localStorage.setItem(STORAGE_KEY, code)
    } catch {
        // Без localStorage язык просто не запомнится до следующего запуска.
    }
    applyDocumentLanguage(code)
    await i18next.changeLanguage(code)
}

export function onLanguageChanged(listener: (code: LanguageCode) => void): () => void {
    const handler = (lng: string) => listener(isLanguageAvailable(lng) ? lng : SOURCE_LANGUAGE)
    i18next.on("languageChanged", handler)
    return () => i18next.off("languageChanged", handler)
}

export { LANGUAGES, getLanguageInfo, type LanguageCode } from "./languages"
