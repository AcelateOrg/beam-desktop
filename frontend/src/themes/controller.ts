import {
    WindowSetDarkTheme,
    WindowSetLightTheme,
    WindowSetSystemDefaultTheme,
} from '@wailsjs/runtime'

import {
    buildPalette,
    builtinPalette,
    builtinPaletteWithAccent,
    BUILTIN_SEEDS,
    customSeed,
    isBuiltinThemeId,
    normalizeHex,
    THEME_VARS,
    wallpaperSeed,
    type BuiltinThemeId,
    type ThemeBase,
    type ThemePalette,
    type ThemeVar,
} from './palette'
import { t } from "@/i18n"

export type CustomThemePreference = `custom:${string}`
/** 'wallpaper' — палитра из цвета обоев ОС (или своего фото фона), светлая
 *  или тёмная — как в системе. */
export type ThemePreference = 'system' | 'wallpaper' | BuiltinThemeId | CustomThemePreference
export type ResolvedTheme = Exclude<ThemePreference, 'system'>

export type CustomTheme = {
    id: string
    name: string
    color: string
    base: ThemeBase
    /** Насыщенность фона, 0..1. */
    tint: number
    /** Оттенок фона 0..360; null — как у акцента. */
    surfaceHue: number | null
    /** Светлота фона -1..1: минус — глубже, плюс — светлее. */
    depth: number
}

export type CustomThemeSeedFields = Pick<CustomTheme, 'color' | 'base' | 'tint' | 'surfaceHue' | 'depth'>

export const THEME_STORAGE_KEY = 'theme'
export const CUSTOM_THEMES_STORAGE_KEY = 'theme-custom'
/** Кэш применённой палитры: index.html ставит её до первой отрисовки. */
export const THEME_PALETTE_CACHE_KEY = 'theme-palette'
/** Последний цвет, извлечённый из обоев: { key, color }. */
export const WALLPAPER_COLOR_STORAGE_KEY = 'theme-wallpaper-color'
/** Настройки фона (см. backdrop.ts) — нужны уже при первой отрисовке. */
export const BACKDROP_STORAGE_KEY = 'beam:backdrop'
/** Свой акцент поверх готовых тем (#rrggbb) или пусто. */
export const ACCENT_STORAGE_KEY = 'theme-accent'

/** При фоне-картинке поверхности становятся полупрозрачными (доля
 *  собственного цвета). --background и --popover остаются плотными: ими
 *  заливаются диалоги и меню, а область страницы просвечивает через CSS. */
const BACKDROP_ALPHA: Partial<Record<ThemeVar, number>> = {
    '--sidebar': 62,
    '--card': 70,
    '--muted': 72,
    '--secondary': 76,
    '--accent': 76,
    '--sidebar-accent': 76,
    '--input': 76,
}

const CUSTOM_PREFIX = 'custom:'
const CUSTOM_ID_RE = /^[a-z0-9]{4,32}$/
/** Тема, на которую откатывается ссылка на удалённую пользовательскую. */
const CUSTOM_FALLBACK: BuiltinThemeId = 'dark'

/** Тема по умолчанию — «Системная» (светлая/тёмная как в ОС). Объявлена до
 *  состояния модуля ниже: оно читается при импорте, и на чистом профиле
 *  (пустой localStorage) ссылка на ещё не объявленную константу давала
 *  undefined и падение до первой отрисовки — чёрное окно. */
export const DEFAULT_THEME: ThemePreference = 'system'

type ThemeSnapshot = {
    preference: ThemePreference
    resolved: ResolvedTheme
    base: ThemeBase
    customThemes: readonly CustomTheme[]
    /** Свой акцент для готовых тем; null — акцент самой темы. */
    accent: string | null
    /** Влияет ли accent на текущую тему (у своих и «Из обоев» акцент свой). */
    accentApplies: boolean
}

type ThemeListener = () => void

const listeners = new Set<ThemeListener>()

const mediaQuery =
    typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null

let systemListenerAttached = false
let backendHydration: Promise<void> | null = null

