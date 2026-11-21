import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { CustomThemeDraft } from "@/hooks/useCustomThemes"
import { cn } from "@/lib/utils"
import { customThemePalette, type CustomTheme } from "@/themes/controller"
import {
    accentHueOf,
    hexToHsv,
    hsvToHex,
    normalizeHex,
    surfaceHueGradient,
    type Hsv,
    type ThemeBase,
    type ThemePalette,
} from "@/themes/palette"
import { t } from "@/i18n"

const NAME_MAX_LENGTH = 40


type ThemeFields = Omit<CustomTheme, "id">

const DEFAULT_DRAFT: ThemeFields = {
    get name() {
        return t("settings.appearance.editor.defaultName")
    },
    color: "#6366f1",
    base: "dark",
    tint: 0.5,
    surfaceHue: null,
    depth: 0,
}

export const SWATCHES = [
    "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6", "#10b981", "#84cc16",
    "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#a855f7", "#64748b",
]

const BASE_OPTIONS: { value: ThemeBase; label: string }[] = [
    { value: "dark", get label() { return t("settings.appearance.editor.base.dark") } },
    { value: "light", get label() { return t("settings.appearance.editor.base.light") } },
    { value: "amoled", get label() { return t("settings.appearance.editor.base.amoled") } },
]

type SurfaceMode = "accent" | "custom"

const SURFACE_MODE_OPTIONS: { value: SurfaceMode; label: string }[] = [
    { value: "accent", get label() { return t("settings.appearance.editor.surface.fromAccent") } },
    { value: "custom", get label() { return t("settings.appearance.editor.surface.custom") } },
]

type EditorTab = "accent" | "surface"

const TAB_OPTIONS: { value: EditorTab; label: string }[] = [
    { value: "accent", get label() { return t("settings.appearance.editor.tab.accent") } },
    { value: "surface", get label() { return t("settings.appearance.editor.tab.surface") } },
]

/** Плашки палитры под превью: что именно строится из семени. */
const PALETTE_LEGEND: { variable: keyof ThemePalette; label: string }[] = [
    { variable: "--background", get label() { return t("settings.appearance.editor.palette.background") } },
    { variable: "--sidebar", get label() { return t("settings.appearance.editor.palette.sidebar") } },
    { variable: "--card", get label() { return t("settings.appearance.editor.palette.card") } },
    { variable: "--accent", get label() { return t("settings.appearance.editor.palette.hover") } },
    { variable: "--border", get label() { return t("settings.appearance.editor.palette.border") } },
    { variable: "--primary", get label() { return t("settings.appearance.editor.palette.accent") } },
]

const THUMB_CLASS =
    "pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_1px_4px_rgba(0,0,0,0.4)]"

function clamp01(value: number) {
    return Math.min(1, Math.max(0, value))
}

/** Pointer-capture drag: колбэк получает координаты в долях 0..1. */
function useDrag(onChange: (x: number, y: number) => void) {
    const ref = useRef<HTMLDivElement>(null)

    const update = (event: PointerEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect || rect.width === 0 || rect.height === 0) return
        onChange(
            clamp01((event.clientX - rect.left) / rect.width),
            clamp01((event.clientY - rect.top) / rect.height),
        )
    }

    return {
        ref,
        onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return
            event.currentTarget.setPointerCapture(event.pointerId)
            update(event)
        },
        onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event)
        },
    }
}

function arrowDelta(event: KeyboardEvent, step: number): [number, number] | null {
    const s = event.shiftKey ? step * 10 : step
    switch (event.key) {
        case "ArrowLeft": return [-s, 0]
        case "ArrowRight": return [s, 0]
        case "ArrowUp": return [0, -s]
        case "ArrowDown": return [0, s]
        default: return null
    }
}

/** Полоса выбора оттенка 0..360 с произвольным фоном-градиентом. */
function HueStrip({
    hue, onChange, gradient, label, thumbColor,
}: {
    hue: number
    onChange: (hue: number) => void
    gradient: string
    label: string
    thumbColor: string
}) {
    const drag = useDrag((x) => onChange(x * 360))

    return (
        <div
            ref={drag.ref}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hue)}
            className="relative h-3 w-full cursor-pointer touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ backgroundImage: gradient }}
            onPointerDown={drag.onPointerDown}
            onPointerMove={drag.onPointerMove}
            onKeyDown={(event) => {
                const delta = arrowDelta(event, 1)
                if (!delta) return
                event.preventDefault()
                onChange((hue + delta[0] - delta[1] + 360) % 360)
            }}
        >
            <span className={cn(THUMB_CLASS, "top-1/2")} style={{ left: `${(hue / 360) * 100}%`, backgroundColor: thumbColor }} />
        </div>
    )
}

