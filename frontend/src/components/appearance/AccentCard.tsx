import { useEffect, useState, type ReactNode } from "react"
import { Check, Droplet, Pipette, RotateCcw } from "lucide-react"

import { ColorPicker, SWATCHES } from "@/components/appearance/ThemeEditorDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SettingsCard } from "@/components/ui/settings-card"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import { setAccentOverride } from "@/themes/controller"
import {
    hexToHsv,
    hsvToHex,
    isBuiltinThemeId,
    normalizeHex,
    themeAccentHex,
    type Hsv,
} from "@/themes/palette"
import { t } from "@/i18n"

// The theme editor offers all of SWATCHES; here lime is left out so the whole row
// (reset, picker, swatches) fits on one line.
const ACCENT_SWATCHES = SWATCHES.filter((color) => color !== "#84cc16")

const CONIC = "conic-gradient(from 0deg, #f43f5e, #f59e0b, #84cc16, #10b981, #06b6d4, #3b82f6, #a855f7, #f43f5e)"

function Swatch({
    color, selected, label, onClick, disabled, children,
}: {
    color: string
    selected: boolean
    label: string
    onClick?: () => void
    disabled?: boolean
    children?: ReactNode
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={selected}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                "ring-offset-2 ring-offset-sidebar hover:scale-110 disabled:pointer-events-none",
                selected ? "ring-2 ring-foreground/80" : "ring-1 ring-white/10",
            )}
            style={{ background: color }}
        >
            {children ?? (selected && <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />)}
        </button>
    )
}

export function AccentCard() {
    const { accent, accentApplies, setAccent, effectiveTheme, theme } = useTheme()
    const [pickerOpen, setPickerOpen] = useState(false)
    const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(accent ?? "#3b82f6"))
    const [hexInput, setHexInput] = useState(accent ?? "#3b82f6")

    const themeId = isBuiltinThemeId(effectiveTheme) ? effectiveTheme : "dark"
    const themeColor = themeAccentHex(themeId)
    const isPreset = accent !== null && ACCENT_SWATCHES.includes(accent)
    const isCustom = accent !== null && !isPreset
    const disabled = !accentApplies

    useEffect(() => {
        if (!pickerOpen) {
            const start = accent ?? themeColor
            setHsv(hexToHsv(start))
            setHexInput(start)
        }
    }, [pickerOpen, accent, themeColor])

    // Пока пипетка открыта — цвет меняется вживую, сохраняется при закрытии.
    const preview = (next: Hsv) => {
        setHsv(next)
        const hex = hsvToHex(next)
        setHexInput(hex)
        setAccentOverride(hex)
    }

    const onHex = (value: string) => {
        setHexInput(value)
        const hex = normalizeHex(value)
        if (!hex) return
        setHsv(hexToHsv(hex))
        setAccentOverride(hex)
    }

    const onPickerOpenChange = (open: boolean) => {
        setPickerOpen(open)
        if (!open) {
            void setAccent(hsvToHex(hsv))
        }
    }

    const hint = disabled
        ? theme === "wallpaper"
            ? t("settings.appearance.accent.wallpaperHint")
            : t("settings.appearance.accent.customThemeHint")
        : null

    return (
        <SettingsCard
            icon={<Droplet className="h-3.5 w-3.5" />}
            title={t("settings.appearance.accent.title")}
            description={t("settings.appearance.accent.description")}
            className="border border-muted"
        >
            <div className={cn("space-y-3 p-4", disabled && "opacity-50")}>
                <div className="flex flex-wrap items-center gap-2">
                    <Swatch
                        color={themeColor}
                        selected={accent === null}
                        label={t("settings.appearance.accent.fromTheme")}
                        disabled={disabled}
                        onClick={() => void setAccent(null)}
                    >
                        {accent === null
                            ? <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                            : <RotateCcw className="h-3.5 w-3.5 text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />}
                    </Swatch>

                    <Popover open={pickerOpen} onOpenChange={onPickerOpenChange}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                title={t("settings.appearance.accent.custom")}
                                aria-label={t("settings.appearance.accent.custom")}
                                disabled={disabled}
                                className={cn(
                                    "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                                    "ring-offset-2 ring-offset-sidebar hover:scale-110 disabled:pointer-events-none",
                                    isCustom ? "ring-2 ring-foreground/80" : "ring-1 ring-white/10",
                                )}
                                style={{ background: isCustom ? accent! : CONIC }}
                            >
                                {isCustom
                                    ? <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                                    : <Pipette className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 gap-3 rounded-2xl">
                            <ColorPicker hsv={hsv} onChange={preview} />
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-white/10"
                                    style={{ background: hsvToHex(hsv) }}
                                />
                                <Input
                                    value={hexInput}
                                    onChange={(e) => onHex(e.target.value)}
                                    spellCheck={false}
                                    maxLength={7}
                                    className="h-8 font-mono text-xs uppercase"
                                    aria-label="HEX"
                                />
                                <Button size="sm" className="h-8" onClick={() => onPickerOpenChange(false)}>
                                    {t("settings.appearance.accent.done")}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <span className="mx-0.5 h-6 w-px bg-border" />

                    {ACCENT_SWATCHES.map((color) => (
                        <Swatch
                            key={color}
                            color={color}
                            selected={accent === color}
                            label={color}
                            disabled={disabled}
                            onClick={() => void setAccent(color)}
                        />
                    ))}

                </div>

                {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
            </div>
        </SettingsCard>
    )
}
