/* Генератор палитр тем.

   Каждая тема — встроенная или пользовательская — описывается «семенем»:
   база (тёмная / светлая / AMOLED), акцентный цвет и цвет фона в OKLCH.
   Из семени строится полный набор CSS-переменных shadcn: поверхности
   отстраиваются ступенями от светлоты фона, поэтому все темы подчиняются
   одной лестнице и не могут «забыть» токен. */

export type ThemeBase = 'dark' | 'light' | 'amoled'

export type ThemeSeed = {
    base: ThemeBase
    /** Акцент. Chroma меньше NEUTRAL_CHROMA — нейтральная тема; светлота
     *  зажимается в диапазон базы. */
    accent: Oklch
    /** Фон: светлота (в AMOLED игнорируется), насыщенность и оттенок. */
    surface: Oklch
}

export const THEME_VARS = [
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--destructive',
    '--destructive-foreground',
    '--border',
    '--input',
    '--ring',
    '--sidebar',
    '--sidebar-foreground',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-accent',
    '--sidebar-accent-foreground',
    '--sidebar-border',
    '--sidebar-ring',
    '--chart-1',
    '--chart-2',
    '--chart-3',
    '--chart-4',
    '--chart-5',
] as const

export type ThemeVar = (typeof THEME_VARS)[number]
export type ThemePalette = Record<ThemeVar, string>

const NEUTRAL_CHROMA = 0.03

/* ── Цветовая математика (OKLab, Björn Ottosson) ─────────────────────── */

export type Oklch = { l: number; c: number; h: number }
export type Hsv = { h: number; s: number; v: number }

const HEX_RE = /^#?([0-9a-f]{6})$/i

export function isHexColor(value: string): boolean {
    return HEX_RE.test(value.trim())
}

