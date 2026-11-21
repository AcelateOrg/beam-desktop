import { useCallback, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "@/components/ui/country-flag"
import { AtSign, Check, ChevronDown, Flag, Layers, ListChecks, Loader2, RefreshCw, Search, X } from "lucide-react"
import { GetGeoCodes, GetGeoSiteAttributes } from "@wailsjs/go/handlers/SettingsHandler"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { geoOptions, isCountryCode, type GeoKind } from "@/lib/protun/geo"
import { t } from "@/i18n"

// Rendering every geosite category (well over a thousand) on each keystroke
// is wasted work: nobody scrolls that far, they type.
const MAX_ROWS = 200

// Codes only change when the database is refreshed, so one fetch per app run
// is enough and reopening the picker is instant.
const codeCache = new Map<GeoKind, string[]>()

// @-атрибуты категорий geosite (google@ads, category-games@cn): грузятся по запросу,
// потому что для этого нужно разобрать домены категории.
const attrCache = new Map<string, string[]>()

type AttrState = string[] | "loading" | "error"

export function GeoFlag({ code, className }: { code: string; className?: string }) {
    return (
        <span className={cn("relative flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted", className)}>
            {isCountryCode(code) ? (
                <ReactCountryFlag
                    countryCode={code.toUpperCase()}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    className="absolute inset-0"
                />
            ) : (
                <ListChecks className="h-2.5 w-2.5 text-muted-foreground" />
            )}
        </span>
    )
}

export function GeoPickerDialog({
    open,
    kind,
    selected,
    onOpenChange,
    onToggle,
}: {
    open: boolean
    kind: GeoKind
    selected: string[]
    onOpenChange: (open: boolean) => void
    onToggle: (code: string) => void
}) {
    const [codes, setCodes] = useState<string[] | null>(() => codeCache.get(kind) ?? null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [query, setQuery] = useState("")
    const [expanded, setExpanded] = useState<string | null>(null)
    const [attrs, setAttrs] = useState<Record<string, AttrState>>({})

    const toggleExpand = async (code: string) => {
        if (expanded === code) {
            setExpanded(null)
            return
        }
        setExpanded(code)
        const cached = attrCache.get(code)
        if (cached) {
            setAttrs((prev) => ({ ...prev, [code]: cached }))
            return
        }
        setAttrs((prev) => ({ ...prev, [code]: "loading" }))
        try {
            const res = await GetGeoSiteAttributes(code)
            if (!res.success) throw new Error(res.error)
            const list = res.data ?? []
            attrCache.set(code, list)
            setAttrs((prev) => ({ ...prev, [code]: list }))
        } catch {
            setAttrs((prev) => ({ ...prev, [code]: "error" }))
        }
    }

    const load = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const res = await GetGeoCodes(kind)
            if (!res.success) throw new Error(res.error || t("protun.geo.loadFailed"))
            const list = res.data ?? []
            codeCache.set(kind, list)
            setCodes(list)
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
        } finally {
            setLoading(false)
        }
    }, [kind])

    useEffect(() => {
        if (!open) return
        setQuery("")
        setExpanded(null)
        if (!codeCache.has(kind)) void load()
    }, [open, kind, load])

    const options = useMemo(() => geoOptions(kind, codes ?? []), [kind, codes])
    const selectedSet = useMemo(() => new Set(selected.map((s) => s.toLowerCase())), [selected])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        const list = q
            ? options.filter((o) => o.code.includes(q) || o.label.toLowerCase().includes(q))
            : options
        return list
    }, [options, query])
    const shown = filtered.slice(0, MAX_ROWS)

    const isCountries = kind === "geoip"
    const Icon = isCountries ? Flag : Layers

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
                <DialogHeader className="border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <DialogTitle className="flex-1 text-sm font-medium">
                            {isCountries ? t("protun.geo.titleCountries") : t("protun.geo.titleCategories")}
                        </DialogTitle>
                        {selected.length > 0 && (
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                                {t("protun.geo.selected", { count: selected.length })}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-muted-foreground"
                            onClick={() => onOpenChange(false)}
                            type="button"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="border-b px-4 py-2.5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={isCountries ? t("protun.geo.searchCountries") : t("protun.geo.searchCategories")}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-8 ps-8 text-xs"
                            autoFocus
                            disabled={!codes}
                        />
                    </div>
                </div>

                <ScrollArea className="h-80">
                    {loading && !codes ? (
                        <div className="flex h-80 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("protun.geo.downloading")}
                            <span className="text-[11px]">{t("protun.geo.downloadingHint")}</span>
                        </div>
                    ) : error && !codes ? (
                        <div className="flex h-80 flex-col items-center justify-center gap-3 px-6 text-center">
                            <p className="text-xs text-muted-foreground">
                                {t("protun.geo.downloadFailed")}
                            </p>
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void load()}>
                                <RefreshCw className="h-3.5 w-3.5" />
                                {t("protun.geo.retry")}
                            </Button>
                        </div>
                    ) : shown.length === 0 ? (
                        <div className="flex h-80 items-center justify-center text-xs text-muted-foreground">
                            {t("common.nothingFound")}
                        </div>
                    ) : (
                        <div className="p-1.5">
                            {shown.map((option, index) => {
                                const checked = selectedSet.has(option.code)
                                const firstRest = !query && index > 0 && !option.popular && shown[index - 1].popular
                                const isOpen = !isCountries && expanded === option.code
                                const attrState = attrs[option.code]
                                const pickedAttrs = isCountries
                                    ? 0
                                    : selected.filter((s) => s.toLowerCase().startsWith(`${option.code}@`)).length
                                return (
                                    <div key={option.code}>
                                        {!query && index === 0 && option.popular && <GroupLabel>{t("protun.geo.popular")}</GroupLabel>}
                                        {firstRest && <GroupLabel>{t("protun.geo.all")}</GroupLabel>}
                                        <div className="flex items-center gap-0.5">
                                        <button
                                            type="button"
                                            role="checkbox"
                                            aria-checked={checked}
                                            className={cn(
                                                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start transition-colors hover:bg-muted/60",
                                                checked && "bg-muted"
                                            )}
                                            onClick={() => onToggle(option.code)}
                                        >
                                            {isCountries ? (
                                                <GeoFlag code={option.code} />
                                            ) : (
                                                <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            )}
                                            <span className="min-w-0 flex-1 truncate text-sm">{option.label}</span>
                                            {option.label !== option.code && (
                                                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                                    {option.code}
                                                </span>
                                            )}
                                            <span
                                                className={cn(
                                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.35)] border transition-colors",
                                                    checked
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-muted-foreground/40"
                                                )}
                                            >
                                                {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                                            </span>
                                        </button>
                                        {!isCountries && (
                                            <button
                                                type="button"
                                                title={t("protun.geo.attributes")}
                                                aria-expanded={isOpen}
                                                className={cn(
                                                    "flex h-8 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                                                    (isOpen || pickedAttrs > 0) && "text-foreground"
                                                )}
                                                onClick={() => void toggleExpand(option.code)}
                                            >
                                                <AtSign className="h-3 w-3" />
                                                {pickedAttrs > 0 && <span className="text-[10px] tabular-nums">{pickedAttrs}</span>}
                                                <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
                                            </button>
                                        )}
                                        </div>
                                        {isOpen && (
                                            <div className="mb-1 ms-6 border-s ps-2">
                                                {attrState === "loading" || attrState === undefined ? (
                                                    <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        {t("protun.geo.attributesLoading")}
                                                    </div>
                                                ) : attrState === "error" ? (
                                                    <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">{t("protun.geo.attributesFailed")}</p>
                                                ) : attrState.length === 0 ? (
                                                    <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">{t("protun.geo.attributesNone")}</p>
                                                ) : (
                                                    attrState.map((attr) => {
                                                        const value = `${option.code}@${attr}`
                                                        const attrChecked = selectedSet.has(value)
                                                        return (
                                                            <button
                                                                key={attr}
                                                                type="button"
                                                                role="checkbox"
                                                                aria-checked={attrChecked}
                                                                className={cn(
                                                                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-start transition-colors hover:bg-muted/60",
                                                                    attrChecked && "bg-muted"
                                                                )}
                                                                onClick={() => onToggle(value)}
                                                            >
                                                                <span className="min-w-0 flex-1 truncate font-mono text-xs">@{attr}</span>
                                                                <span
                                                                    className={cn(
                                                                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.35)] border transition-colors",
                                                                        attrChecked
                                                                            ? "border-primary bg-primary text-primary-foreground"
                                                                            : "border-muted-foreground/40"
                                                                    )}
                                                                >
                                                                    {attrChecked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                                                                </span>
                                                            </button>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            {filtered.length > shown.length && (
                                <p className="px-2.5 py-2 text-center text-[11px] text-muted-foreground">
                                    {t("protun.geo.more", { count: filtered.length - shown.length })}
                                </p>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="border-t px-4 py-2.5">
                    <Button size="sm" onClick={() => onOpenChange(false)}>
                        {t("protun.geo.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
    return <p className="px-2.5 pb-1 pt-2 text-[11px] text-muted-foreground">{children}</p>
}
