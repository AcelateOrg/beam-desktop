import { Check, ChevronDown, Globe, Lock, UserRound } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { GLOBAL_SCOPE, globalScopeLabel, type ProTunScope, type ProTunScopeInfo } from "@/pages/protun/useProTunGraph"
import { t } from "@/i18n"

// Слои ProTun: «Общие» для всех профилей + свои правила у каждого профиля
// (работают, только когда профиль активен, и стоят выше общих).
export function ProTunScopeSwitcher({
    scope,
    scopes,
    label,
    locked,
    globalHasRules,
    onSwitch,
}: {
    scope: ProTunScope
    scopes: ProTunScopeInfo[]
    label: string
    locked: boolean
    globalHasRules: boolean
    onSwitch: (scope: ProTunScope) => void
}) {
    const isGlobal = scope === GLOBAL_SCOPE
    const TriggerIcon = isGlobal ? Globe : UserRound

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "group flex max-w-[260px] items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                        locked
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15"
                            : "border-border text-foreground hover:bg-muted"
                    )}
                >
                    {locked ? <Lock className="h-3.5 w-3.5 shrink-0" /> : <TriggerIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{label}</span>
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <ScopeItem
                    icon={<Globe className="h-3.5 w-3.5" />}
                    title={globalScopeLabel()}
                    hint={t("protun.scope.globalHint")}
                    selected={isGlobal}
                    hasRules={globalHasRules}
                    onSelect={() => onSwitch(GLOBAL_SCOPE)}
                />
                {scopes.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t("protun.scope.profilesHeader")}
                        </DropdownMenuLabel>
                        {scopes.map((p) => (
                            <ScopeItem
                                key={p.id}
                                icon={<UserRound className="h-3.5 w-3.5" />}
                                title={p.name}
                                hint={
                                    p.locked
                                        ? t("protun.scope.providerRules")
                                        : p.hasRules
                                          ? t("protun.scope.ownRules")
                                          : p.hasPreset
                                            ? t("protun.scope.providerRules")
                                            : undefined
                                }
                                active={p.active}
                                locked={p.locked}
                                selected={scope === p.id}
                                hasRules={p.hasRules || p.hasPreset}
                                onSelect={() => onSwitch(p.id)}
                            />
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ScopeItem({
    icon,
    title,
    hint,
    active,
    locked,
    selected,
    hasRules,
    onSelect,
}: {
    icon: React.ReactNode
    title: string
    hint?: string
    active?: boolean
    locked?: boolean
    selected: boolean
    hasRules: boolean
    onSelect: () => void
}) {
    return (
        <DropdownMenuItem onSelect={onSelect} className={cn("gap-2.5 py-1.5", selected && "bg-muted/60")}>
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {icon}
                {hasRules && (
                    <span className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full border border-popover bg-primary" />
                )}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium">{title}</span>
                    {active && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-px text-[9px] font-medium text-emerald-500">
                            {t("protun.scope.active")}
                        </span>
                    )}
                    {locked && <Lock className="h-3 w-3 shrink-0 text-amber-500" />}
                </span>
                {hint && <span className="block truncate text-[10px] text-muted-foreground">{hint}</span>}
            </span>
            {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </DropdownMenuItem>
    )
}
