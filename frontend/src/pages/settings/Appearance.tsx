import { useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp, Loader2, Palette, Pencil, Plus, SlidersHorizontal, Sparkles, Trash2, Type } from "lucide-react"

import { AccentCard } from "@/components/appearance/AccentCard"
import { BackdropCard } from "@/components/appearance/BackdropCard"
import { ThemeEditorDialog } from "@/components/appearance/ThemeEditorDialog"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SettingsCard } from "@/components/ui/settings-card"
import { useTheme } from "@/hooks/useTheme"
import {
    customFontFamily,
    customFontValue,
    useAppearance,
    useCustomFonts,
    type AnimationOption,
    type BuiltinFont,
    type RadiusOption,
} from "@/hooks/useAppearance"
import { useCustomThemes, type CustomThemeDraft } from "@/hooks/useCustomThemes"
import { THEME_OPTIONS, themePreviewColors } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { customThemePalette, customThemePreference, wallpaperPalette, type CustomTheme } from "@/themes/controller"
import { builtinPaletteWithAccent, isBuiltinThemeId } from "@/themes/palette"
import type { Theme } from "@/types/api"
import { t } from "@/i18n"

const FONT_OPTIONS: { value: BuiltinFont; label: string; family: string }[] = [
    { value: 'rubik',     label: 'Rubik',     family: 'Rubik, sans-serif' },
    { value: 'manrope',   label: 'Manrope',   family: 'Manrope, sans-serif' },
    { value: 'geologica', label: 'Geologica', family: 'Geologica, sans-serif' },
    { value: 'onest',     label: 'Onest',     family: 'Onest, sans-serif' },
    { value: 'nunito',    label: 'Nunito',    family: 'Nunito, sans-serif' },
]


const FONT_ACCEPT = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2'

function FontTile({
    label, family, selected, onSelect,
}: {
    label: string; family: string; selected: boolean; onSelect: () => void
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            title={label}
            className={cn(
                "flex h-full w-full min-w-0 flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                selected
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
            )}
        >
            <span className="text-xl font-semibold leading-none" style={{ fontFamily: family }}>
                {t("settings.appearance.font.sample")}
            </span>
            <span className="w-full truncate text-center text-xs text-muted-foreground">{label}</span>
        </button>
    )
}

// corner — радиус уголка в превью (viewBox 48). Разница нарочно усилена, чтобы
// ступени читались с первого взгляда.
const RADIUS_OPTIONS: { value: RadiusOption; label: string; corner: number }[] = [
    { value: 'small',  get label() { return t("settings.appearance.radius.small") }, corner: 2  },
    { value: 'medium', get label() { return t("settings.appearance.radius.medium") }, corner: 9  },
    { value: 'large',  get label() { return t("settings.appearance.radius.large") }, corner: 16 },
    { value: 'round',  get label() { return t("settings.appearance.radius.round") }, corner: 26 },
]

// Уголок с «непрерывным» скруглением как у Apple: кривая начинается раньше
// дуги и плавно входит в прямые, без заметного стыка.
function CornerPreview({ r }: { r: number }) {
    const o = 8
    const end = 44
    const reach = r * 1.28
    const line = `M ${o} ${end} V ${o + reach} C ${o} ${o + r * 0.38} ${o + r * 0.38} ${o} ${o + reach} ${o} H ${end}`
    return (
        <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden>
            <path d={`${line} V ${end} Z`} fill="currentColor" opacity={0.08} />
            <path d={line} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

const ANIMATION_OPTIONS: { value: AnimationOption; label: string; desc: string; icon: string }[] = [
    { value: 'slide',    get label() { return t("settings.appearance.animation.slide.label") }, get desc() { return t("settings.appearance.animation.slide.description") }, icon: '→' },
    { value: 'slide-up', get label() { return t("settings.appearance.animation.slideUp.label") }, get desc() { return t("settings.appearance.animation.slideUp.description") }, icon: '↑' },
    { value: 'fade',     get label() { return t("settings.appearance.animation.fade.label") }, get desc() { return t("settings.appearance.animation.fade.description") }, icon: '◎' },
    { value: 'none',     get label() { return t("settings.appearance.animation.none.label") }, get desc() { return t("settings.appearance.animation.none.description") }, icon: '—' },
]

/** Вместе с плиткой «Из обоев» — ровно три ряда по три. */
const INITIAL_VISIBLE_THEMES = 8

const TILE_CLASS = "flex w-full flex-col gap-2 rounded-xl border p-2 text-start transition-all duration-200"

function ThemeTile({
    label, gradient, selected, onSelect,
}: {
    label: string; gradient: string; selected: boolean; onSelect: () => void
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
                TILE_CLASS,
                selected
                    ? "border-primary ring-1 ring-primary shadow-sm bg-primary/5"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
            )}
        >
            <div
                className="h-20 w-full rounded-lg border border-white/10"
                style={{ backgroundImage: gradient }}
            />
            <div className="truncate px-0.5 text-sm font-medium">{label}</div>
        </button>
    )
}

