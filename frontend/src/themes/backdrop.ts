import { t } from "@/i18n"
/* Фон под интерфейсом (обои ОС или своё фото) и цвет для темы «Из обоев».

   Картинки отдаёт asset server (см. internal/presentation/wails/media):
   /beam-backdrop/wallpaper и /beam-backdrop/photo. Query ?v= — версия картинки,
   по ней же кэшируется извлечённый цвет, чтобы не пересчитывать его на
   каждом запуске. */

import {
    GetBackdrop,
    GetWallpaperInfo,
    RemoveBackdropPhoto,
    SaveBackdropPhoto,
    UpdateBackdrop,
} from '@wailsjs/go/handlers/SettingsHandler'
import { settings } from '@wailsjs/go/models'

import { isWailsNative } from '@/lib/wails-safe'
import {
    BACKDROP_STORAGE_KEY,
    setBackdropActive,
    setWallpaperColor,
    storedWallpaperColorKey,
} from './controller'
import { extractAccentColor, loadImage } from './image-color'

export type BackdropMode = 'off' | 'wallpaper' | 'photo'
/** content — плотная страница и стеклянный сайдбар; sidebar — тёмный сайдбар
 *  и светлая страница. */
export type BackdropStyle = 'content' | 'sidebar'

export type BackdropConfig = {
    mode: BackdropMode
    /** Размытие, px (0..40). */
    blur: number
    /** Затемнение, % (-100..90): минус — осветление картинки. */
    dim: number
    /** Плотность панелей относительно стиля (-50..50). */
    density: number
    style: BackdropStyle
    /** Пусто — своё фото не загружено. */
    photoVersion: string
}

export type BackdropSnapshot = {
    config: BackdropConfig
    /** Найдены ли обои ОС; null — ещё не спрашивали. */
    wallpaperAvailable: boolean | null
    /** Картинка фона для отрисовки; null — фона нет. */
    imageUrl: string | null
    /** Превью своего фото для настроек; null — фото нет. */
    photoUrl: string | null
    /** Превью обоев ОС; null — обои не найдены. */
    wallpaperUrl: string | null
}

const DEFAULT_CONFIG: BackdropConfig = { mode: 'off', blur: 12, dim: 55, density: 0, style: 'content', photoVersion: '' }
const PHOTO_MAX_SIDE = 2560
const PHOTO_QUALITY = 0.9
const WALLPAPER_RECHECK_MS = 3000

type Stored = BackdropConfig & { wallpaperVersion?: string }

const listeners = new Set<() => void>()

const stored = readStored()
let config: BackdropConfig = stored.config
let wallpaperVersion: string = stored.wallpaperVersion
let wallpaperAvailable: boolean | null = null
let failedUrl: string | null = null
let snapshot: BackdropSnapshot = buildSnapshot()

let initialized = false
let lastWallpaperCheck = 0
let colorJob = 0

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
    const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
    return Math.min(max, Math.max(min, n))
}

function sanitizeConfig(raw: unknown): BackdropConfig {
    const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const photoVersion = typeof value.photoVersion === 'string' ? value.photoVersion : ''
    let mode: BackdropMode = value.mode === 'wallpaper' || value.mode === 'photo' ? value.mode : 'off'
    if (mode === 'photo' && !photoVersion) mode = 'off'
    return {
        mode,
        blur: clampInt(value.blur, 0, 40, DEFAULT_CONFIG.blur),
        dim: clampInt(value.dim, -100, 90, DEFAULT_CONFIG.dim),
        density: clampInt(value.density, -50, 50, DEFAULT_CONFIG.density),
        style: value.style === 'sidebar' ? 'sidebar' : 'content',
        photoVersion,
    }
}

function readStored(): { config: BackdropConfig; wallpaperVersion: string } {
    try {
        const raw = JSON.parse(window.localStorage.getItem(BACKDROP_STORAGE_KEY) ?? 'null') as Stored | null
        return {
            config: sanitizeConfig(raw),
            wallpaperVersion: typeof raw?.wallpaperVersion === 'string' ? raw.wallpaperVersion : '',
        }
    } catch {
        return { config: { ...DEFAULT_CONFIG }, wallpaperVersion: '' }
    }
}

function persist() {
    try {
        const value: Stored = { ...config, wallpaperVersion }
        window.localStorage.setItem(BACKDROP_STORAGE_KEY, JSON.stringify(value))
    } catch {
        // localStorage недоступен — настройки всё равно применены и хранятся в бэкенде.
    }
}

function photoUrlOf(version: string): string | null {
    return version ? `/beam-backdrop/photo?v=${encodeURIComponent(version)}` : null
}

