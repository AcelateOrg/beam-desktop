import { useState } from "react"
import { Check, ChevronDown, Info, ShieldCheck, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { t } from "@/i18n"

// Кратко и по-человечески пересказанная Beam Source License 1.0 (LICENSE / LICENSE.ru.md
// в beam-desktop и beam-bridge). Юридически действует английский текст — при правке
// лицензии обнови и эти пункты.

type Component = { name: string; role: string; license: string; open: boolean }

const COMPONENTS: Component[] = [
    { name: "beam-desktop", get role() { return t("settings.about.beamLicense.component.desktop") }, license: "Beam Source 1.0", open: false },
    { name: "beam-bridge", get role() { return t("settings.about.beamLicense.component.bridge") }, license: "Beam Source 1.0", open: false },
    { name: "beam-core", get role() { return t("settings.about.beamLicense.component.core") }, license: "MPL-2.0", open: true },
    { name: "beam-tun", get role() { return t("settings.about.beamLicense.component.tun") }, license: "MPL-2.0", open: true },
]

type Rule = { title: string; hint: string }

const ALLOWED_KEYS = ["use", "read", "build", "contribute", "fork", "quote", "recommend"] as const
const FORBIDDEN_KEYS = ["distribute", "stores", "rebrand", "compete", "saas", "copyright", "bypass"] as const
const FINE_PRINT_KEYS = ["trademarks", "termination", "warranty", "permission", "legal"] as const

const allowedRules = (): Rule[] =>
    ALLOWED_KEYS.map((k) => ({ title: t(`settings.about.beamLicense.allowed.${k}.title`), hint: t(`settings.about.beamLicense.allowed.${k}.hint`) }))

const forbiddenRules = (): Rule[] =>
    FORBIDDEN_KEYS.map((k) => ({ title: t(`settings.about.beamLicense.forbidden.${k}.title`), hint: t(`settings.about.beamLicense.forbidden.${k}.hint`) }))

function RuleList({ rules, allowed }: { rules: Rule[]; allowed: boolean }) {
    const Icon = allowed ? Check : X
    return (
        <div
            className={cn(
                "flex flex-col gap-1 rounded-lg border p-2",
                allowed ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-rose-500/20 bg-rose-500/[0.04]",
            )}
        >
            <div
                className={cn(
                    "px-1.5 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    allowed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                )}
            >
                {allowed ? t("settings.about.beamLicense.allowedTitle") : t("settings.about.beamLicense.forbiddenTitle")}
            </div>
            {rules.map((r) => (
                <div key={r.title} className="flex items-start gap-2.5 rounded-md px-1.5 py-1.5">
                    <span
                        className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            allowed
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                        )}
                    >
                        <Icon className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{r.title}</p>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{r.hint}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function BeamLicenseCard() {
    const [moreOpen, setMoreOpen] = useState(false)

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{t("settings.about.beamLicense.title")}</h2>
                    <p className="text-xs text-muted-foreground">
                        {t("settings.about.beamLicense.description")}
                    </p>
                </div>
            </div>

            {/* Что под какой лицензией */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {COMPONENTS.map((c) => (
                    <div key={c.name} className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                        <span className="truncate font-mono text-xs font-semibold">{c.name}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{c.role}</span>
                        <span
                            className={cn(
                                "mt-0.5 w-fit rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                                c.open
                                    ? "bg-orange-500/12 text-orange-600 dark:text-orange-400"
                                    : "bg-primary/12 text-primary",
                            )}
                        >
                            {c.license}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                    {t("settings.about.beamLicense.appAndBridge")}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <RuleList rules={allowedRules()} allowed />
                    <RuleList rules={forbiddenRules()} allowed={false} />
                </div>
            </div>

            {/* MPL-части живут по своим, более свободным правилам. */}
            <div className="flex items-start gap-2.5 rounded-lg border border-orange-500/20 bg-orange-500/[0.05] px-3 py-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
                    <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{t("settings.about.beamLicense.mpl.title")}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {t("settings.about.beamLicense.mpl.description")}
                    </p>
                </div>
            </div>

            <div>
                <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    <Info className="h-3.5 w-3.5" />
                    {t("settings.about.beamLicense.fineTitle")}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", moreOpen && "rotate-180")} />
                </button>
                {moreOpen && (
                    <ul className="mt-2 flex flex-col gap-1.5 ps-5">
                        {FINE_PRINT_KEYS.map((key) => (
                            <li key={key} className="list-disc text-xs leading-snug text-muted-foreground marker:text-muted-foreground/50">
                                {t(`settings.about.beamLicense.fine.${key}`)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
