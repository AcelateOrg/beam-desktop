import { useEffect, useState, type ElementType } from "react"
import { FaArrowDown, FaArrowUp, FaClock, FaSignal } from "react-icons/fa6"

import { useVPN } from "@/hooks/useVPN"
import { formatBytes, formatDuration, formatPing } from "@/lib/format"
import { cn } from "@/lib/utils"
import { t } from "@/i18n"

type AnimationPhase = "enter" | "exit"

function Stat({
    icon: Icon,
    label,
    value,
    valueClass,
    index,
    phase,
}: {
    icon: ElementType
    label: string
    value: string
    valueClass?: string
    index: number
    phase: AnimationPhase
}) {
    const delay = phase === "enter" ? index * 95 : index * 70

    return (
        <div
            className={cn(
                "connection-stat-item flex w-[76px] flex-col items-center gap-1",
                phase === "enter" ? "connection-stat-item-enter" : "connection-stat-item-exit"
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center gap-1 text-muted-foreground/60">
                <Icon className="h-2.5 w-2.5 shrink-0" />
                <span className="text-[9px] uppercase tracking-widest leading-none">{label}</span>
            </div>
            <span
                className={cn(
                    "text-xs font-semibold tabular-nums leading-none",
                    valueClass ?? "text-foreground/80"
                )}
            >
                {value}
            </span>
        </div>
    )
}

function StatDivider({ delay, phase }: { delay: number; phase: AnimationPhase }) {
    return (
        <div
            className={cn(
                "connection-stat-divider mx-1 h-5 w-px shrink-0 bg-border/40",
                phase === "enter" ? "connection-stat-divider-enter" : "connection-stat-divider-exit"
            )}
            style={{ animationDelay: `${delay}ms` }}
        />
    )
}

export default function ConnectionStats() {
    const { ping, stats, isHealthy, isConnected, hasError } = useVPN()
    const shouldShow = isConnected && !hasError
    const [visible, setVisible] = useState(shouldShow)
    const [phase, setPhase] = useState<AnimationPhase>(shouldShow ? "enter" : "exit")
    const [animationRun, setAnimationRun] = useState(0)

    const duration = stats?.duration ?? 0
    const download = stats?.bytesReceived ?? 0
    const upload = stats?.bytesSent ?? 0

    const pingClass = ping > 500
        ? "text-red-400"
        : ping > 200
            ? "text-yellow-400"
            : "text-foreground/80"

    useEffect(() => {
        let timer: number | undefined

        if (shouldShow) {
            setVisible(true)
            setPhase("enter")
            setAnimationRun((run) => run + 1)
            return undefined
        }

        setPhase("exit")
        setAnimationRun((run) => run + 1)
        timer = window.setTimeout(() => {
            setVisible(false)
        }, 820)

        return () => {
            if (timer !== undefined) {
                window.clearTimeout(timer)
            }
        }
    }, [shouldShow])

    if (!visible) {
        return null
    }

    return (
        <div
            className={cn(
                "connection-stats-shell",
                phase === "enter" ? "connection-stats-shell-enter" : "connection-stats-shell-exit"
            )}
        >
            <div className="flex flex-col items-center gap-2">
                {!isHealthy && (
                    <div
                        className={cn(
                            "connection-stat-health flex items-center gap-1.5 text-[10px] text-yellow-500/80",
                            phase === "enter" ? "connection-stat-item-enter" : "connection-stat-item-exit"
                        )}
                    >
                        <div className="h-1 w-1 shrink-0 rounded-full bg-yellow-500/80" />
                        {t("home.stats.unstable")}
                    </div>
                )}

                <div className="flex items-center">
                    <Stat
                        key={`ping-${animationRun}`}
                        icon={FaSignal}
                        label={t("home.stats.ping")}
                        value={formatPing(ping)}
                        valueClass={pingClass}
                        index={0}
                        phase={phase}
                    />
                    <StatDivider key={`divider-1-${animationRun}`} delay={phase === "enter" ? 80 : 60} phase={phase} />
                    <Stat
                        key={`time-${animationRun}`}
                        icon={FaClock}
                        label={t("home.stats.time")}
                        value={formatDuration(duration)}
                        index={1}
                        phase={phase}
                    />
                    <StatDivider key={`divider-2-${animationRun}`} delay={phase === "enter" ? 175 : 130} phase={phase} />
                    <Stat
                        key={`down-${animationRun}`}
                        icon={FaArrowDown}
                        label={t("home.stats.downloaded")}
                        value={formatBytes(download)}
                        valueClass="text-green-400/80"
                        index={2}
                        phase={phase}
                    />
                    <StatDivider key={`divider-3-${animationRun}`} delay={phase === "enter" ? 270 : 200} phase={phase} />
                    <Stat
                        key={`up-${animationRun}`}
                        icon={FaArrowUp}
                        label={t("home.stats.uploaded")}
                        value={formatBytes(upload)}
                        valueClass="text-blue-400/80"
                        index={3}
                        phase={phase}
                    />
                </div>
            </div>
        </div>
    )
}
