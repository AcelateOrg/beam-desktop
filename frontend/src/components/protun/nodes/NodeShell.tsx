import type { LucideIcon } from "lucide-react"
import { Handle, Position } from "@xyflow/react"
import { Direction } from "radix-ui"
import { TriangleAlert } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ProTunConflict } from "@/lib/protun/conflicts"
import { cn } from "@/lib/utils"
import { t } from "@/i18n"

const HANDLE_CLASS = "!z-10 !h-3 !w-3 !border-2 !border-border !bg-muted-foreground !transition-colors hover:!bg-foreground"

export function NodeHandle({ type, position }: { type: "source" | "target"; position: Position }) {
    return <Handle type={type} position={position} className={HANDLE_CLASS} />
}

export function NodeCardShell({
    selected,
    accentBar,
    className,
    conflict,
    children,
}: {
    selected?: boolean
    accentBar: string
    className?: string
    /** source: the card's values collide; path: it carries a conflict. */
    conflict?: "source" | "path"
    children: React.ReactNode
}) {
    // React Flow держит холст в LTR: схема всегда течёт слева направо, ручки
    // входа/выхода физические. Содержимое карточки читается на языке интерфейса.
    const dir = Direction.useDirection()
    return (
        <div
            dir={dir}
            className={cn(
                "relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-[border-color,box-shadow] duration-150",
                className ?? "w-[220px]",
                selected ? "border-primary ring-2 ring-primary" : "border-border hover:border-muted-foreground",
                conflict === "source" && "protun-conflict",
                conflict === "path" && !selected && "border-destructive/60 hover:border-destructive"
            )}
        >
            <div className={cn("absolute inset-x-0 top-0 h-[3px]", conflict === "source" ? "bg-destructive" : accentBar)} />
            {children}
        </div>
    )
}

// Значок конфликта в углу карточки: по наведению видно, что именно не так и как починить.
export function NodeConflictBadge({ conflicts }: { conflicts: ProTunConflict[] }) {
    const identical = conflicts.every((c) => c.identical)
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className="nodrag nopan absolute -end-2.5 -top-2.5 z-20 flex h-6 w-6 cursor-help items-center justify-center"
                    style={{ pointerEvents: "all" }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <span className="protun-conflict-ping absolute inset-0 rounded-full bg-destructive" />
                    <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-lg ring-[3px] ring-background">
                        <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-72 flex-col items-start gap-1 py-2">
                <span className="flex items-center gap-1.5 font-semibold text-destructive">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {t("protun.conflictCard.title")}
                </span>
                {conflicts.map((c) => (
                    <span key={c.nodes.join(",") + c.targets.join(",")} className="leading-snug">
                        {c.message}
                    </span>
                ))}
                <span className="leading-snug text-muted-foreground">
                    {identical
                        ? t("protun.conflictCard.sameConditions")
                        : t("protun.conflictCard.overlap")}
                </span>
            </TooltipContent>
        </Tooltip>
    )
}

// Header shared by every card: icon chip, title, one-line description and
// optional actions on the right.
export function NodeCardHeader({
    icon: Icon,
    iconClassName,
    title,
    description,
    actions,
}: {
    icon: LucideIcon
    iconClassName?: string
    title: string
    description?: string
    actions?: React.ReactNode
}) {
    return (
        <div className="flex shrink-0 items-center gap-2.5 px-3 pb-2.5 pt-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium leading-tight">{title}</div>
                {description && (
                    <div className="truncate text-[11px] leading-tight text-muted-foreground">{description}</div>
                )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
    )
}

// Divider between the header and the content of a card.
export function NodeCardDivider() {
    return <Separator className="bg-border/60" />
}

// Plain secondary line under the divider of cards without a list.
export function NodeCardNote({ dotClassName, children }: { dotClassName: string; children: React.ReactNode }) {
    return (
        <p className="flex items-center gap-2 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClassName)} />
            {children}
        </p>
    )
}

// Small icon button living in a card header.
export function NodeCardAction({
    active,
    title,
    onClick,
    children,
}: {
    active?: boolean
    title: string
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            className={cn(
                "nodrag nopan flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground"
            )}
            style={{ pointerEvents: "all" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
        >
            {children}
        </button>
    )
}