let customThemes: readonly CustomTheme[] = readStoredCustomThemes()
let wallpaperColor: string | null = readStoredWallpaperColor()
let backdropActive = readStoredBackdropActive()
let accentOverride: string | null = readStoredAccent()
let snapshot: ThemeSnapshot = createSnapshot(readStoredThemePreference())

function isWailsAvailable(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).runtime !== 'undefined'
}

export function customThemePreference(id: string): CustomThemePreference {
    return `${CUSTOM_PREFIX}${id}`
}

export function customThemeIdOf(preference: string): string | null {
    if (!preference.startsWith(CUSTOM_PREFIX)) {
        return null
    }
    const id = preference.slice(CUSTOM_PREFIX.length)
    return CUSTOM_ID_RE.test(id) ? id : null
}

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
    if (!value) {
        return DEFAULT_THEME
    }
    // «Beam Old» стала темой «Тёмная» (id dark).
    if (value === 'beam-old') {
        return 'dark'
    }
    if (value === 'system' || value === 'wallpaper' || isBuiltinThemeId(value)) {
        return value
    }
    const customId = customThemeIdOf(value)
    return customId ? customThemePreference(customId) : DEFAULT_THEME
}

function sanitizeCustomTheme(value: unknown): CustomTheme | null {
    if (!value || typeof value !== 'object') {
        return null
    }
    const raw = value as Record<string, unknown>
    const id = typeof raw.id === 'string' ? raw.id : ''
    const color = typeof raw.color === 'string' ? normalizeHex(raw.color) : null
    if (!CUSTOM_ID_RE.test(id) || !color) {
        return null
    }
    const base: ThemeBase = raw.base === 'light' || raw.base === 'amoled' ? raw.base : 'dark'
    const tint = finiteIn(raw.tint, 0, 1)
    const depth = finiteIn(raw.depth, -1, 1)
    const surfaceHue = typeof raw.surfaceHue === 'number' && Number.isFinite(raw.surfaceHue)
        ? ((raw.surfaceHue % 360) + 360) % 360
        : null
    const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : t("settings.appearance.editor.defaultName")
    return { id, name, color, base, tint, surfaceHue, depth }
}

/** Число в [min, max]; не число или NaN — 0 (с последующим зажатием). */
function finiteIn(value: unknown, min: number, max: number): number {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
    return Math.min(max, Math.max(min, n))
}

function sanitizeCustomThemes(value: unknown): CustomTheme[] {
    if (!Array.isArray(value)) {
        return []
    }
    const seen = new Set<string>()
    const out: CustomTheme[] = []
    for (const item of value) {
        const theme = sanitizeCustomTheme(item)
        if (theme && !seen.has(theme.id)) {
            seen.add(theme.id)
            out.push(theme)
        }
    }
    return out
}

function readStoredCustomThemes(): CustomTheme[] {
    if (typeof window === 'undefined') {
        return []
    }
    try {
        return sanitizeCustomThemes(JSON.parse(window.localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY) ?? '[]'))
    } catch {
        return []
    }
}

function readStoredWallpaperColor(): string | null {
    if (typeof window === 'undefined') {
        return null
    }
    try {
        const raw = JSON.parse(window.localStorage.getItem(WALLPAPER_COLOR_STORAGE_KEY) ?? 'null')
        return raw && typeof raw.color === 'string' ? normalizeHex(raw.color) : null
    } catch {
        return null
    }
}

function readStoredAccent(): string | null {
    if (typeof window === 'undefined') {
        return null
    }
    try {
        return normalizeHex(window.localStorage.getItem(ACCENT_STORAGE_KEY) ?? '')
    } catch {
        return null
    }
}

function readStoredBackdropActive(): boolean {
    if (typeof window === 'undefined') {
        return false
    }
    try {
        const raw = JSON.parse(window.localStorage.getItem(BACKDROP_STORAGE_KEY) ?? 'null')
        return raw?.mode === 'wallpaper' || raw?.mode === 'photo'
    } catch {
        return false
    }
}

export function readStoredThemePreference(): ThemePreference {
    if (typeof window === 'undefined') {
        return DEFAULT_THEME
    }

    return normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY))
}

