import { type ReactNode } from "react"
import { t } from "@/i18n"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
    icon: ReactNode
    title: string
    backTo?: string
    showBackButton?: boolean
    actions?: ReactNode
    toolbar?: ReactNode
    className?: string
}

export function PageHeader({
                               icon,
                               title,
                               backTo = "/settings",
                               showBackButton = true,
                               actions,
                               toolbar,
                               className,
                           }: PageHeaderProps) {
    const navigate = useNavigate()

    return (
        <div className={cn("backdrop-blur-2xl border-border/50 border-b", className)}>
            <div className="flex items-center gap-3 px-4 py-3">
                {showBackButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={() => navigate(backTo)}
                        title={t("common.action.back")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}

                <div className="text-muted-foreground">{icon}</div>

                <h1 className="text-lg font-semibold">{title}</h1>

                {actions && (
                    <div className="ms-auto flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {toolbar && (
                <div className="px-4 pb-2">
                    {toolbar}
                </div>
            )}
        </div>
    )
}
