import { useMemo, useRef, useState } from "react"
import { BrowserOpenURL } from "@wailsjs/runtime"
import {
    ArrowUpRight,
    Cpu,
    Database,
    Heart,
    LayoutGrid,
    Monitor,
    Scale,
    Search,
    Type,
    X,
    type LucideIcon,
} from "lucide-react"

import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BeamLicenseCard } from "@/components/app/BeamLicenseCard"
import { cn } from "@/lib/utils"
import {
    LICENSE_URLS,
    THIRD_PARTY,
    type LicenseId,
    type ThirdPartyItem,
} from "@/lib/licenses"
import { t } from "@/i18n"

const SECTION_ICONS: Record<string, LucideIcon> = {
    core: Cpu,
    desktop: Monitor,
    ui: LayoutGrid,
    fonts: Type,
    data: Database,
}

const LICENSE_TONE: Record<string, string> = {
    MIT: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    Apache: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    BSD: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    MPL: "bg-orange-500/12 text-orange-600 dark:text-orange-400",
    ISC: "bg-teal-500/12 text-teal-600 dark:text-teal-400",
    OFL: "bg-pink-500/12 text-pink-600 dark:text-pink-400",
    GPL: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    LGPL: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
}

// Полные имена классов — чтобы Tailwind их сгенерировал.
const LICENSE_DOT: Record<string, string> = {
    MIT: "bg-emerald-500",
    Apache: "bg-sky-500",
    BSD: "bg-violet-500",
    MPL: "bg-orange-500",
    ISC: "bg-teal-500",
    OFL: "bg-pink-500",
    GPL: "bg-rose-500",
    LGPL: "bg-amber-500",
}

function toneFor(license: LicenseId): string {
    const key = license.startsWith("LGPL") ? "LGPL" : license.split(/[-\s/]/)[0]
    return LICENSE_TONE[key] ?? "bg-muted text-muted-foreground"
}

const open = (url: string) => void BrowserOpenURL(url)

function LicenseBadge({ license }: { license: LicenseId }) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation()
                open(LICENSE_URLS[license])
            }}
            title={t("settings.about.licensesPage.licenseText")}
            className={cn(
                "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold transition-opacity hover:opacity-75",
                toneFor(license),
            )}
        >
            {license}
        </button>
    )
}

function ItemRow({ item }: { item: ThirdPartyItem }) {
    return (
        <div
            role="link"
            tabIndex={0}
            onClick={() => open(item.url)}
            onKeyDown={(e) => e.key === "Enter" && open(item.url)}
            className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2.5 outline-none transition-colors hover:border-border hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{item.name}</span>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                    {item.holder}
                    {item.note && <span className="text-muted-foreground/60"> · {item.note}</span>}
                </p>
            </div>
            <LicenseBadge license={item.license} />
        </div>
    )
}

export default function Licenses() {
    const [query, setQuery] = useState("")
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    const sections = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return THIRD_PARTY
        return THIRD_PARTY.map((s) => ({
            ...s,
            items: s.items.filter((i) =>
                [i.name, i.holder, i.license, i.note ?? ""].some((v) => v.toLowerCase().includes(q)),
            ),
        })).filter((s) => s.items.length > 0)
    }, [query])

    const total = THIRD_PARTY.reduce((n, s) => n + s.items.length, 0)

    const stats = useMemo(() => {
        const map = new Map<string, number>()
        for (const s of THIRD_PARTY) for (const i of s.items) {
            const key = i.license.startsWith("LGPL") ? "LGPL" : i.license.split(/[-\s/]/)[0]
            map.set(key, (map.get(key) ?? 0) + 1)
        }
        return [...map.entries()].sort((a, b) => b[1] - a[1])
    }, [])

    const jump = (id: string) => {
        setQuery("")
        requestAnimationFrame(() =>
            sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" }),
        )
    }

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <PageHeader
                icon={<Scale className="h-4 w-4" />}
                title={t("settings.about.licensesPage.title")}
                backTo="/settings/about"
                actions={
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                        {total}
                    </span>
                }
                toolbar={
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t("settings.about.licensesPage.search")}
                                className="h-9 w-full rounded-lg border border-border/60 bg-background/60 ps-9 pe-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                    title={t("settings.about.licensesPage.clear")}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                            {THIRD_PARTY.map((s) => {
                                const Icon = SECTION_ICONS[s.id] ?? LayoutGrid
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => jump(s.id)}
                                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                        <Icon className="h-3 w-3" />
                                        {s.title}
                                        <span className="tabular-nums text-muted-foreground/60">{s.items.length}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                }
            />

            <ScrollArea className="min-h-0 flex-1">
                <div className="px-4 pb-10 pt-4">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    {/* Своя лицензия Beam: что можно и что нельзя */}
                    {!query && <BeamLicenseCard />}

                    {/* Благодарность + распределение лицензий */}
                    {!query && (
                        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/40 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Heart className="h-4 w-4 fill-red-400 text-red-400" />
                                {t("settings.about.licensesPage.thanks")}
                            </div>
                            <div className="flex h-2 w-full overflow-hidden rounded-full">
                                {stats.map(([key, n]) => (
                                    <div
                                        key={key}
                                        className={cn("h-full", LICENSE_DOT[key] ?? "bg-muted-foreground")}
                                        style={{ width: `${(n / total) * 100}%` }}
                                        title={`${key}: ${n}`}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {stats.map(([key, n]) => (
                                    <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className={cn("h-2 w-2 rounded-full", LICENSE_DOT[key] ?? "bg-muted-foreground")} />
                                        {key}
                                        <span className="tabular-nums text-muted-foreground/60">{n}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {sections.map((s) => {
                        const Icon = SECTION_ICONS[s.id] ?? LayoutGrid
                        return (
                            <section
                                key={s.id}
                                ref={(el) => { sectionRefs.current[s.id] = el }}
                                className="flex scroll-mt-2 flex-col gap-2.5"
                            >
                                {/* Разделитель */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-sm font-semibold">{s.title}</h2>
                                        <span className="text-xs text-muted-foreground">{s.hint}</span>
                                    </div>
                                    <div className="h-px flex-1 bg-border/60" />
                                    <span className="text-xs tabular-nums text-muted-foreground">{s.items.length}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {s.items.map((item) => (
                                        <ItemRow key={`${s.id}-${item.name}`} item={item} />
                                    ))}
                                </div>
                            </section>
                        )
                    })}

                    {sections.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                            <Search className="h-6 w-6 opacity-50" />
                            <p className="text-sm">{t("settings.about.licensesPage.nothingFound")}</p>
                        </div>
                    )}

                    <p className="text-center text-[11px] text-muted-foreground/60">
                        {t("settings.about.licensesPage.footer")}
                    </p>
                </div>
                </div>
            </ScrollArea>
        </div>
    )
}