function wallpaperUrlOf(): string | null {
    // До первого ответа бэкенда доверяем запомненной версии: фон появляется сразу.
    if (wallpaperAvailable === false || !wallpaperVersion) return null
    return `/beam-backdrop/wallpaper?v=${encodeURIComponent(wallpaperVersion)}`
}

function backdropUrl(): string | null {
    const url = config.mode === 'photo' ? photoUrlOf(config.photoVersion)
        : config.mode === 'wallpaper' ? wallpaperUrlOf()
            : null
    return url && url !== failedUrl ? url : null
}

/** Источник цвета для темы «Из обоев»: своё фото, если оно сейчас фон,
 *  иначе обои ОС, а без них — хотя бы загруженное фото. */
function paletteSourceUrl(): string | null {
    if (config.mode === 'photo' && config.photoVersion) return photoUrlOf(config.photoVersion)
    return wallpaperUrlOf() ?? photoUrlOf(config.photoVersion)
}

function buildSnapshot(): BackdropSnapshot {
    return {
        config,
        wallpaperAvailable,
        imageUrl: backdropUrl(),
        photoUrl: photoUrlOf(config.photoVersion),
        wallpaperUrl: wallpaperUrlOf(),
    }
}

/** Базовая плотность (%) сайдбара и страницы для каждого стиля. */
const STYLE_ALPHA: Record<BackdropStyle, { sidebar: number; content: number }> = {
    content: { sidebar: 18, content: 74 },
    sidebar: { sidebar: 88, content: 38 },
}

/** Плотность -50..50 → множитель 0.25..2: влево шаг сильнее, чтобы панели
 *  можно было сделать почти прозрачными. */
function scaledAlpha(alpha: number, density: number): number {
    const factor = density >= 0 ? 2 ** (density / 50) : 4 ** (density / 50)
    return Math.round(Math.min(96, Math.max(0, alpha * factor)))
}

/** Цвета панелей поверх картинки — CSS-переменные для style.css. */
function applyDocumentVars() {
    const root = document.documentElement
    const base = STYLE_ALPHA[config.style]
    const sidebar = scaledAlpha(base.sidebar, config.density)
    const content = scaledAlpha(base.content, config.density)
    // В «Тёмном меню» сайдбар уводится к чёрному, страница — к белому.
    const sidebarColor = config.style === 'sidebar'
        ? 'color-mix(in oklch, var(--background) 82%, black)'
        : 'var(--background)'
    const contentColor = config.style === 'sidebar'
        ? 'color-mix(in oklch, var(--background) 86%, white)'
        : 'var(--background)'
    root.dataset.backdropStyle = config.style
    root.style.setProperty('--backdrop-sidebar-bg', `color-mix(in oklch, ${sidebarColor} ${sidebar}%, transparent)`)
    root.style.setProperty('--backdrop-content-bg', `color-mix(in oklch, ${contentColor} ${content}%, transparent)`)
}

function emit() {
    snapshot = buildSnapshot()
    applyDocumentVars()
    setBackdropActive(snapshot.imageUrl !== null)
    for (const listener of listeners) listener()
    void syncWallpaperColor()
}

/** Пересчитывает цвет обоев, если сменилась картинка-источник. */
async function syncWallpaperColor() {
    const url = paletteSourceUrl()
    if (!url || url === storedWallpaperColorKey()) return
    // Обои ещё не проверены бэкендом — ждём актуальную версию.
    if (wallpaperAvailable === null && url.startsWith('/beam-backdrop/wallpaper')) return

    const job = ++colorJob
    try {
        const img = await loadImage(url)
        if (job !== colorJob) return
        const color = extractAccentColor(img)
        if (color) setWallpaperColor(color, url)
    } catch (error) {
        console.warn('[backdrop] failed to extract wallpaper color:', error)
    }
}

function applyConfig(next: BackdropConfig) {
    const changedSource = next.mode !== config.mode || next.photoVersion !== config.photoVersion
    config = sanitizeConfig(next)
    if (changedSource) failedUrl = null
    persist()
    emit()
}

function fromBackend(data: settings.BackdropSettings | undefined | null): BackdropConfig {
    return sanitizeConfig(data ?? DEFAULT_CONFIG)
}

async function refreshWallpaperInfo(force = false) {
    if (!isWailsNative()) return
    const now = Date.now()
    if (!force && now - lastWallpaperCheck < WALLPAPER_RECHECK_MS) return
    lastWallpaperCheck = now
    try {
        const result = await GetWallpaperInfo()
        if (!result.success || !result.data) return
        const available = Boolean(result.data.available)
        const version = available ? result.data.version : ''
        if (available === wallpaperAvailable && version === wallpaperVersion) return
        wallpaperAvailable = available
        wallpaperVersion = version
        failedUrl = null
        persist()
        emit()
    } catch (error) {
        console.warn('[backdrop] GetWallpaperInfo:', error)
    }
}