export function getSystemTheme(): 'light' | 'dark' {
    if (!mediaQuery) {
        return 'dark'
    }

    return mediaQuery.matches ? 'dark' : 'light'
}

function findCustomTheme(preference: string): CustomTheme | undefined {
    const id = customThemeIdOf(preference)
    return id ? customThemes.find((theme) => theme.id === id) : undefined
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
    if (preference === 'system') {
        return getSystemTheme()
    }
    if (customThemeIdOf(preference)) {
        return findCustomTheme(preference) ? preference : CUSTOM_FALLBACK
    }
    return preference
}

export function customThemePalette(theme: CustomThemeSeedFields): ThemePalette {
    return buildPalette(customSeed(theme))
}

/** Палитра темы «Из обоев». Пока цвет не известен — стандартная
 *  светлая/тёмная. */
export function wallpaperPalette(base: 'light' | 'dark' = getSystemTheme()): ThemePalette {
    return wallpaperColor ? buildPalette(wallpaperSeed(wallpaperColor, base)) : builtinPalette(base)
}

export function getWallpaperColor(): string | null {
    return wallpaperColor
}

/** Новый цвет обоев (key — источник и его версия, чтобы не пересчитывать
 *  ту же картинку при каждом запуске). Перекрашивает приложение, если тема активна. */
export function setWallpaperColor(color: string | null, key: string) {
    const next = color ? normalizeHex(color) : null
    try {
        window.localStorage.setItem(WALLPAPER_COLOR_STORAGE_KEY, JSON.stringify({ key, color: next }))
    } catch {
        // см. applyThemeToDocument
    }
    if (next === wallpaperColor) {
        return
    }
    wallpaperColor = next
    updateThemeSnapshot(snapshot.preference, { persist: false, syncWindow: false })
}

/** Ключ картинки, из которой извлечён сохранённый цвет обоев. */
export function storedWallpaperColorKey(): string | null {
    try {
        const raw = JSON.parse(window.localStorage.getItem(WALLPAPER_COLOR_STORAGE_KEY) ?? 'null')
        return raw && typeof raw.key === 'string' ? raw.key : null
    } catch {
        return null
    }
}

/** Включает полупрозрачные поверхности под фон-картинку. */
export function setBackdropActive(active: boolean) {
    if (active === backdropActive) {
        return
    }
    backdropActive = active
    updateThemeSnapshot(snapshot.preference, { persist: false, syncWindow: false })
}

function withBackdrop(palette: ThemePalette): ThemePalette {
    const out = { ...palette }
    for (const [name, alpha] of Object.entries(BACKDROP_ALPHA) as [ThemeVar, number][]) {
        out[name] = `color-mix(in oklch, ${palette[name]} ${alpha}%, transparent)`
    }
    return out
}

function describeResolved(resolved: ResolvedTheme): { base: ThemeBase; palette: ThemePalette } {
    if (resolved === 'wallpaper') {
        const base = getSystemTheme()
        return { base, palette: wallpaperPalette(base) }
    }
    const custom = findCustomTheme(resolved)
    if (custom) {
        return { base: custom.base, palette: customThemePalette(custom) }
    }
    const builtin = isBuiltinThemeId(resolved) ? resolved : CUSTOM_FALLBACK
    return {
        base: BUILTIN_SEEDS[builtin].base,
        palette: builtinPaletteWithAccent(builtin, accentOverride),
    }
}

function createSnapshot(preference: ThemePreference): ThemeSnapshot {
    const resolved = resolveTheme(preference)
    return {
        preference,
        resolved,
        base: describeResolved(resolved).base,
        customThemes,
        accent: accentOverride,
        accentApplies: resolved !== 'wallpaper' && !findCustomTheme(resolved),
    }
}

function emitThemeChange() {
    for (const listener of listeners) {
        listener()
    }
}

