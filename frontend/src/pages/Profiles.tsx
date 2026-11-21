import { useState } from "react"
import { MoreHorizontal, Settings } from "lucide-react"
import { FaArrowsRotate, FaInfinity, FaPlus, FaShare, FaTelegram, FaTrash } from "react-icons/fa6"
import { LuUsers } from "react-icons/lu"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"

import { ProfileBanner } from "@/components/app/ProfileBanner"
import AddModal from "@/components/app/profiles/AddModal"
import ExportModal from "@/components/app/profiles/ExportModal"
import ProfileSettingsModal from "@/components/app/profiles/ProfileSettingsModal"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/ui/page-header"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProfiles } from "@/hooks/useProfiles"
import { formatBytes, formatDaysLeft } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProfileSummary } from "@/types/api"
import { t } from "@/i18n"

export default function ProfilesPage() {
    const { profiles, select, remove, refresh, setAutoRefresh, setUpdateInterval } = useProfiles()
    const [exportProfile, setExportProfile] = useState<ProfileSummary | null>(null)
    const [settingsProfileId, setSettingsProfileId] = useState<string | null>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
    const settingsProfile = profiles.find((p) => p.id === settingsProfileId) ?? null
    const deleteProfile = profiles.find((p) => p.id === deleteProfileId) ?? null

    const handleSelect = (id: string) => {
        select(id)
    }

    const handleDelete = async (id: string) => {
        await remove(id)
        setDeleteProfileId(null)
    }

    const handleRefresh = async (id: string) => {
        await refresh(id)
    }

    const handleToggleAutoRefresh = (id: string, currentlyDisabled?: boolean) => {
        void setAutoRefresh(id, !currentlyDisabled)
    }

    const handleSetUpdateInterval = (id: string, hours: number) => {
        void setUpdateInterval(id, hours)
    }

    const isUnlimited = (limit: number) => limit <= 0
    const neverExpires = (days: number) => days < 0

    const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

    return (
        <div className="flex h-full w-full flex-col">
            <PageHeader
                icon={<LuUsers className="h-4 w-4" />}
                title={t("profiles.title")}
                showBackButton={false}
                actions={(
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setAddOpen(true)}
                        title={t("profiles.add")}
                    >
                        <FaPlus className="h-3.5 w-3.5" />
                    </Button>
                )}
            />

            <AddModal open={addOpen} onOpenChange={setAddOpen} />

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 p-3 pb-10 stagger-list">
                    {profiles.map((profile) => (
                        <Card
                            key={profile.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelect(profile.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    handleSelect(profile.id)
                                }
                            }}
                            className={cn(
                                "animate-list-item relative overflow-hidden cursor-pointer border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                                profile.isActive
                                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/20"
                                    : "border-transparent bg-card hover:bg-accent/20"
                            )}
                        >
                            {profile.branding?.bannerImage && (
                                <ProfileBanner src={profile.branding.bannerImage} />
                            )}
                            <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                                <div className="min-w-0 space-y-3">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        {(profile.branding?.iconUrl || profile.iconUrl) && (
                                            <img
                                                src={profile.branding?.iconUrl || profile.iconUrl}
                                                alt=""
                                                className="h-5 w-5 shrink-0 rounded-md object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                        <h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">
                                            {profile.name}
                                        </h3>

                                        {!profile.hideProvider && profile.provider && (
                                            <Badge
                                                variant="secondary"
                                                className="h-5 shrink-0 gap-1 py-0 text-[10px]"
                                            >
                                                {profile.provider}
                                            </Badge>
                                        )}

                                        {profile.isActive && (
                                            <Badge className="h-5 shrink-0 text-[10px]">
                                                {t("profiles.card.active")}
                                            </Badge>
                                        )}

                                        {profile.communityUrl && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); BrowserOpenURL(profile.communityUrl!) }}
                                                title={t("profiles.card.providerChannel")}
                                                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                            >
                                                <FaTelegram className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {!isUnlimited(profile.dataLimit) ? (
                                        <div className="space-y-1.5">
                                            <Progress value={profile.usedPercent} className="h-1.5 bg-muted" />
                                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="break-words">
                                                    {formatBytes(profile.dataUsed)} / {formatBytes(profile.dataLimit)}
                                                </span>
                                                <span className="shrink-0">{formatDaysLeft(profile.daysLeft, profile.isExpired)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                            <FaInfinity className="h-3 w-3 shrink-0" />
                                            <span className="break-words">{t("profiles.card.unlimitedTraffic")}</span>
                                            {!neverExpires(profile.daysLeft) && (
                                                <span className="shrink-0 sm:ms-auto">
                                                    {formatDaysLeft(profile.daysLeft, profile.isExpired)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <div
                                            className="h-8 flex justify-center items-center bg-accent p-2 rounded-lg"
                                            onClick={stopPropagation}
                                        >
                                            <MoreHorizontal className="w-4 flex"/>
                                        </div>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        align="end"
                                        className="w-44"
                                        onClick={stopPropagation}
                                        onCloseAutoFocus={(e) => e.preventDefault()}
                                    >
                                        <DropdownMenuItem onSelect={() => handleRefresh(profile.id)}>
                                            <FaArrowsRotate className="h-3.5 w-3.5" />
                                            {t("profiles.menu.refresh")}
                                        </DropdownMenuItem>

                                        {profile.hasSubscription && (
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    (document.activeElement as HTMLElement | null)?.blur()
                                                    setSettingsProfileId(profile.id)
                                                }}
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                {t("profiles.menu.settings")}
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onSelect={() => {
                                                (document.activeElement as HTMLElement | null)?.blur()
                                                setExportProfile(profile)
                                            }}
                                        >
                                            <FaShare className="h-3.5 w-3.5" />
                                            {t("profiles.menu.export")}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() => {
                                                (document.activeElement as HTMLElement | null)?.blur()
                                                setDeleteProfileId(profile.id)
                                            }}
                                        >
                                            <FaTrash className="h-3.5 w-3.5" />
                                            {t("profiles.menu.delete")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    ))}

                    {profiles.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            {t("profiles.empty")}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <ExportModal
                profile={exportProfile}
                onOpenChange={(open) => { if (!open) setExportProfile(null) }}
            />

            <ProfileSettingsModal
                profile={settingsProfile}
                onOpenChange={(open) => { if (!open) setSettingsProfileId(null) }}
                onToggleAutoRefresh={handleToggleAutoRefresh}
                onSetUpdateInterval={handleSetUpdateInterval}
            />

            <AlertDialog open={!!deleteProfile} onOpenChange={(open) => { if (!open) setDeleteProfileId(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("profiles.deleteDialog.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("profiles.deleteDialog.description", { name: deleteProfile?.name ?? "" })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.action.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => { if (deleteProfileId) void handleDelete(deleteProfileId) }}
                        >
                            {t("profiles.deleteDialog.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
