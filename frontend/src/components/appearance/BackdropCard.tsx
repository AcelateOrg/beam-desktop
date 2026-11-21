import { useRef, useState, type ReactNode } from "react"
import { ImageIcon, Loader2, Monitor, Trash2, Upload, Wand2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SettingsCard } from "@/components/ui/settings-card"
import { Slider } from "@/components/ui/slider"
import { useBackdrop } from "@/hooks/useBackdrop"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import {
    previewBackdrop,
    removeBackdropPhoto,
    updateBackdrop,
    uploadBackdropPhoto,
    type BackdropMode,
    type BackdropStyle,
} from "@/themes/backdrop"
import { t } from "@/i18n"

const DEFAULTS = { blur: 12, dim: 55, density: 0 }

function formatSigned(value: number): string {
    return value > 0 ? `+${value}` : String(value)
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp"

function Tile({
    label, selected, disabled, onClick, children,
}: {
    label: string; selected: boolean; disabled?: boolean; onClick: () => void; children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
                "flex min-w-0 flex-col gap-2 rounded-xl border p-2 text-start transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
                selected
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "border-border/60 hover:border-border hover:bg-muted/30",
            )}
        >
            <div className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                {children}
            </div>
            <div className="truncate px-0.5 text-sm font-medium">{label}</div>
        </button>
    )
}

const STYLE_OPTIONS: { value: BackdropStyle; label: string; sidebar: string; content: string }[] = [
    { value: "content", get label() { return t("settings.appearance.backdrop.style.content") }, sidebar: "bg-background/20", content: "bg-background/80 ring-1 ring-foreground/10" },
    { value: "sidebar", get label() { return t("settings.appearance.backdrop.style.sidebar") }, sidebar: "bg-black/70", content: "bg-white/15" },
]

/** Миниатюра окна поверх картинки фона: показывает, что плотнее. */
function StylePreview({ url, sidebar, content }: { url: string | null; sidebar: string; content: string }) {
    return (
        <>
            {url && <Preview url={url} />}
            <div className="absolute inset-0 flex">
                <div className={cn("w-1/3", sidebar)} />
                <div className={cn("m-1.5 ms-0 flex-1 rounded-md", content)} />
            </div>
        </>
    )
}

function Preview({ url }: { url: string }) {
    return <img src={url} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
}

function SliderRow({
    label, value, display, min = 0, max, onChange, onCommit,
}: {
    label: string; value: number; display: string; min?: number; max: number
    onChange: (value: number) => void; onCommit: (value: number) => void
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="tabular-nums text-muted-foreground">{display}</span>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={1}
                aria-label={label}
                onValueChange={(v) => onChange(v[0] ?? 0)}
                onValueCommit={(v) => onCommit(v[0] ?? 0)}
            />
        </div>
    )
}