const RAINBOW = "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"

export function ColorPicker({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
    const square = useDrag((x, y) => onChange({ h: hsv.h, s: x, v: 1 - y }))

    return (
        <div className="space-y-3">
            <div
                ref={square.ref}
                role="slider"
                tabIndex={0}
                aria-label={t("settings.appearance.editor.saturationBrightness")}
                aria-valuetext={`${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%`}
                className="relative h-32 w-full cursor-crosshair touch-none select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                    backgroundColor: `hsl(${hsv.h} 100% 50%)`,
                    backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
                }}
                onPointerDown={square.onPointerDown}
                onPointerMove={square.onPointerMove}
                onKeyDown={(event) => {
                    const delta = arrowDelta(event, 0.01)
                    if (!delta) return
                    event.preventDefault()
                    onChange({ h: hsv.h, s: clamp01(hsv.s + delta[0]), v: clamp01(hsv.v - delta[1]) })
                }}
            >
                <span
                    className={THUMB_CLASS}
                    style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hsvToHex(hsv) }}
                />
            </div>

            <HueStrip
                hue={hsv.h}
                onChange={(h) => onChange({ ...hsv, h })}
                gradient={RAINBOW}
                label={t("settings.appearance.editor.hue")}
                thumbColor={`hsl(${hsv.h} 100% 50%)`}
            />
        </div>
    )
}

function Segmented<T extends string>({
    value, options, onChange, label,
}: {
    value: T
    options: { value: T; label: string }[]
    onChange: (value: T) => void
    label: string
}) {
    return (
        <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "truncate rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        value === option.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

function Section({
    title, value, children, hint,
}: {
    title: string
    value?: ReactNode
    hint?: ReactNode
    children: ReactNode
}) {
    return (
        <section className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-xs font-medium text-foreground">{title}</h4>
                {value !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{value}</span>}
            </div>
            {children}
            {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
        </section>
    )
}

function formatSigned(value: number) {
    const n = Math.round(value * 100)
    return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0"
}

/** Схематичный макет интерфейса в цветах темы: поверхности, текст, акцент
 *  и элементы управления. Палитра скоупится на обёртку, поэтому утилиты
 *  Tailwind перекрашиваются без смены темы приложения. */
function ThemePreview({ palette, base, className }: { palette: ThemePalette; base: ThemeBase; className?: string }) {
    const isLight = base === "light"
    const style = useMemo(
        () => ({ ...palette, colorScheme: isLight ? "light" : "dark" }) as CSSProperties,
        [palette, isLight],
    )

    return (
        <div
            style={style}
            aria-hidden
            className={cn(
                "pointer-events-none flex select-none overflow-hidden rounded-xl bg-sidebar text-foreground ring-1 ring-border",
                !isLight && "dark",
                className,
            )}
        >
            <div className="flex w-9 shrink-0 flex-col items-center gap-1.5 py-2.5">
                <span className="mb-1 h-3 w-3 rounded-full bg-sidebar-primary" />
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={cn("flex h-5 w-5 items-center justify-center rounded-md", i === 0 && "bg-sidebar-accent")}
                    >
                        <span className={cn("h-2 w-2 rounded-[3px]", i === 0 ? "bg-sidebar-primary" : "bg-muted-foreground/40")} />
                    </span>
                ))}
            </div>

            <div className="mt-2 flex min-w-0 flex-1 flex-col gap-2 rounded-ss-lg bg-background p-2.5">
                <div className="rounded-lg bg-card p-2 ring-1 ring-border">
                    <div className="truncate text-[10px] font-semibold leading-none text-card-foreground">Beam Premium</div>
                    <div className="mt-1 truncate text-[9px] leading-none text-muted-foreground">{t("settings.appearance.editor.preview.usage")}</div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-2/5 rounded-full bg-primary" />
                    </div>
                </div>

                <div className="flex h-6 items-center rounded-md border border-input px-2 text-[9px] text-muted-foreground">
                    {t("settings.appearance.editor.preview.search")}
                </div>

                <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-2 py-1.5">
                    <span className="truncate text-[9px]">Kill switch</span>
                    <span className="flex h-3 w-5 shrink-0 items-center justify-end rounded-full bg-primary p-0.5">
                        <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </span>
                </div>

                <div className="mt-auto flex gap-1.5">
                    <span className="flex h-6 min-w-0 flex-1 items-center justify-center truncate rounded-md bg-primary px-1 text-[9px] font-medium text-primary-foreground">
                        {t("settings.appearance.editor.preview.connect")}
                    </span>
                    <span className="flex h-6 items-center justify-center rounded-md bg-secondary px-2 text-[9px] text-secondary-foreground">
                        {t("common.action.cancel")}
                    </span>
                </div>
            </div>
        </div>
    )
}

