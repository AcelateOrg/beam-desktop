import Profiles from "@/components/app/Profiles"
import ConnectButton from "@/components/app/ConnectButton"
import ConnectionStats from "@/components/app/ConnectionStats"
import { useVPN } from "@/hooks/useVPN"
import AddButton from "@/components/app/profiles/AddButton"
import NodeSelector from "@/components/app/NodeSelector"
import { useProfiles } from "@/hooks/useProfiles"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { EncryptedText } from "@/components/ui/encrypted-text"
import KillSwitchBanner from "@/components/app/KillSwitchBanner"
import { useKillSwitch } from "@/hooks/useKillSwitch"
import ServerHop from "@/components/app/ServerHop"
import { useServerSwitch } from "@/stores/serverSwitchStore"
import { t } from "@/i18n"

export default function MainPage() {
    const { isConnected, isConnecting, hasError, error, isHealthy } = useVPN()
    const { activeProfile } = useProfiles()
    const { engaged: paused } = useKillSwitch()
    const switchPhase = useServerSwitch(s => s.phase)
    const showPause = paused && !isConnected && !isConnecting

    const getStatusText = () => {
        if (showPause) return t("home.status.paused")
        if (hasError) return t("home.status.error")
        if (switchPhase === "switching") return t("home.status.switching")
        if (switchPhase === "switched" && isConnected) return t("home.status.switched")
        if (isConnecting) return t("home.status.connecting")
        if (isConnected && !isHealthy) return t("home.status.unhealthy")
        if (isConnected) return t("home.status.connected")
        if (!activeProfile) return t("home.status.noProfile")
        return t("home.status.idle")
    }

    const getStatusColor = () => {
        if (showPause) return "text-amber-500"
        if (hasError) return "text-destructive"
        if (switchPhase !== "idle") return "text-primary"
        if (isConnected && !isHealthy) return "text-yellow-500"
        if (isConnected) return "text-primary"
        return "text-foreground"
    }

    return (
        <div className="h-full flex flex-col">
            <header className="flex-shrink-0 flex flex-col">
                <Profiles start={null} end={<AddButton />} />
                <div className="flex justify-end px-3">
                    <NodeSelector />
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-3 pb-3">
                <div className="flex flex-col items-center">
                    <div className="gap-3 flex flex-col items-center">
                        <ConnectButton />

                        <span className={cn(
                            "text-xl font-extrabold text-center transition-colors duration-300",
                            getStatusColor()
                        )}>
                            {isConnected && isHealthy && switchPhase !== "switching" ? (
                                <EncryptedText
                                    key={switchPhase}
                                    text={getStatusText()}
                                    encryptedClassName="text-neutral-500"
                                    revealedClassName="dark:text-white text-black"
                                    revealDelayMs={40}
                                />
                            ) : (
                                getStatusText()
                            )}
                        </span>

                        <ServerHop />

                        <KillSwitchBanner />

                        {hasError && error && !showPause && (
                            <div className="flex items-center gap-2 text-xs text-destructive/80 text-center max-w-[280px] leading-relaxed bg-destructive/10 px-3 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <ConnectionStats />
                </div>
            </main>
        </div>
    )
}