function CustomThemeTile({
    theme, selected, onSelect, onEdit, onDelete,
}: {
    theme: CustomTheme; selected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void
}) {
    const gradient = useMemo(
        () => themePreviewColors(customThemePalette(theme)).gradient,
        [theme.color, theme.base, theme.tint, theme.surfaceHue, theme.depth],
    )

    return (
        <div className="group relative">
            <ThemeTile label={theme.name} gradient={gradient} selected={selected} onSelect={onSelect} />
            <div className="absolute top-3.5 end-3.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    className="h-7 w-7 shadow-sm"
                    aria-label={t("settings.appearance.themes.edit", { name: theme.name })}
                    onClick={onEdit}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    className="h-7 w-7 text-destructive shadow-sm hover:text-destructive"
                    aria-label={t("settings.appearance.themes.delete", { name: theme.name })}
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}

function AddThemeTile({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-[7.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/30 hover:text-foreground"
        >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">{t("settings.appearance.themes.newTheme")}</span>
        </button>
    )
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>{label}</span>
            <span className="h-px flex-1 bg-border" />
        </div>
    )
}

export default function AppearancePage() {
    const { theme, setTheme, isLoading, accent } = useTheme()
    const { customThemes, saveTheme, deleteTheme } = useCustomThemes()
    const { font, setFont, radius, setRadius, animation, setAnimation } = useAppearance()
    const { fonts: customFonts, busy: fontBusy, addFont, removeFont } = useCustomFonts()
    const fontInputRef = useRef<HTMLInputElement>(null)

    const handleFontFile = async (file: File | undefined) => {
        if (!file) return
        const saved = await addFont(file)
        if (saved) setFont(customFontValue(saved.id))
    }

    const handleFontDelete = async (id: string) => {
        const wasActive = font === customFontValue(id)
        if (await removeFont(id) && wasActive) setFont('rubik')
    }
    // Активная тема должна быть видна сразу: если она пользовательская или
    // дальше первых INITIAL_VISIBLE_THEMES — список открывается развёрнутым.
    const [expanded, setExpanded] = useState(() => {
        if (theme === 'wallpaper') return false
        const index = THEME_OPTIONS.findIndex((option) => option.value === theme)
        return index === -1 || index >= INITIAL_VISIBLE_THEMES
    })
    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState<CustomTheme | null>(null)

    const visibleThemes = expanded ? THEME_OPTIONS : THEME_OPTIONS.slice(0, INITIAL_VISIBLE_THEMES)

    const selectTheme = (next: Theme) => {
        if (!isLoading && next !== theme) void setTheme(next)
    }

    const openEditor = (target: CustomTheme | null) => {
        setEditing(target)
        setEditorOpen(true)
    }

    const handleSave = async (draft: CustomThemeDraft) => Boolean(await saveTheme(draft))

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <PageHeader icon={<Palette className="h-4 w-4" />} title={t("settings.appearance.title")} />

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-4 p-3 pb-6">

                    <SettingsCard
                        icon={<Palette className="h-3.5 w-3.5" />}
                        title={t("settings.appearance.themes.title")}
                        description={t("settings.appearance.themes.description")}
                        className="border border-muted"
                    >
                        <div className="space-y-4 p-4">
                            <SectionDivider label={t("settings.appearance.themes.builtinSection")} />

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                <ThemeTile
                                    label={t("settings.appearance.themes.wallpaper")}
                                    gradient={themePreviewColors(wallpaperPalette()).gradient}
                                    selected={theme === 'wallpaper'}
                                    onSelect={() => selectTheme('wallpaper')}
                                />
                                {visibleThemes.map((option) => (
                                    <ThemeTile
                                        key={option.value}
                                        label={option.label}
                                        gradient={accent && isBuiltinThemeId(option.value)
                                            ? themePreviewColors(builtinPaletteWithAccent(option.value, accent)).gradient
                                            : option.preview.gradient}
                                        selected={theme === option.value}
                                        onSelect={() => selectTheme(option.value)}
                                    />
                                ))}
                            </div>
                            {expanded && (
                                <>
                                    <SectionDivider label={t("settings.appearance.themes.customSection")} />

                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {customThemes.map((custom) => {
                                            const preference = customThemePreference(custom.id)
                                            return (
                                                <CustomThemeTile
                                                    key={custom.id}
                                                    theme={custom}
                                                    selected={theme === preference}
                                                    onSelect={() => selectTheme(preference)}
                                                    onEdit={() => openEditor(custom)}
                                                    onDelete={() => void deleteTheme(custom)}
                                                />
                                            )
                                        })}
                                        <AddThemeTile onClick={() => openEditor(null)} />
                                    </div>
                                </>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full justify-center border-dashed"
                                aria-expanded={expanded}
                                onClick={() => setExpanded((p) => !p)}
                            >
                                {expanded
                                    ? <><ChevronUp className="me-2 h-4 w-4" />{t("settings.appearance.themes.collapse")}</>
                                    : <><ChevronDown className="me-2 h-4 w-4" />{t("settings.appearance.themes.showMore")}</>}
                            </Button>
                        </div>
                    </SettingsCard>

                    <AccentCard />

                    <BackdropCard />

                    <SettingsCard
                        icon={<Type className="h-3.5 w-3.5" />}
                        title={t("settings.appearance.font.title")}
                        description={t("settings.appearance.font.description")}
                        className="border border-muted"
                    >
                        <div className="grid grid-cols-3 gap-3 p-4">
                            {FONT_OPTIONS.map((opt) => (
                                <FontTile
                                    key={opt.value}
                                    label={opt.label}
                                    family={opt.family}
                                    selected={font === opt.value}
                                    onSelect={() => setFont(opt.value)}
                                />
                            ))}
                            {customFonts.map((custom) => (
                                <div key={custom.id} className="group relative">
                                    <FontTile
                                        label={custom.name}
                                        family={`'${customFontFamily(custom.id)}', sans-serif`}
                                        selected={font === customFontValue(custom.id)}
                                        onSelect={() => setFont(customFontValue(custom.id))}
                                    />
                                    <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="secondary"
                                        className="absolute top-1.5 end-1.5 h-6 w-6 text-destructive opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                                        aria-label={t("settings.appearance.font.delete", { name: custom.name })}
                                        onClick={() => void handleFontDelete(custom.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            <button
                                type="button"
                                disabled={fontBusy}
                                onClick={() => fontInputRef.current?.click()}
                                title={t("settings.appearance.font.customHint")}
                                className="flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/30 hover:text-foreground disabled:opacity-60"
                            >
                                {fontBusy
                                    ? <Loader2 className="h-5 w-5 animate-spin" />
                                    : <Plus className="h-5 w-5" />}
                                <span className="text-xs">{t("settings.appearance.font.custom")}</span>
                            </button>
                            <input
                                ref={fontInputRef}
                                type="file"
                                accept={FONT_ACCEPT}
                                className="hidden"
                                onChange={(e) => {
                                    void handleFontFile(e.target.files?.[0])
                                    e.target.value = ''
                                }}
                            />
                        </div>
                    </SettingsCard>

                    <SettingsCard
                        icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                        title={t("settings.appearance.radius.title")}
                        description={t("settings.appearance.radius.description")}
                        className="border border-muted"
                    >
                        <div className="grid grid-cols-4 gap-3 p-4">
                            {RADIUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setRadius(opt.value)}
                                    className={cn(
                                        "group flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors duration-200",
                                        radius === opt.value
                                            ? "border-primary ring-1 ring-primary bg-primary/5 text-primary"
                                            : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground",
                                    )}
                                >
                                    <CornerPreview r={opt.corner} />
                                    <span className="text-[11px] text-center leading-tight">
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </SettingsCard>

                    <SettingsCard
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                        title={t("settings.appearance.animation.title")}
                        description={t("settings.appearance.animation.description")}
                        className="border border-muted"
                    >
                        <div className="grid grid-cols-4 gap-3 p-4">
                            {ANIMATION_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAnimation(opt.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                                        animation === opt.value
                                            ? "border-primary ring-1 ring-primary bg-primary/5"
                                            : "border-border/60 hover:border-border hover:bg-muted/30",
                                    )}
                                >
                                    <span className="text-xl leading-none select-none">{opt.icon}</span>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xs font-medium">{opt.label}</span>
                                        <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </SettingsCard>

                </div>
            </ScrollArea>

            <ThemeEditorDialog
                open={editorOpen}
                onOpenChange={setEditorOpen}
                theme={editing}
                onSave={handleSave}
            />
        </div>
    )
}