/** Запускается один раз: тянет настройки из бэкенда и следит за сменой обоев
 *  (проверка при возврате фокуса в окно). */
export function initBackdrop() {
    if (initialized || typeof window === 'undefined') return
    initialized = true

    emit()
    if (!isWailsNative()) return

    void (async () => {
        try {
            const result = await GetBackdrop()
            if (result.success) {
                config = fromBackend(result.data)
                persist()
            }
        } catch (error) {
            console.warn('[backdrop] GetBackdrop:', error)
        }
        await refreshWallpaperInfo(true)
        emit()
    })()

    window.addEventListener('focus', () => void refreshWallpaperInfo())
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void refreshWallpaperInfo()
    })
}

/** Картинка фона не загрузилась (файл удалён, формат не поддерживается
 *  webview): поверхности снова становятся плотными. */
export function reportBackdropImageError(url: string) {
    if (snapshot.imageUrl !== url) return
    failedUrl = url
    emit()
}

export function getBackdropSnapshot(): BackdropSnapshot {
    return snapshot
}

export function subscribeToBackdrop(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

/** Мгновенно применяет параметры (превью ползунков) без сохранения. */
export function previewBackdrop(patch: Partial<Pick<BackdropConfig, 'blur' | 'dim' | 'density'>>) {
    config = sanitizeConfig({ ...config, ...patch })
    snapshot = buildSnapshot()
    applyDocumentVars()
    for (const listener of listeners) listener()
}

/** Применяет и сохраняет настройки; при ошибке откатывает и возвращает текст. */
export async function updateBackdrop(patch: Partial<Omit<BackdropConfig, 'photoVersion'>>): Promise<string | null> {
    const previous = config
    applyConfig({ ...config, ...patch })
    if (!isWailsNative()) return null
    try {
        const result = await UpdateBackdrop(settings.BackdropSettings.createFrom({ ...config }))
        if (!result.success) {
            applyConfig(previous)
            return result.error || t("settings.appearance.backdrop.error.save")
        }
        applyConfig(fromBackend(result.data))
        return null
    } catch (error) {
        applyConfig(previous)
        return error instanceof Error ? error.message : String(error)
    }
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = String(reader.result ?? '')
            resolve(result.slice(result.indexOf(',') + 1))
        }
        reader.onerror = () => reject(reader.error ?? new Error(t("settings.appearance.backdrop.error.readPhoto")))
        reader.readAsDataURL(blob)
    })
}

/** Уменьшает фото до PHOTO_MAX_SIDE и перекодирует в JPEG: любой формат,
 *  который умеет декодировать webview, хранится одинаково и недорого. */
async function encodePhoto(file: File): Promise<string> {
    let bitmap: ImageBitmap
    try {
        bitmap = await createImageBitmap(file)
    } catch {
        throw new Error(t("settings.appearance.backdrop.error.unsupportedFormat"))
    }
    try {
        const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
        const width = Math.max(1, Math.round(bitmap.width * scale))
        const height = Math.max(1, Math.round(bitmap.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error(t("settings.appearance.backdrop.error.processPhoto"))
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(bitmap, 0, 0, width, height)
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY))
        if (!blob) throw new Error(t("settings.appearance.backdrop.error.processPhoto"))
        return await blobToBase64(blob)
    } finally {
        bitmap.close()
    }
}

/** Загружает своё фото и делает его фоном. Возвращает текст ошибки или null. */
export async function uploadBackdropPhoto(file: File): Promise<string | null> {
    if (!isWailsNative()) return t("settings.appearance.backdrop.error.appOnly")
    try {
        const encoded = await encodePhoto(file)
        const result = await SaveBackdropPhoto(encoded)
        if (!result.success) return result.error || t("settings.appearance.backdrop.error.savePhoto")
        applyConfig(fromBackend(result.data))
        return null
    } catch (error) {
        return error instanceof Error ? error.message : String(error)
    }
}

// Переменные панелей — сразу при загрузке модуля, до первого рендера.
if (typeof document !== 'undefined') applyDocumentVars()

export async function removeBackdropPhoto(): Promise<string | null> {
    if (!isWailsNative()) return null
    try {
        const result = await RemoveBackdropPhoto()
        if (!result.success) return result.error || t("settings.appearance.backdrop.error.remove")
        applyConfig(fromBackend(result.data))
        return null
    } catch (error) {
        return error instanceof Error ? error.message : String(error)
    }
}