function applyThemeToDocument(preference: ThemePreference, persist: boolean) {
    if (typeof document === 'undefined') {
        return
    }

    const resolved = resolveTheme(preference)
    const described = describeResolved(resolved)
    const base = described.base
    const palette = backdropActive ? withBackdrop(described.palette) : described.palette
    const isDark = base !== 'light'
    const root = document.documentElement

    for (const name of THEME_VARS) {
        root.style.setProperty(name, palette[name])
    }

    root.classList.toggle('dark', isDark)
    root.dataset.theme = resolved
    root.dataset.themeBase = base
    root.dataset.themePreference = preference
    root.style.colorScheme = isDark ? 'dark' : 'light'
    if (backdropActive) {
        root.dataset.backdrop = ''
    } else {
        delete root.dataset.backdrop
    }

    if (typeof window === 'undefined') {
        return
    }
    try {
        if (persist) {
            window.localStorage.setItem(THEME_STORAGE_KEY, preference)
        }
        window.localStorage.setItem(
            THEME_PALETTE_CACHE_KEY,
            JSON.stringify({ resolved, dark: isDark, backdrop: backdropActive, vars: palette }),
        )
    } catch {
        // localStorage недоступен или переполнен — тема всё равно применена.
    }
}

export function syncWindowTheme(preference: ThemePreference) {
    if (!isWailsAvailable()) {
        return
    }

    if (preference === 'system') {
        WindowSetSystemDefaultTheme()
        return
    }

    if (describeResolved(resolveTheme(preference)).base === 'light') {
        WindowSetLightTheme()
        return
    }

    WindowSetDarkTheme()
}

function updateThemeSnapshot(
    preference: ThemePreference,
    options?: { persist?: boolean; syncWindow?: boolean }
) {
    const persist = options?.persist ?? true
    const shouldSyncWindow = options?.syncWindow ?? true

    snapshot = createSnapshot(preference)

    applyThemeToDocument(preference, persist)

    if (shouldSyncWindow) {
        syncWindowTheme(preference)
    }

    emitThemeChange()
}

function attachSystemThemeListener() {
    if (!mediaQuery || systemListenerAttached) {
        return
    }

    const handleSystemThemeChange = () => {
        // «Из обоев» тоже следует за светлой/тёмной схемой системы.
        if (snapshot.preference !== 'system' && snapshot.preference !== 'wallpaper') {
            return
        }

        updateThemeSnapshot(snapshot.preference, { persist: false, syncWindow: false })
    }

    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
        mediaQuery.addListener(handleSystemThemeChange)
    }

    systemListenerAttached = true
}

export function initThemeController() {
    attachSystemThemeListener()
    updateThemeSnapshot(snapshot.preference, { persist: false })
}

export function hydrateThemeFromBackend(loader: () => Promise<ThemePreference>) {
    if (backendHydration) {
        return backendHydration
    }

    backendHydration = (async () => {
        try {
            const backendPreference = normalizeThemePreference(await loader())
            updateThemeSnapshot(backendPreference, { persist: true })
        } finally {
            backendHydration = null
        }
    })()

    return backendHydration
}

export function setThemePreference(
    preference: ThemePreference,
    options?: { persist?: boolean; syncWindow?: boolean }
) {
    updateThemeSnapshot(preference, options)
}

/** Заменяет реестр пользовательских тем и перекрашивает приложение, если
 *  активна одна из них. */
export function setCustomThemes(themes: readonly unknown[]) {
    customThemes = sanitizeCustomThemes(themes)
    try {
        window.localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes))
    } catch {
        // см. applyThemeToDocument
    }
    updateThemeSnapshot(snapshot.preference, { persist: false })
}

/** Свой акцент для готовых тем (null — как в теме). Перекрашивает сразу. */
export function setAccentOverride(color: string | null) {
    const next = color ? normalizeHex(color) : null
    try {
        if (next) window.localStorage.setItem(ACCENT_STORAGE_KEY, next)
        else window.localStorage.removeItem(ACCENT_STORAGE_KEY)
    } catch {
        // см. applyThemeToDocument
    }
    if (next === accentOverride) {
        return
    }
    accentOverride = next
    updateThemeSnapshot(snapshot.preference, { persist: false, syncWindow: false })
}

export function getAccentOverride(): string | null {
    return accentOverride
}

export function getCustomThemes(): readonly CustomTheme[] {
    return customThemes
}

export function getThemeSnapshot(): ThemeSnapshot {
    return snapshot
}

export function subscribeToTheme(listener: ThemeListener) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
