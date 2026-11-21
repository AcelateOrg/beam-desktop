import { useState } from "react"
import { Info, RotateCw, ShieldAlert, Wifi } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useKillSwitch } from "@/hooks/useKillSwitch"
import { useVPN } from "@/hooks/useVPN"
import { t } from "@/i18n"

/** Плашка на главной: VPN упал сам, Kill Switch поставил интернет на паузу. */
export default function KillSwitchBanner() {
    const { engaged, reason, error, release } = useKillSwitch()
    const { connect, isConnecting } = useVPN()
    const [releasing, setReleasing] = useState(false)

    if (!engaged && !error) return null

    if (!engaged) {
        return (
            <div className="flex max-w-[300px] items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <p>{t("home.killSwitch.failed", { error: error ?? "" })}</p>
            </div>
        )
    }

    const onRelease = async () => {
        setReleasing(true)
        try {
            await release()
        } catch (e) {
            toast.error(t("home.killSwitch.toast.restoreFailed"), { description: e instanceof Error ? e.message : undefined })
        } finally {
            setReleasing(false)
        }
    }

    return (
        <div className="w-[300px] rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                        {t("home.killSwitch.title")}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
                                    aria-label={t("home.killSwitch.details")}
                                >
                                    <Info className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-64">
                                <p className="leading-snug">
                                    {t("home.killSwitch.tooltip")}
                                    {reason ? ` ${t("home.killSwitch.reason", { reason })}` : ""}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {t("home.killSwitch.description")}
                    </p>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => void connect()} disabled={isConnecting || releasing}>
                    <RotateCw className={isConnecting ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                    {t("home.killSwitch.reconnect")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void onRelease()} disabled={releasing}>
                    <Wifi className="h-3.5 w-3.5" />
                    {t("home.killSwitch.restoreInternet")}
                </Button>
            </div>
        </div>
    )
}