export function BackdropCard() {
    const { config, photoUrl, wallpaperUrl, wallpaperAvailable } = useBackdrop()
    const { theme, setTheme } = useTheme()
    const fileRef = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)

    const report = (title: string, error: string | null) => {
        if (error) toast.error(title, { description: error })
    }

    const selectMode = async (mode: BackdropMode) => {
        if (mode === config.mode) return
        report(t("settings.appearance.backdrop.error.change"), await updateBackdrop({ mode }))
    }

    const pickPhoto = () => fileRef.current?.click()

    const onFile = async (file: File | undefined) => {
        if (!file) return
        setBusy(true)
        try {
            report(t("settings.appearance.backdrop.error.upload"), await uploadBackdropPhoto(file))
        } finally {
            setBusy(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }

    const removePhoto = async () => {
        setBusy(true)
        try {
            report(t("settings.appearance.backdrop.error.remove"), await removeBackdropPhoto())
        } finally {
            setBusy(false)
        }
    }

    const commit = async (patch: { blur?: number; dim?: number; density?: number; style?: BackdropStyle }) => {
        report(t("settings.appearance.backdrop.error.save"), await updateBackdrop(patch))
    }

    const enabled = config.mode !== "off"
    const previewUrl = config.mode === "photo" ? photoUrl : wallpaperUrl

    return (
        <SettingsCard
            icon={<ImageIcon className="h-3.5 w-3.5" />}
            title={t("settings.appearance.backdrop.title")}
            description={t("settings.appearance.backdrop.description")}
            className="border border-muted"
        >
            <div className="space-y-4 p-4">
                <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => void onFile(e.target.files?.[0])}
                />

                <div className="grid grid-cols-3 gap-3">
                    <Tile label={t("settings.appearance.backdrop.off")} selected={config.mode === "off"} onClick={() => void selectMode("off")}>
                        <span className="text-lg leading-none">—</span>
                    </Tile>
                    <Tile
                        label={wallpaperAvailable === false ? t("settings.appearance.backdrop.wallpaperMissing") : t("settings.appearance.backdrop.wallpaper")}
                        selected={config.mode === "wallpaper"}
                        disabled={wallpaperAvailable === false}
                        onClick={() => void selectMode("wallpaper")}
                    >
                        {wallpaperUrl ? <Preview url={wallpaperUrl} /> : <Monitor className="h-5 w-5" />}
                    </Tile>
                    <Tile
                        label={t("settings.appearance.backdrop.photo")}
                        selected={config.mode === "photo"}
                        disabled={busy}
                        onClick={() => (photoUrl ? void selectMode("photo") : pickPhoto())}
                    >
                        {busy
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : photoUrl ? <Preview url={photoUrl} /> : <Upload className="h-5 w-5" />}
                    </Tile>
                </div>

                {config.mode === "photo" && (
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="flex-1" disabled={busy} onClick={pickPhoto}>
                            <Upload className="me-2 h-4 w-4" />{t("settings.appearance.backdrop.replace")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={busy}
                            onClick={() => void removePhoto()}
                        >
                            <Trash2 className="me-2 h-4 w-4" />{t("settings.appearance.backdrop.remove")}
                        </Button>
                    </div>
                )}

                {enabled && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            {STYLE_OPTIONS.map((option) => (
                                <Tile
                                    key={option.value}
                                    label={option.label}
                                    selected={config.style === option.value}
                                    onClick={() => {
                                        if (option.value !== config.style) void commit({ style: option.value })
                                    }}
                                >
                                    <StylePreview url={previewUrl} sidebar={option.sidebar} content={option.content} />
                                </Tile>
                            ))}
                        </div>

                        <SliderRow
                            label={t("settings.appearance.backdrop.blur")}
                            value={config.blur}
                            display={`${config.blur} px`}
                            max={40}
                            onChange={(blur) => previewBackdrop({ blur })}
                            onCommit={(blur) => void commit({ blur })}
                        />
                        <SliderRow
                            label={t("settings.appearance.backdrop.brightness")}
                            value={-config.dim}
                            display={formatSigned(-config.dim)}
                            min={-90}
                            max={100}
                            onChange={(v) => previewBackdrop({ dim: -v })}
                            onCommit={(v) => void commit({ dim: -v })}
                        />
                        <SliderRow
                            label={t("settings.appearance.backdrop.density")}
                            value={config.density}
                            display={formatSigned(config.density)}
                            min={-50}
                            max={50}
                            onChange={(density) => previewBackdrop({ density })}
                            onCommit={(density) => void commit({ density })}
                        />
                        {(config.blur !== DEFAULTS.blur || config.dim !== DEFAULTS.dim || config.density !== DEFAULTS.density) && (
                            <button
                                type="button"
                                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                onClick={() => void commit({ ...DEFAULTS })}
                            >
                                {t("settings.appearance.backdrop.resetSliders")}
                            </button>
                        )}

                        {theme !== "wallpaper" && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full justify-center border-dashed"
                                onClick={() => void setTheme("wallpaper")}
                            >
                                <Wand2 className="me-2 h-4 w-4" />{t("settings.appearance.backdrop.matchColors")}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </SettingsCard>
    )
}
