import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useNodeRule, useRuleRows } from "@/lib/protun/priority"
import { cn } from "@/lib/utils"
import { t } from "@/i18n"

/**
 * «№2» in the header of a card: its place in the check order. The higher a
 * card sits on the canvas, the earlier its rule is checked, so moving a card
 * up or down is all it takes to change who wins.
 */
export function PriorityChip({ nodeId }: { nodeId: string }) {
    const row = useNodeRule(nodeId)
    const rows = useRuleRows()
    if (!row || rows.length < 2) return null

    const rank = (id: string) => rows.find((r) => r.nodeId === id)?.rank
    const overrides = row.overrides.map(rank).filter((n): n is number => n !== undefined)
    const shadowedBy = row.shadowedBy ? rank(row.shadowedBy) : undefined

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    className={cn(
                        "nodrag nopan flex h-5 cursor-help items-center rounded-md border px-1.5 text-[10px] font-semibold tabular-nums",
                        shadowedBy !== undefined
                            ? "border-border/70 text-muted-foreground line-through decoration-1"
                            : overrides.length > 0
                              ? "border-amber-500/50 text-amber-600 dark:text-amber-400"
                              : "border-border/70 text-muted-foreground"
                    )}
                    style={{ pointerEvents: "all" }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {t("protun.order.rank", { rank: row.rank })}
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 flex-col items-start gap-1 py-2">
                <span className="font-semibold">
                    {t("protun.order.priority", { rank: row.rank, total: rows.length })}
                </span>
                <span className="leading-snug">{t("protun.order.explain")}</span>
                {overrides.length > 0 && (
                    <span className="leading-snug text-amber-600 dark:text-amber-400">
                        {t("protun.order.overrides", {
                            ranks: overrides.map((n) => t("protun.order.rank", { rank: n })).join(", "),
                        })}
                    </span>
                )}
                {shadowedBy !== undefined && (
                    <span className="leading-snug text-muted-foreground">
                        {t("protun.order.shadowed", { rank: shadowedBy })}
                    </span>
                )}
            </TooltipContent>
        </Tooltip>
    )
}
