import { Loader2, Monitor, RefreshCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { RunningApplication } from "@/types/api"
import { t } from "@/i18n"

export function ProcessPickerDialog({
    open,
    loading,
    query,
    processes,
    onOpenChange,
    onQueryChange,
    onReload,
    onSelect,
}: {
    open: boolean
    loading: boolean
    query: string
    processes: RunningApplication[]
    onOpenChange: (value: boolean) => void
    onQueryChange: (value: string) => void
    onReload: () => void
    onSelect: (value: string) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
                <DialogHeader className="border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <DialogTitle className="flex-1 text-sm font-medium">
                            {t("logs.processPicker.title")}
                        </DialogTitle>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md text-muted-foreground"
                                    onClick={onReload}
                                    disabled={loading}
                                    type="button"
                                >
                                    <RefreshCw
                                        className={cn(
                                            "h-3.5 w-3.5",
                                            loading && "animate-spin"
                                        )}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {t("logs.processPicker.refresh")}
                            </TooltipContent>
                        </Tooltip>

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
                            placeholder={t("common.action.searchPlaceholder")}
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            className="h-8 ps-8 text-xs"
                            autoFocus
                        />
                    </div>
                </div>

                <ScrollArea className="h-72">
                    {loading ? (
                        <div className="flex h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("common.loading")}
                        </div>
                    ) : processes.length === 0 ? (
                        <div className="flex h-72 items-center justify-center text-xs text-muted-foreground">
                            {t("common.nothingFound")}
                        </div>
                    ) : (
                        <div>
                            {processes.map((process, idx) => (
                                <button
                                    key={process.path || process.name}
                                    type="button"
                                    className={cn(
                                        "flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors hover:bg-muted/50",
                                        idx !== processes.length - 1 &&
                                        "border-b border-border/40"
                                    )}
                                    onClick={() => onSelect(process.path || process.name)}
                                    title={process.path || process.name}
                                >
                                    {process.icon ? (
                                        <img
                                            src={process.icon}
                                            alt=""
                                            className="h-4 w-4 shrink-0 object-contain"
                                        />
                                    ) : (
                                        <Monitor className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    <span className="truncate text-sm">{process.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
