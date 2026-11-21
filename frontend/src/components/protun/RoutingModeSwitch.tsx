import { useState } from "react"
import { SlidersHorizontal, Waypoints } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SetRoutingMode } from "@wailsjs/go/handlers/SettingsHandler"
import type { RoutingMode } from "@/lib/protun/types"
import { t } from "@/i18n"

// Режимы взаимоисключающие: в конфиг ядра попадают правила только активного.
// Правила другого режима хранятся как есть и ждут, пока к нему вернутся.
export function RoutingModeSwitch({
    active,
    onSwitch,
}: {
    active: RoutingMode
    onSwitch: (mode: RoutingMode) => void
}) {
    const [pending, setPending] = useState(false)

    const applyMode = async (mode: RoutingMode) => {
        setPending(true)
        try {
            const r = await SetRoutingMode(mode)
            if (r.success) {
                onSwitch(mode)
            } else {
                toast.error(t("protun.toast.modeFailed"), { description: r.error })
            }
        } catch (err) {
            toast.error(t("protun.toast.modeFailed"), { description: String(err) })
        } finally {
            setPending(false)
        }
    }

    const handleValueChange = (value: string) => {
        if (!value || pending || value === active) return
        void applyMode(value as RoutingMode)
    }

    return (
        <Tabs value={active} onValueChange={handleValueChange}>
            <TabsList className="h-8">
                <TabsTrigger value="easy" disabled={pending} className="gap-1.5 text-xs">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Easy
                </TabsTrigger>
                <TabsTrigger value="pro" disabled={pending} className="gap-1.5 text-xs">
                    <Waypoints className="h-3.5 w-3.5" />
                    Pro
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
