import { useNavigate } from "react-router-dom"
import { Card } from "../ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FaInfinity, FaTelegram } from "react-icons/fa6"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import { useProfiles } from "@/hooks/useProfiles"
import { formatBytes, formatDaysLeft } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ProfileBanner } from "./ProfileBanner"
import { t } from "@/i18n"

interface ProfilesProps {
    start: React.ReactNode
    end: React.ReactNode
    className?: string
}

export default function Profiles({ start, end, className }: ProfilesProps) {
    const { activeProfile } = useProfiles()
    const navigate = useNavigate()

    const isUnlimited = (limit: number) => limit <= 0
    const neverExpires = (days: number) => days < 0

    return (
        <Card className={cn("m-3 p-0 rounded-xl overflow-hidden bg-card/50 border-0 ring-0 shadow-none relative", className)}>
            {activeProfile?.branding?.bannerImage && (
                <ProfileBanner src={activeProfile.branding.bannerImage} />
            )}
            <div className="flex items-stretch relative">
                {start}
                <button
                    className="flex-1 px-4 py-3 text-start hover:bg-accent/30 transition-colors min-w-0"
                    onClick={() => navigate("/profiles")}
                >
                    <div className="flex items-center gap-1.5 mb-2 min-w-0">
                        {(activeProfile?.branding?.iconUrl || activeProfile?.iconUrl) && (
                            <img
                                src={activeProfile.branding?.iconUrl || activeProfile.iconUrl}
                                alt=""
                                className="h-4 w-4 shrink-0 rounded-sm object-cover"
                                loading="lazy"
                            />
                        )}
                        <h3 className="font-semibold text-sm text-foreground truncate">
                            {activeProfile?.name ?? t("profiles.noProfile")}
                        </h3>
                        {activeProfile?.communityUrl && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); BrowserOpenURL(activeProfile.communityUrl!) }}
                                title={t("profiles.card.providerChannel")}
                                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                                <FaTelegram className="w-3.5 h-3.5" />
                            </span>
                        )}
                    </div>
                    {activeProfile && (
                        <div className="flex flex-col gap-1.5 w-full">
                            {!isUnlimited(activeProfile.dataLimit) ? (
                                <>
                                    <Progress value={activeProfile.usedPercent} className="h-1.5 bg-muted" />
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>
                                            {formatBytes(activeProfile.dataUsed)} / {formatBytes(activeProfile.dataLimit)}
                                        </span>
                                        <span>{formatDaysLeft(activeProfile.daysLeft, activeProfile.isExpired)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <FaInfinity className="w-3 h-3" />
                                    <span>{t("profiles.card.unlimited")}</span>
                                    {!neverExpires(activeProfile.daysLeft) && (
                                        <span className="ms-auto">{formatDaysLeft(activeProfile.daysLeft, activeProfile.isExpired)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {!activeProfile && (
                        <div className="mt-1">
                            <Badge variant="secondary" className="text-[10px] py-0 h-5">
                                {t("profiles.add")}
                            </Badge>
                        </div>
                    )}
                </button>
                {end}
            </div>
        </Card>
    )
}
