import { useEffect, useState } from "react"
import { Copy, Fingerprint, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UnsavedBar } from "@/components/ui/unsaved-bar"
import { SettingsCard } from "@/components/ui/settings-card"
import { GetHwidSettings, SaveHwidSettings } from "@wailsjs/go/handlers/SettingsHandler"
import { t } from "@/i18n"
type HwidMode = "auto" | "manual"

interface HwidState {
    enabled: boolean
    mode: HwidMode
    value: string
}

export default function Hwid() {
    const [state, setState] = useState<HwidState>({ enabled: true, mode: "auto", value: "" })
    const [original, setOriginal] = useState<HwidState | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        void load()
    }, [])

    const load = async () => {
        try {
            const result = await GetHwidSettings()
            if (result.success && result.data) {
                const next: HwidState = {
                    enabled: result.data.enabled,
                    mode: (result.data.mode as HwidMode) || "auto",
                    value: result.data.value,
                }
                setState(next)
                setOriginal(next)
            }
        } catch {
            toast.error(t("settings.app.hwidPage.loadFailed"))
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await SaveHwidSettings({ enabled: state.enabled, mode: state.mode, value: state.value })
            if (!result.success) {
                toast.error(t("settings.app.hwidPage.saveFailed"), { description: result.error })
                return
            }
            setOriginal(state)
        } catch {
            toast.error(t("settings.app.hwidPage.saveFailed"))
        } finally {
            setSaving(false)
        }
    }

    const handleModeChange = (mode: HwidMode) => {
        setState((prev) => ({
            ...prev,
            mode,
            value: mode === "auto" && !prev.value ? crypto.randomUUID() : prev.value,
        }))
    }

    const regenerate = () => setState((prev) => ({ ...prev, value: crypto.randomUUID() }))

    const copyValue = () => {
        if (!state.value) return
        navigator.clipboard.writeText(state.value)
    }

    const hasChanges = original !== null &&
        (state.mode !== original.mode || state.value !== original.value)

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
            <PageHeader icon={<Fingerprint className="h-4 w-4" />} title={t("settings.app.hwidPage.title")} backTo="/settings/app" />

            <ScrollArea className="min-h-0 flex-1">
                <div className={hasChanges ? "space-y-4 p-3 pb-28" : "space-y-4 p-3 pb-6"}>
                    <SettingsCard
                        icon={<Fingerprint className="h-3.5 w-3.5" />}
                        title={t("settings.app.hwidPage.cardTitle")}
                        description={t("settings.app.hwidPage.cardDescription")}
                        className="border border-muted"
                    >
                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">{t("settings.app.hwidPage.mode")}</Label>
                                <Select value={state.mode} onValueChange={(value: HwidMode) => handleModeChange(value)}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">{t("settings.app.hwidPage.modeAuto")}</SelectItem>
                                        <SelectItem value="manual">{t("settings.app.hwidPage.modeManual")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">{t("settings.app.hwidPage.value")}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={state.value}
                                        onChange={(e) => setState((prev) => ({ ...prev, value: e.target.value }))}
                                        readOnly={state.mode === "auto"}
                                        placeholder="0af8e14a-ff5f-4cfd-af90-816a0ed6770f"
                                        className="h-10 min-w-0 flex-1 font-mono text-sm"
                                    />
                                    {state.mode === "auto" && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={regenerate}
                                            title={t("settings.app.hwidPage.regenerate")}
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 shrink-0"
                                        onClick={copyValue}
                                        disabled={!state.value}
                                        title={t("common.action.copy")}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SettingsCard>
                </div>
            </ScrollArea>

            {hasChanges && (
                <UnsavedBar
                    saving={saving}
                    onSave={handleSave}
                    onDiscard={() => original && setState(original)}
                />
            )}
        </div>
    )
}
