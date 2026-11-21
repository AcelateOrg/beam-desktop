import { useEffect, useRef, useState } from "react"
import { Clock, RefreshCw, Settings } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { SettingsRow } from "@/components/ui/settings-card"
import type { ProfileSummary } from "@/types/api"
import { t } from "@/i18n"

const MAX_OVERRIDE_HOURS = 720

interface ProfileSettingsModalProps {
    profile: ProfileSummary | null
    onOpenChange: (open: boolean) => void
    onToggleAutoRefresh: (id: string, currentlyDisabled?: boolean) => void
    onSetUpdateInterval: (id: string, hours: number) => void
}

export default function ProfileSettingsModal({
    profile,
    onOpenChange,
    onToggleAutoRefresh,
    onSetUpdateInterval,
}: ProfileSettingsModalProps) {
    const openedAtRef = useRef(0)

    useEffect(() => {
        if (profile) openedAtRef.current = Date.now()
    }, [profile])

    const [intervalDraft, setIntervalDraft] = useState("")

    useEffect(() => {
        setIntervalDraft(
            profile?.updateIntervalOverrideHours ? String(profile.updateIntervalOverrideHours) : ""
        )
    }, [profile?.id, profile?.updateIntervalOverrideHours])

    const commitInterval = () => {
        if (!profile) return

        const parsed = Number.parseInt(intervalDraft, 10)
        let hours = Number.isFinite(parsed) ? parsed : 0
        if (hours < 0) hours = 0
        if (hours > MAX_OVERRIDE_HOURS) hours = MAX_OVERRIDE_HOURS

        setIntervalDraft(hours ? String(hours) : "")
        if (hours !== (profile.updateIntervalOverrideHours ?? 0)) {
            onSetUpdateInterval(profile.id, hours)
        }
    }

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            commitInterval()
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={profile !== null} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-sm p-5 pb-4"
                onInteractOutside={(event) => {
                    if (Date.now() - openedAtRef.current < 300) {
                        event.preventDefault()
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Settings className="h-4 w-4" />
                        {t("profiles.settingsModal.title")}
                    </DialogTitle>
                </DialogHeader>

                {profile && (
                    <div className="space-y-3">
                        {profile.hasSubscription ? (
                            <div className="divide-y overflow-hidden rounded-lg border">
                                <SettingsRow
                                    icon={<RefreshCw className="h-4 w-4" />}
                                    title={t("profiles.settingsModal.autoRefresh.title")}
                                    description={
                                        profile.autoRefreshDisabled
                                            ? t("profiles.settingsModal.autoRefresh.disabled")
                                            : profile.updateIntervalOverrideHours
                                                ? t("profiles.settingsModal.autoRefresh.ownSchedule", { hours: profile.updateIntervalOverrideHours })
                                                : profile.updateIntervalHours
                                                    ? t("profiles.settingsModal.autoRefresh.providerInterval", { hours: profile.updateIntervalHours })
                                                    : t("profiles.settingsModal.autoRefresh.providerSchedule")
                                    }
                                    action={
                                        <Switch
                                            checked={!profile.autoRefreshDisabled}
                                            onCheckedChange={() => onToggleAutoRefresh(profile.id, profile.autoRefreshDisabled)}
                                        />
                                    }
                                />

                                {/* Своё расписание имеет смысл только при включённом
                                    автообновлении: это замена провайдерскому интервалу. При
                                    выключенном рубильнике обновлений нет вовсе, и
                                    переопределять там нечего. */}
                                {!profile.autoRefreshDisabled && (
                                    <SettingsRow
                                        icon={<Clock className="h-4 w-4" />}
                                        title={t("profiles.settingsModal.override.title")}
                                        description={
                                            profile.updateIntervalOverrideHours
                                                ? t("profiles.settingsModal.override.active", { hours: profile.updateIntervalOverrideHours })
                                                : profile.updateIntervalHours
                                                    ? t("profiles.settingsModal.override.emptyWithInterval", { hours: profile.updateIntervalHours })
                                                    : t("profiles.settingsModal.override.empty")
                                        }
                                        action={
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    type="number"
                                                    inputMode="numeric"
                                                    min={0}
                                                    max={MAX_OVERRIDE_HOURS}
                                                    placeholder="—"
                                                    value={intervalDraft}
                                                    onChange={(event) => setIntervalDraft(event.target.value)}
                                                    onBlur={commitInterval}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") {
                                                            event.preventDefault()
                                                            commitInterval()
                                                        }
                                                    }}
                                                    className="w-16 text-end"
                                                />
                                                <span className="text-xs text-muted-foreground">{t("profiles.settingsModal.override.hoursUnit")}</span>
                                            </div>
                                        }
                                    />
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                {t("profiles.settingsModal.noSubscription")}
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        {t("profiles.settingsModal.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