export function ThemeEditorDialog({
    open,
    onOpenChange,
    theme,
    onSave,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Редактируемая тема; null — создание новой. */
    theme: CustomTheme | null
    onSave: (draft: CustomThemeDraft) => Promise<boolean>
}) {
    const [tab, setTab] = useState<EditorTab>("accent")
    const [name, setName] = useState<string>(() => t("settings.appearance.editor.defaultName"))
    const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(DEFAULT_DRAFT.color))
    const [hexInput, setHexInput] = useState(DEFAULT_DRAFT.color)
    const [base, setBase] = useState<ThemeBase>(DEFAULT_DRAFT.base)
    const [tint, setTint] = useState(DEFAULT_DRAFT.tint)
    const [surfaceHue, setSurfaceHue] = useState<number | null>(DEFAULT_DRAFT.surfaceHue)
    const [depth, setDepth] = useState(DEFAULT_DRAFT.depth)
    const [saving, setSaving] = useState(false)

    // Сброс формы при каждом открытии — под выбранную тему или под новую.
    useEffect(() => {
        if (!open) return
        const source = theme ?? DEFAULT_DRAFT
        setTab("accent")
        setName(source.name)
        setHsv(hexToHsv(source.color))
        setHexInput(source.color)
        setBase(source.base)
        setTint(source.tint)
        setSurfaceHue(source.surfaceHue ?? null)
        setDepth(source.depth ?? 0)
        setSaving(false)
    }, [open, theme])

    const color = hsvToHex(hsv)

    const applyHsv = (next: Hsv) => {
        setHsv(next)
        setHexInput(hsvToHex(next))
    }

    const applyHex = (value: string) => {
        setHexInput(value)
        const normalized = normalizeHex(value)
        if (normalized) {
            // Сохраняем оттенок у серых цветов, чтобы ползунок не прыгал в 0.
            const next = hexToHsv(normalized)
            setHsv(next.s === 0 ? { ...next, h: hsv.h } : next)
        }
    }

    const draft = useMemo<ThemeFields>(
        () => ({ name: name.trim() || t("settings.appearance.editor.defaultName"), color, base, tint, surfaceHue, depth }),
        [name, color, base, tint, surfaceHue, depth],
    )

    const palette = useMemo(
        () => customThemePalette(draft),
        [draft.color, draft.base, draft.tint, draft.surfaceHue, draft.depth],
    )

    const surfaceMode: SurfaceMode = surfaceHue === null ? "accent" : "custom"
    const hueGradient = useMemo(() => surfaceHueGradient(base), [base])
    const isAmoled = base === "amoled"

    const changeSurfaceMode = (mode: SurfaceMode) => {
        if (mode === surfaceMode) return
        // Стартуем с оттенка акцента, чтобы фон не прыгал при переключении.
        setSurfaceHue(mode === "accent" ? null : Math.round(accentHueOf(color)))
    }

    const handleSave = async () => {
        setSaving(true)
        const ok = await onSave({ ...draft, id: theme?.id })
        setSaving(false)
        if (ok) onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next) }}>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col md:h-[min(35rem,calc(100vh-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[46rem]">
                <DialogHeader className="shrink-0 border-b border-border px-6 pt-5 pb-4 pe-14">
                    <DialogTitle>{theme ? t("settings.appearance.editor.titleEdit") : t("settings.appearance.editor.titleNew")}</DialogTitle>
                    <DialogDescription>
                        {t("settings.appearance.editor.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[15.5rem_minmax(0,1fr)] md:grid-rows-1">
                    <aside className="flex flex-col gap-3 border-b border-border bg-muted/30 p-4 md:border-e md:border-b-0 md:p-5">
                        <ThemePreview palette={palette} base={base} className="h-32 md:h-56" />
                        <div className="hidden md:block">
                            <div className="mb-2 text-[11px] font-medium text-muted-foreground">{t("settings.appearance.editor.palette.title")}</div>
                            <div className="grid grid-cols-6 gap-1.5">
                                {PALETTE_LEGEND.map(({ variable, label }) => (
                                    <span
                                        key={variable}
                                        title={label}
                                        className="aspect-square rounded-md ring-1 ring-foreground/10"
                                        style={{ backgroundColor: palette[variable] }}
                                    />
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="flex min-h-0 flex-col">
                        <div className="shrink-0 space-y-3 px-5 pt-4 pb-3">
                            <Input
                                aria-label={t("settings.appearance.editor.name")}
                                value={name}
                                maxLength={NAME_MAX_LENGTH}
                                placeholder={t("settings.appearance.editor.defaultName")}
                                onChange={(event) => setName(event.target.value)}
                            />
                            <Segmented value={tab} options={TAB_OPTIONS} onChange={setTab} label={t("settings.appearance.editor.section")} />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                            {tab === "accent" ? (
                                <div className="space-y-4">
                                    <Section title={t("settings.appearance.editor.accentColor")}>
                                        <ColorPicker hsv={hsv} onChange={applyHsv} />
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="h-8 w-8 shrink-0 rounded-md ring-1 ring-foreground/10" style={{ backgroundColor: color }} />
                                            <Input
                                                aria-label="HEX"
                                                value={hexInput}
                                                maxLength={7}
                                                spellCheck={false}
                                                className={cn("h-8 font-mono text-xs uppercase", !normalizeHex(hexInput) && "border-destructive")}
                                                onChange={(event) => applyHex(event.target.value)}
                                                onBlur={() => setHexInput(color)}
                                            />
                                        </div>
                                    </Section>

                                    <Section title={t("settings.appearance.editor.quickPick")}>
                                        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
                                            {SWATCHES.map((swatch) => (
                                                <button
                                                    key={swatch}
                                                    type="button"
                                                    aria-label={swatch}
                                                    aria-pressed={color === swatch}
                                                    onClick={() => applyHex(swatch)}
                                                    className="flex aspect-square items-center justify-center rounded-md ring-1 ring-black/10 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                    style={{ backgroundColor: swatch }}
                                                >
                                                    {color === swatch && <Check className="h-3 w-3 text-white drop-shadow" />}
                                                </button>
                                            ))}
                                        </div>
                                    </Section>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <Section title={t("settings.appearance.editor.base.title")}>
                                        <Segmented value={base} options={BASE_OPTIONS} onChange={setBase} label={t("settings.appearance.editor.base.title")} />
                                    </Section>

                                    <Section title={t("settings.appearance.editor.surface.title")}>
                                        <Segmented value={surfaceMode} options={SURFACE_MODE_OPTIONS} onChange={changeSurfaceMode} label={t("settings.appearance.editor.surface.title")} />
                                        {surfaceHue !== null && (
                                            <div className="pt-1">
                                                <HueStrip
                                                    hue={surfaceHue}
                                                    onChange={(next) => setSurfaceHue(Math.round(next))}
                                                    gradient={hueGradient}
                                                    label={t("settings.appearance.editor.surface.title")}
                                                    thumbColor={`oklch(0.6 0.12 ${surfaceHue})`}
                                                />
                                            </div>
                                        )}
                                    </Section>

                                    <Section
                                        title={t("settings.appearance.editor.depth.title")}
                                        value={isAmoled ? "—" : formatSigned(depth)}
                                        hint={isAmoled ? t("settings.appearance.editor.depth.amoledHint") : undefined}
                                    >
                                        <Slider
                                            value={[Math.round(depth * 100)]}
                                            min={-100}
                                            max={100}
                                            step={1}
                                            disabled={isAmoled}
                                            aria-label={t("settings.appearance.editor.depth.aria")}
                                            onValueChange={(value) => setDepth((value[0] ?? 0) / 100)}
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>{t("settings.appearance.editor.depth.deeper")}</span>
                                            <span>{t("settings.appearance.editor.depth.lighter")}</span>
                                        </div>
                                    </Section>

                                    <Section
                                        title={t("settings.appearance.editor.saturation.title")}
                                        value={`${Math.round(tint * 100)}%`}
                                        hint={isAmoled ? t("settings.appearance.editor.saturation.amoledHint") : undefined}
                                    >
                                        <Slider
                                            value={[Math.round(tint * 100)]}
                                            min={0}
                                            max={100}
                                            step={1}
                                            aria-label={t("settings.appearance.editor.saturation.aria")}
                                            onValueChange={(value) => setTint((value[0] ?? 0) / 100)}
                                        />
                                    </Section>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
                    <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>{t("common.action.cancel")}</Button>
                    <Button disabled={saving} onClick={() => void handleSave()}>
                        {theme ? t("common.action.save") : t("settings.appearance.editor.create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
