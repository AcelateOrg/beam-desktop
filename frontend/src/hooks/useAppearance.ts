import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
    DeleteCustomFont,
    GetAppearanceDetails,
    ListCustomFonts,
    SaveCustomFont,
    SetAppearanceDetails,
} from '@wailsjs/go/handlers/SettingsHandler'
import { isWailsNative } from '@/lib/wails-safe'
import { t } from "@/i18n"

export type BuiltinFont = 'rubik' | 'manrope' | 'geologica' | 'onest' | 'nunito'
export type FontOption = BuiltinFont | `custom:${string}`

export interface CustomFont {
    id: string
    name: string
    ext: string
}

const CUSTOM_PREFIX = 'custom:'
const FONT_ID_RE = /^[a-f0-9]{12}$/
const MAX_FONT_BYTES = 10 * 1024 * 1024

export const customFontValue = (id: string): FontOption => `custom:${id}`
export const customFontFamily = (id: string) => `BeamFont-${id}`

const loadedFaces = new Set<string>()

/** Регистрирует @font-face своего шрифта (файл отдаёт Go по /beam-font/<id>). */
export function ensureCustomFontFace(id: string) {
    if (loadedFaces.has(id) || !FONT_ID_RE.test(id)) return
    loadedFaces.add(id)
    const style = document.createElement('style')
    style.dataset.beamFont = id
    // Без font-weight: для обычного (не вариативного) файла жирный синтезируется.
    style.textContent = `@font-face{font-family:'${customFontFamily(id)}';src:url('/beam-font/${id}');font-display:swap}`
    document.head.appendChild(style)
}
export type RadiusOption = 'small' | 'medium' | 'large' | 'round'
export type AnimationOption = 'slide' | 'fade' | 'slide-up' | 'none'

const FONT_KEY = 'beam:font'
const RADIUS_KEY = 'beam:radius'
const ANIMATION_KEY = 'beam:animation'

function readFont(): FontOption {
    return (localStorage.getItem(FONT_KEY) as FontOption) || 'rubik'
}

function readRadius(): RadiusOption {
    return (localStorage.getItem(RADIUS_KEY) as RadiusOption) || 'medium'
}

function readAnimation(): AnimationOption {
    return (localStorage.getItem(ANIMATION_KEY) as AnimationOption) || 'slide'
}

function applyFont(font: FontOption) {
    const root = document.documentElement
    if (font.startsWith(CUSTOM_PREFIX)) {
        const id = font.slice(CUSTOM_PREFIX.length)
        ensureCustomFontFace(id)
        root.style.setProperty('--beam-custom-font', `'${customFontFamily(id)}'`)
        root.setAttribute('data-font', 'custom')
        return
    }
    root.style.removeProperty('--beam-custom-font')
    if (font === 'rubik') {
        root.removeAttribute('data-font')
    } else {
        root.setAttribute('data-font', font)
    }
}

function applyRadius(radius: RadiusOption) {
    document.documentElement.setAttribute('data-radius', radius)
}

function applyAnimation(animation: AnimationOption) {
    if (animation === 'slide') {
        document.documentElement.removeAttribute('data-animation')
    } else {
        document.documentElement.setAttribute('data-animation', animation)
    }
}

export function initAppearance() {
    applyFont(readFont())
    applyRadius(readRadius())
    applyAnimation(readAnimation())
}

let hydrationStarted = false

export function useAppearance() {
    const [font, setFontState] = useState<FontOption>(readFont)
    const [radius, setRadiusState] = useState<RadiusOption>(readRadius)
    const [animation, setAnimationState] = useState<AnimationOption>(readAnimation)

    useEffect(() => {
        if (hydrationStarted || !isWailsNative()) return
        hydrationStarted = true

        GetAppearanceDetails()
            .then((result) => {
                if (!result.success || !result.data) return
                const { font: f, radius: r, animation: a } = result.data
                if (f) {
                    setFontState(f as FontOption)
                    localStorage.setItem(FONT_KEY, f)
                    applyFont(f as FontOption)
                }
                if (r) {
                    setRadiusState(r as RadiusOption)
                    localStorage.setItem(RADIUS_KEY, r)
                    applyRadius(r as RadiusOption)
                }
                if (a) {
                    setAnimationState(a as AnimationOption)
                    localStorage.setItem(ANIMATION_KEY, a)
                    applyAnimation(a as AnimationOption)
                }
            })
            .catch(() => {})
    }, [])

    const setFont = (next: FontOption) => {
        setFontState(next)
        localStorage.setItem(FONT_KEY, next)
        applyFont(next)
        if (isWailsNative()) {
            void SetAppearanceDetails(next, readRadius(), readAnimation())
        }
    }

    const setRadius = (next: RadiusOption) => {
        setRadiusState(next)
        localStorage.setItem(RADIUS_KEY, next)
        applyRadius(next)
        if (isWailsNative()) {
            void SetAppearanceDetails(readFont(), next, readAnimation())
        }
    }

    const setAnimation = (next: AnimationOption) => {
        setAnimationState(next)
        localStorage.setItem(ANIMATION_KEY, next)
        applyAnimation(next)
        if (isWailsNative()) {
            void SetAppearanceDetails(readFont(), readRadius(), next)
        }
    }

    return { font, setFont, radius, setRadius, animation, setAnimation }
}

function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
    })
}

/** Свои шрифты: список, загрузка файла, удаление. */
export function useCustomFonts() {
    const [fonts, setFonts] = useState<CustomFont[]>([])
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!isWailsNative()) return
        ListCustomFonts()
            .then((r) => {
                if (!r.success) return
                const list = (r.data ?? []) as CustomFont[]
                list.forEach((f) => ensureCustomFontFace(f.id))
                setFonts(list)
            })
            .catch(() => {})
    }, [])

    const addFont = useCallback(async (file: File): Promise<CustomFont | null> => {
        if (file.size > MAX_FONT_BYTES) {
            toast.error(t("settings.appearance.toast.fontTooLarge"))
            return null
        }
        setBusy(true)
        try {
            // Сначала проверяем, что webview вообще может отрисовать файл.
            try {
                await new FontFace('BeamFontProbe', await file.arrayBuffer()).load()
            } catch {
                toast.error(t("settings.appearance.toast.fontReadFailed"), { description: t("settings.appearance.toast.fontFormats") })
                return null
            }
            const r = await SaveCustomFont(file.name, await readAsDataURL(file))
            if (!r.success || !r.data) {
                toast.error(r.error || t("settings.appearance.toast.fontSaveFailed"))
                return null
            }
            const saved = r.data as CustomFont
            ensureCustomFontFace(saved.id)
            setFonts((prev) => (prev.some((f) => f.id === saved.id) ? prev : [...prev, saved]))
            toast.success(t("settings.appearance.toast.fontAdded", { name: saved.name }))
            return saved
        } catch {
            toast.error(t("settings.appearance.toast.fontSaveFailed"))
            return null
        } finally {
            setBusy(false)
        }
    }, [])

    const removeFont = useCallback(async (id: string) => {
        const r = await DeleteCustomFont(id).catch(() => null)
        if (!r?.success) {
            toast.error(r?.error || t("settings.appearance.toast.fontDeleteFailed"))
            return false
        }
        setFonts((prev) => prev.filter((f) => f.id !== id))
        return true
    }, [])

    return { fonts, busy, addFont, removeFont }
}