export function normalizeHex(value: string): string | null {
    const match = HEX_RE.exec(value.trim())
    return match ? `#${match[1].toLowerCase()}` : null
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function normalizeHue(hue: number): number {
    const h = hue % 360
    return h < 0 ? h + 360 : h
}

function hexToRgb(hex: string): [number, number, number] {
    const normalized = normalizeHex(hex) ?? '#000000'
    const n = parseInt(normalized.slice(1), 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function rgbToHex(r: number, g: number, b: number): string {
    const toByte = (v: number) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')
    return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

function srgbToLinear(c: number): number {
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function hexToOklch(hex: string): Oklch {
    const [r, g, b] = hexToRgb(hex).map(srgbToLinear)

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

    return {
        l: L,
        c: Math.sqrt(A * A + B * B),
        h: normalizeHue((Math.atan2(B, A) * 180) / Math.PI),
    }
}

function oklchToLinearRgb(l: number, c: number, h: number): [number, number, number] {
    const rad = (h * Math.PI) / 180
    const a = c * Math.cos(rad)
    const b = c * Math.sin(rad)

    const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
    const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
    const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

    return [
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
    ]
}

function inSrgbGamut(l: number, c: number, h: number): boolean {
    const eps = 1e-4
    return oklchToLinearRgb(l, c, h).every((v) => v >= -eps && v <= 1 + eps)
}

/** Максимальная chroma ≤ c, при которой цвет остаётся в sRGB. */
function fitChroma(l: number, c: number, h: number): number {
    if (c <= 0 || inSrgbGamut(l, c, h)) {
        return Math.max(0, c)
    }
    let lo = 0
    let hi = c
    for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2
        if (inSrgbGamut(l, mid, h)) lo = mid
        else hi = mid
    }
    return lo
}

export function hexToHsv(hex: string): Hsv {
    const [r, g, b] = hexToRgb(hex)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min

    let h = 0
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60
    }

    return { h: normalizeHue(h), s: max === 0 ? 0 : d / max, v: max }
}

export function hsvToHex({ h, s, v }: Hsv): string {
    const c = v * s
    const hh = normalizeHue(h) / 60
    const x = c * (1 - Math.abs((hh % 2) - 1))
    let rgb: [number, number, number]
    if (hh < 1) rgb = [c, x, 0]
    else if (hh < 2) rgb = [x, c, 0]
    else if (hh < 3) rgb = [0, c, x]
    else if (hh < 4) rgb = [0, x, c]
    else if (hh < 5) rgb = [x, 0, c]
    else rgb = [c, 0, x]
    const m = v - c
    return rgbToHex(rgb[0] + m, rgb[1] + m, rgb[2] + m)
}

/* ── Построение палитры ──────────────────────────────────────────────── */

/** Сдвиги светлот поверхностей относительно фона. Строго монотонные:
 *  карточки, поля ввода и ховеры никогда не сливаются между собой. */
type SurfaceSteps = {
    sidebar: number
    card: number
    popover: number
    muted: number
    input: number
    secondary: number
    sidebarAccent: number
    accent: number
    border: number
}

type BaseSpec = {
    /** Светлота фона по умолчанию и допустимый диапазон. */
    background: number
    backgroundMin: number
    backgroundMax: number
    steps: SurfaceSteps
    /** AMOLED: ступени абсолютные, фон всегда 0. */
    absolute: boolean
    borderAlpha: number
    foreground: number
    mutedForeground: number
    primaryMin: number
    primaryMax: number
    neutralPrimary: number
}

const BASES: Record<ThemeBase, BaseSpec> = {
    dark: {
        background: 0.16,
        backgroundMin: 0.08,
        backgroundMax: 0.34,
        steps: {
            sidebar: 0.025,
            card: 0.05,
            popover: 0.06,
            muted: 0.1,
            input: 0.12,
            secondary: 0.13,
            sidebarAccent: 0.12,
            accent: 0.15,
            border: 0.2,
        },
        absolute: false,
        borderAlpha: 0.7,
        foreground: 0.97,
        mutedForeground: 0.72,
        primaryMin: 0.6,
        primaryMax: 0.85,
        neutralPrimary: 0.92,
    },
    amoled: {
        background: 0,
        backgroundMin: 0,
        backgroundMax: 0,
        steps: {
            sidebar: 0.1,
            card: 0.14,
            popover: 0.16,
            muted: 0.2,
            input: 0.22,
            secondary: 0.24,
            sidebarAccent: 0.22,
            accent: 0.26,
            border: 0.3,
        },
        absolute: true,
        borderAlpha: 0.7,
        foreground: 0.96,
        mutedForeground: 0.7,
        primaryMin: 0.6,
        primaryMax: 0.85,
        neutralPrimary: 0.92,
    },
    light: {
        background: 0.985,
        backgroundMin: 0.93,
        backgroundMax: 1,
        steps: {
            sidebar: -0.02,
            card: 0.015,
            popover: 0.015,
            muted: -0.04,
            input: -0.105,
            secondary: -0.055,
            sidebarAccent: -0.065,
            accent: -0.065,
            border: -0.105,
        },
        absolute: false,
        borderAlpha: 1,
        foreground: 0.22,
        mutedForeground: 0.5,
        primaryMin: 0.4,
        primaryMax: 0.62,
        neutralPrimary: 0.3,
    },
}

/** Выше этой светлоты на primary кладётся тёмный текст, ниже — белый. */
const PRIMARY_DARK_TEXT_FROM = 0.72

function round(value: number, digits: number): number {
    const f = 10 ** digits
    return Math.round(value * f) / f
}

function oklch(l: number, c: number, h: number, alpha = 1): string {
    const fitted = fitChroma(l, c, h)
    const hue = fitted < 1e-4 ? 0 : round(h, 2)
    const body = `${round(l, 4)} ${round(fitted, 4)} ${hue}`
    return alpha < 1 ? `oklch(${body} / ${round(alpha, 3)})` : `oklch(${body})`
}

export function backgroundChroma(tint: number): number {
    return 0.004 + clamp(tint, 0, 1) * 0.046
}

export function buildPalette(seed: ThemeSeed): ThemePalette {
    const spec = BASES[seed.base]
    const isLight = seed.base === 'light'
    const isAmoled = seed.base === 'amoled'

    const accentHue = normalizeHue(seed.accent.h)
    const surfaceHue = normalizeHue(seed.surface.h)
    const bgC = Math.max(0, seed.surface.c)
    const bgL = spec.absolute
        ? spec.background
        : clamp(seed.surface.l, spec.backgroundMin, spec.backgroundMax)

    const levelOf = (step: number) =>
        clamp(spec.absolute ? step : bgL + step, 0, 1)
    const surface = (step: number, mul = 1, alpha = 1) =>
        oklch(levelOf(step), bgC * mul, surfaceHue, alpha)

    // AMOLED: приподнятые поверхности тонируются слабее, иначе на чёрном
    // фоне они выглядят цветными пятнами. В светлой базе карточки почти белые.
    const raisedMul = isAmoled ? 0.7 : 1
    const paperMul = isLight ? 0.3 : raisedMul * 1.1
    const { steps } = spec

    const background = isAmoled ? 'oklch(0 0 0)' : oklch(bgL, bgC, surfaceHue)
    const sidebar = surface(steps.sidebar, raisedMul)
    const card = surface(steps.card, paperMul)
    const popover = surface(steps.popover, paperMul)
    const muted = surface(steps.muted, raisedMul)
    const secondary = surface(steps.secondary, raisedMul * 1.1)
    const accent = surface(steps.accent, raisedMul * 1.2)
    const sidebarAccent = surface(steps.sidebarAccent, raisedMul * 1.1)
    const input = surface(steps.input, raisedMul)
    const border = surface(steps.border, raisedMul * 1.2, spec.borderAlpha)

    const textC = isLight ? Math.min(0.03, bgC * 0.8 + 0.005) : Math.min(0.015, bgC * 0.35)
    const foreground = oklch(spec.foreground, textC, surfaceHue)
    const mutedForeground = oklch(
        spec.mutedForeground,
        isLight ? Math.min(0.035, bgC + 0.01) : Math.min(0.03, bgC * 0.8 + 0.005),
        surfaceHue,
    )

    const neutral = seed.accent.c < NEUTRAL_CHROMA
    const primaryL = neutral
        ? spec.neutralPrimary
        : clamp(seed.accent.l, spec.primaryMin, spec.primaryMax)
    const primaryC = fitChroma(primaryL, Math.max(0, seed.accent.c), accentHue)
    const primary = oklch(primaryL, primaryC, accentHue)
    const primaryForeground = primaryL > PRIMARY_DARK_TEXT_FROM
        ? oklch(isAmoled ? 0.12 : 0.18, Math.min(0.04, primaryC * 0.25 + 0.01), accentHue)
        : 'oklch(0.985 0 0)'
    const ring = oklch(primaryL, primaryC, accentHue, isLight ? 0.35 : 0.5)

    const chartL = isLight ? 0.6 : 0.74
    const chartC = neutral ? 0.14 : clamp(primaryC, 0.1, 0.16)
    const chartHues = neutral
        ? [25, 180, 220, 80, 40]
        : [accentHue, accentHue + 40, accentHue - 40, accentHue + 80, accentHue + 160]
    const charts = chartHues.map((h, i) =>
        i === 0 && !neutral ? primary : oklch(chartL, chartC, normalizeHue(h)),
    )

    return {
        '--background': background,
        '--foreground': foreground,
        '--card': card,
        '--card-foreground': foreground,
        '--popover': popover,
        '--popover-foreground': foreground,
        '--primary': primary,
        '--primary-foreground': primaryForeground,
        '--secondary': secondary,
        '--secondary-foreground': foreground,
        '--muted': muted,
        '--muted-foreground': mutedForeground,
        '--accent': accent,
        '--accent-foreground': foreground,
        '--destructive': isLight ? 'oklch(0.6 0.2 22)' : 'oklch(0.66 0.2 22)',
        '--destructive-foreground': 'oklch(0.985 0 0)',
        '--border': border,
        '--input': input,
        '--ring': ring,
        '--sidebar': sidebar,
        '--sidebar-foreground': foreground,
        '--sidebar-primary': primary,
        '--sidebar-primary-foreground': primaryForeground,
        '--sidebar-accent': sidebarAccent,
        '--sidebar-accent-foreground': foreground,
        '--sidebar-border': border,
        '--sidebar-ring': ring,
        '--chart-1': charts[0],
        '--chart-2': charts[1],
        '--chart-3': charts[2],
        '--chart-4': charts[3],
        '--chart-5': charts[4],
    }
}

/* ── Пользовательские темы ───────────────────────────────────────────── */

/** Оттенок для серых цветов, у которых hue не определён: нейтральный
 *  холодный, как у встроенной тёмной темы — фон не уходит в красный. */
const GRAY_HUE = 286

export type CustomSeedInput = {
    color: string
    base: ThemeBase
    /** Насыщенность фона, 0..1. */
    tint: number
    /** Оттенок фона 0..360; null — как у акцента. */
    surfaceHue: number | null
    /** Светлота фона -1..1: минус — глубже, плюс — светлее. */
    depth: number
}

export function accentHueOf(color: string): number {
    const { c, h } = hexToOklch(color)
    return c < 0.01 ? GRAY_HUE : h
}

export function surfaceLightness(base: ThemeBase, depth: number): number {
    const d = clamp(depth, -1, 1)
    if (base === 'light') return 0.975 + d * 0.02
    if (base === 'amoled') return 0
    return 0.16 + d * 0.07
}

/** Семя пользовательской темы. */
export function customSeed(input: CustomSeedInput): ThemeSeed {
    const accent = hexToOklch(input.color)
    const accentHue = accentHueOf(input.color)
    return {
        base: input.base,
        accent: { ...accent, h: accentHue },
        surface: {
            l: surfaceLightness(input.base, input.depth),
            c: backgroundChroma(input.tint),
            h: input.surfaceHue ?? accentHue,
        },
    }
}

/** CSS-цвет полосы оттенков фона — для ползунка в редакторе. */
export function surfaceHueGradient(base: ThemeBase): string {
    const l = base === 'light' ? 0.88 : 0.5
    const stops = Array.from({ length: 13 }, (_, i) => {
        const h = i * 30
        return `${oklch(l, 0.12, h)} ${round((i / 12) * 100, 2)}%`
    })
    return `linear-gradient(to right, ${stops.join(', ')})`
}

/** Градиент для плитки выбора темы, строится из той же палитры. */
export function paletteGradient(palette: ThemePalette): string {
    const bg = palette['--background']
    const sidebar = palette['--sidebar']
    const primary = palette['--primary']
    return `linear-gradient(145deg, ${bg} 0%, ${sidebar} 55%, color-mix(in oklch, ${primary} 45%, ${sidebar}) 100%)`
}

/** Диагональный сплит светлой и тёмной палитр — плитка «Системная». */
export function splitGradient(light: ThemePalette, dark: ThemePalette): string {
    return `linear-gradient(135deg, ${light['--background']} 0%, ${light['--sidebar']} 49.5%, ${dark['--sidebar']} 50.5%, ${dark['--background']} 100%)`
}

/* ── Встроенные темы ─────────────────────────────────────────────────── */

export const BUILTIN_THEME_IDS = [
    'light',
    'dark',
    'amoled',
    'cosmic',
    'purple',
    'blue',
    'tokyo',
    'dracula',
    'mocha',
    'latte',
    'nord',
    'gruvbox',
    'slate',
    'stone',
    'emerald',
    'sunset',
    'rose',
] as const

export type BuiltinThemeId = (typeof BUILTIN_THEME_IDS)[number]

/** Эталоны в OKLCH: [база, фон L/C/H, акцент L/C/H]. Значения сняты
 *  с исходных hex-палитр (Catppuccin, Dracula, Tokyo Night, Gruvbox, Nord,
 *  Tailwind) и дальше проходят через общую лестницу. */
type SeedTuple = [
    base: ThemeBase,
    bgL: number, bgC: number, bgH: number,
    accL: number, accC: number, accH: number,
]

const BUILTIN_SEED_TUPLES: Record<BuiltinThemeId, SeedTuple> = {
    // Палитра фиксирована (STATIC_PALETTES), семя — для базы и смены акцента.
    light: ['light', 0.985, 0.001, 286.4, 0.546, 0.245, 262.9], // #2563eb
    // «Тёмная» — классическая палитра Beam (бывшая Beam Old): палитра фиксирована
    // (STATIC_PALETTES), семя нужно для базы и смены акцента.
    dark: ['dark', 0.141, 0.005, 285.8, 0.488, 0.243, 264.4],
    amoled: ['amoled', 0, 0.004, 255, 0.714, 0.143, 254.6], // #60a5fa
    cosmic: ['dark', 0.15, 0.035, 265, 0.8, 0.13, 200],
    purple: ['dark', 0.244, 0.05, 300.5, 0.722, 0.177, 305.5], // #241a34 / #c084fc
    blue: ['dark', 0.258, 0.03, 259.1, 0.714, 0.143, 254.6], // #1b2432 / #60a5fa
    tokyo: ['dark', 0.226, 0.021, 280.5, 0.719, 0.132, 264.2], // #1a1b26 / #7aa2f7
    dracula: ['dark', 0.288, 0.022, 277.5, 0.742, 0.149, 301.9], // #282a36 / #bd93f9
    mocha: ['dark', 0.243, 0.03, 283.9, 0.787, 0.119, 304.8], // #1e1e2e / #cba6f7
    latte: ['light', 0.958, 0.006, 264.5, 0.555, 0.25, 297], // #eff1f5 / #8839ef
    nord: ['dark', 0.324, 0.023, 264.2, 0.775, 0.062, 217.5], // #2e3440 / #88c0d0
    gruvbox: ['dark', 0.277, 0.004, 85, 0.832, 0.159, 83], // #282828 / #fabd2f
    slate: ['dark', 0.272, 0.016, 264.3, 0.711, 0.035, 256.8], // #23272f / #94a3b8
    stone: ['dark', 0.287, 0.007, 67.5, 0.836, 0.035, 78.6], // #2d2a27 / #d6c7b0
    emerald: ['dark', 0.251, 0.02, 168.9, 0.773, 0.153, 163.2], // #182520 / #34d399
    sunset: ['dark', 0.239, 0.032, 44.7, 0.758, 0.159, 55.9], // #2c1a12 / #fb923c
    rose: ['dark', 0.211, 0.041, 356.3, 0.719, 0.169, 13.4], // #271019 / #fb7185
}

export const BUILTIN_SEEDS: Record<BuiltinThemeId, ThemeSeed> = Object.fromEntries(
    Object.entries(BUILTIN_SEED_TUPLES).map(([id, [base, bgL, bgC, bgH, accL, accC, accH]]) => [
        id,
        {
            base,
            surface: { l: bgL, c: bgC, h: bgH },
            accent: { l: accL, c: accC, h: accH },
        },
    ]),
) as Record<BuiltinThemeId, ThemeSeed>

export function isBuiltinThemeId(value: string): value is BuiltinThemeId {
    return (BUILTIN_THEME_IDS as readonly string[]).includes(value)
}

/** Темы с ручной палитрой, мимо генератора. «Тёмная» — классическая
 *  тема Beam (shadcn zinc): белые кнопки, синий акцент в сайдбаре. */
const STATIC_PALETTES: Partial<Record<BuiltinThemeId, ThemePalette>> = {
    dark: {
        '--background': 'oklch(0.141 0.005 285.823)',
        '--foreground': 'oklch(0.985 0 0)',
        '--card': 'oklch(0.21 0.006 285.885)',
        '--card-foreground': 'oklch(0.985 0 0)',
        '--popover': 'oklch(0.21 0.006 285.885)',
        '--popover-foreground': 'oklch(0.985 0 0)',
        '--primary': 'oklch(0.92 0.004 286.32)',
        '--primary-foreground': 'oklch(0.21 0.006 285.885)',
        '--secondary': 'oklch(0.274 0.006 286.033)',
        '--secondary-foreground': 'oklch(0.985 0 0)',
        '--muted': 'oklch(0.274 0.006 286.033)',
        '--muted-foreground': 'oklch(0.705 0.015 286.067)',
        '--accent': 'oklch(0.274 0.006 286.033)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--destructive': 'oklch(0.704 0.191 22.216)',
        '--destructive-foreground': 'oklch(0.985 0 0)',
        '--border': 'oklch(1 0 0 / 10%)',
        '--input': 'oklch(1 0 0 / 15%)',
        '--ring': 'oklch(0.552 0.016 285.938)',
        '--sidebar': 'oklch(0.18 0.006 285.885)',
        '--sidebar-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
        '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
        '--sidebar-accent': 'oklch(0.274 0.006 286.033)',
        '--sidebar-accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-border': 'oklch(1 0 0 / 10%)',
        '--sidebar-ring': 'oklch(0.552 0.016 285.938)',
        '--chart-1': 'oklch(0.488 0.243 264.376)',
        '--chart-2': 'oklch(0.696 0.17 162.48)',
        '--chart-3': 'oklch(0.769 0.188 70.08)',
        '--chart-4': 'oklch(0.627 0.265 303.9)',
        '--chart-5': 'oklch(0.645 0.246 16.439)',
    },
    // Светлая пара к «Тёмной»: нейтральный zinc, тёмные кнопки, синий — только
    // кнопка подключения, акцент сайдбара и первый цвет графиков.
    light: {
        '--background': 'oklch(0.985 0.001 286.375)',
        '--foreground': 'oklch(0.141 0.005 285.823)',
        '--card': 'oklch(1 0 0)',
        '--card-foreground': 'oklch(0.141 0.005 285.823)',
        '--popover': 'oklch(1 0 0)',
        '--popover-foreground': 'oklch(0.141 0.005 285.823)',
        '--primary': 'oklch(0.21 0.006 285.885)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.945 0.003 286.32)',
        '--secondary-foreground': 'oklch(0.21 0.006 285.885)',
        '--muted': 'oklch(0.945 0.003 286.32)',
        '--muted-foreground': 'oklch(0.552 0.016 285.938)',
        '--accent': 'oklch(0.945 0.003 286.32)',
        '--accent-foreground': 'oklch(0.21 0.006 285.885)',
        '--destructive': 'oklch(0.577 0.245 27.325)',
        '--destructive-foreground': 'oklch(0.985 0 0)',
        '--border': 'oklch(0.9 0.004 286.32)',
        '--input': 'oklch(0.9 0.004 286.32)',
        '--ring': 'oklch(0.705 0.015 286.067)',
        '--sidebar': 'oklch(0.96 0.002 286.32)',
        '--sidebar-foreground': 'oklch(0.141 0.005 285.823)',
        '--sidebar-primary': 'oklch(0.546 0.245 262.881)',
        '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
        '--sidebar-accent': 'oklch(0.92 0.004 286.32)',
        '--sidebar-accent-foreground': 'oklch(0.21 0.006 285.885)',
        '--sidebar-border': 'oklch(0.9 0.004 286.32)',
        '--sidebar-ring': 'oklch(0.705 0.015 286.067)',
        '--chart-1': 'oklch(0.546 0.245 262.881)',
        '--chart-2': 'oklch(0.6 0.118 184.704)',
        '--chart-3': 'oklch(0.769 0.188 70.08)',
        '--chart-4': 'oklch(0.627 0.265 303.9)',
        '--chart-5': 'oklch(0.645 0.246 16.439)',
    },
}

const builtinPaletteCache = new Map<BuiltinThemeId, ThemePalette>()

export function builtinPalette(id: BuiltinThemeId): ThemePalette {
    let palette = builtinPaletteCache.get(id)
    if (!palette) {
        palette = STATIC_PALETTES[id] ?? buildPalette(BUILTIN_SEEDS[id])
        builtinPaletteCache.set(id, palette)
    }
    return palette
}

/** Свой акцент поверх готовой темы: фон и поверхности остаются теми же.
 *  У фиксированных палитр меняется то, что в них цветное (акцент сайдбара,
 *  кнопка подключения, первый цвет графиков); белые кнопки остаются белыми. */
export function builtinPaletteWithAccent(id: BuiltinThemeId, color: string | null): ThemePalette {
    const hex = color ? normalizeHex(color) : null
    if (!hex) {
        return builtinPalette(id)
    }
    const accent = { ...hexToOklch(hex), h: accentHueOf(hex) }
    const fixed = STATIC_PALETTES[id]
    if (fixed) {
        const l = clamp(accent.l, 0.45, 0.8)
        const value = oklch(l, accent.c, accent.h)
        return {
            ...fixed,
            '--sidebar-primary': value,
            '--sidebar-primary-foreground': l > PRIMARY_DARK_TEXT_FROM ? 'oklch(0.21 0.006 285.885)' : 'oklch(0.985 0 0)',
            '--chart-1': value,
        }
    }
    return buildPalette({ ...BUILTIN_SEEDS[id], accent })
}

/** Акцент темы в hex — для превью «Как в теме». */
export function themeAccentHex(id: BuiltinThemeId): string {
    const { l, c, h } = BUILTIN_SEEDS[id].accent
    return oklchToHex(l, c, h)
}

/* ── Цвет из изображения (обои / фото фона) ──────────────────────── */

function linearToSrgb(c: number): number {
    return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
}

export function oklchToHex(l: number, c: number, h: number): string {
    const [r, g, b] = oklchToLinearRgb(l, fitChroma(l, c, h), h)
    return rgbToHex(linearToSrgb(r), linearToSrgb(g), linearToSrgb(b))
}

/** sRGB 0..255 → OKLab [L, a, b]. */
export function rgb8ToOklab(r8: number, g8: number, b8: number): [number, number, number] {
    const r = srgbToLinear(r8 / 255)
    const g = srgbToLinear(g8 / 255)
    const b = srgbToLinear(b8 / 255)

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

    return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ]
}

/** Семя темы «Из обоев»: акцент — доминирующий живой цвет картинки, фон
 *  тонируется тем же оттенком (как Material You). Серые обои дают нейтральную тему. */
export function wallpaperSeed(color: string, base: ThemeBase): ThemeSeed {
    const neutral = hexToOklch(color).c < NEUTRAL_CHROMA
    return customSeed({ color, base, tint: neutral ? 0.15 : 0.6, surfaceHue: null, depth: 0 })
}
