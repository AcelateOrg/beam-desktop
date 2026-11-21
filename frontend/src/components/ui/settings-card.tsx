import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SettingsCardProps {
    icon: ReactNode
    title: string
    description?: string
    variant?: "default" | "primary" | "destructive"
    className?: string
    children: ReactNode
}

export function SettingsCard({
                                 icon,
                                 title,
                                 description,
                                 variant = "default",
                                 className,
                                 children,
                             }: SettingsCardProps) {
    const headerBg =
        variant === "primary" ? "bg-primary/5 border-primary/20" :
            variant === "destructive" ? "bg-destructive/5 border-destructive/20" :
                "bg-muted/10 border-border/40"

    const iconBg =
        variant === "primary" ? "bg-primary/20 text-primary" :
            variant === "destructive" ? "bg-destructive/10 text-destructive" :
                "bg-primary/10 text-primary"

    return (
        <Card className={cn("gap-0 overflow-hidden py-0 bg-sidebar", className)}>
            <div className={cn("flex items-start gap-3 border-b px-4 py-3.5", headerBg)}>
                <div className={cn("mt-0.5 rounded-lg p-2", iconBg)}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{title}</div>
                    {description && (
                        <div className="text-xs text-muted-foreground">
                            {description}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col">
                {children}
            </div>
        </Card>
    )
}

interface SettingsRowProps {
    icon: ReactNode
    title: string
    description?: string | ReactNode
    action?: ReactNode
    className?: string
}

export function SettingsRow({
                                icon,
                                title,
                                description,
                                action,
                                className,
                            }: SettingsRowProps) {
    return (
        <div className={cn("flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/10", className)}>
            <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/40 text-primary">
                    {icon}
                </div>
                <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-medium">{title}</div>
                    {description && (
                        <div className="text-[11px] leading-relaxed text-muted-foreground">
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {/* Сюда будет рендериться свитч, кнопка или селект */}
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
