import { useEffect, useRef, useState } from "react"
import { BrowserOpenURL } from "@wailsjs/runtime"
import { ChevronRight, FlaskConical, Info, RefreshCw, Scale } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { t } from "@/i18n"

import { PageHeader } from "@/components/ui/page-header"
import { GetBuildInfo } from "@wailsjs/go/handlers/SystemHandler"
import { SetDeveloperMode } from "@wailsjs/go/handlers/SettingsHandler"
import type { types } from "@wailsjs/go/models"
import { useUpdate } from "@/hooks/useUpdate"
import { useUpdateStore } from "@/stores/updateStore"
import UpdateModal from "@/components/app/UpdateModal"
import { cn } from "@/lib/utils"

const LOGO_CLICKS_REQUIRED = 10

// Метка закрытой беты рядом с версией: «BETA | FD1». Тег задаётся при сборке.
function BetaBadge({ tag }: { tag: string }) {
    return (
        <span
            className="ms-2 inline-flex translate-y-[-1px] items-stretch overflow-hidden rounded-md border border-violet-500/40 align-middle text-[11px] font-semibold leading-none shadow-[0_0_14px_-4px] shadow-violet-500/60"
            title={t("settings.about.beta.badgeTitle", { tag })}
        >
            <span className="bg-violet-500 px-1.5 py-1 tracking-[0.14em] text-white">BETA</span>
            <span className="bg-violet-500/10 px-1.5 py-1 font-mono text-violet-500 dark:text-violet-300">{tag}</span>
        </span>
    )
}

// Предупреждение только для закрытых бета-сборок.
function BetaNotice() {
    return (
        <div className="flex w-full items-start gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 px-4 py-3 text-start">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-500 dark:text-violet-300">
                <FlaskConical className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{t("settings.about.beta.title")}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t("settings.about.beta.description")}
                </p>
            </div>
        </div>
    )
}

export default function AboutApp() {
    const [clickCount, setClickCount] = useState(0)
    const [devUnlocked, setDevUnlocked] = useState(false)
    const [buildInfo, setBuildInfo] = useState<types.BuildInfo | null>(null)
    const [copiedHash, setCopiedHash] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const navigate = useNavigate()

    const { available, latestVersion, checkNow } = useUpdate()
    const [checking, setChecking] = useState(false)
    const [updateModalOpen, setUpdateModalOpen] = useState(false)

    useEffect(() => {
        GetBuildInfo().then((result) => {
            if (result.success && result.data) {
                setBuildInfo(result.data)
            }
        })
    }, [])

    const handleUpdateClick = async () => {
        if (available) {
            setUpdateModalOpen(true)
            return
        }
        if (checking) return

        setChecking(true)
        const result = await checkNow()
        setChecking(false)

        if (!result.success) {
            toast.error(t("settings.about.toast.checkFailed"), { description: result.error })
            return
        }
        if (useUpdateStore.getState().available) {
            setUpdateModalOpen(true)
        } else {
            toast.success(t("settings.about.toast.upToDate"))
        }
    }

    const handleLogoClick = async () => {
        if (devUnlocked) return

        const next = clickCount + 1
        setClickCount(next)

        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setClickCount(0), 3000)

        if (next >= LOGO_CLICKS_REQUIRED) {
            if (timerRef.current) clearTimeout(timerRef.current)
            const result = await SetDeveloperMode(true)
            if (result.success) {
                setDevUnlocked(true)
                toast.success(t("settings.about.toast.devModeOn"))
            }
        }
    }

    const handleCopyHash = async () => {
        if (!buildInfo?.buildHash) return
        try {
            await navigator.clipboard.writeText(buildInfo.buildHash)
            setCopiedHash(true)
            toast.success(t("settings.about.toast.hashCopied"))
            setTimeout(() => setCopiedHash(false), 1800)
        } catch {
            toast.error(t("settings.about.toast.hashCopyFailed"))
        }
    }

    return (
        <div className="flex h-full w-full flex-col overflow-hidden select-none">
            <PageHeader
                icon={<Info className="h-4 w-4" />}
                title={t("settings.about.title")}
            />
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 pb-16 pt-8">
                <div className="flex w-full max-w-[420px] flex-col items-center gap-5">

                    {/* Логотип */}
                    <div className="flex flex-col items-center gap-3">
                        <button
                            type="button"
                            onClick={handleLogoClick}
                            className="cursor-pointer outline-none focus:outline-none"
                        >
                            <img
                                src="/beamfull-dark.png"
                                className="w-60 drop-shadow-sm transition-transform active:scale-95 duration-100 dark:hidden"
                                alt="Logo"
                                draggable={false}
                            />
                            <img
                                src="/beamfull.png"
                                className="w-60 drop-shadow-sm transition-transform active:scale-95 duration-100 hidden dark:block"
                                alt="Logo"
                                draggable={false}
                            />
                        </button>
                    </div>

                    {/* Версия: без карточки, в одной типографике с подвалом */}
                    <div className="flex flex-col items-center gap-1.5">
                        <p className="text-base font-medium text-muted-foreground">
                            {t("settings.about.version")}{" "}
                            <span
                                className="bg-clip-text font-semibold text-transparent tabular-nums"
                                style={{
                                    backgroundImage: "linear-gradient(90deg, #ffe7a3 0%, #f5c542 45%, #c8961a 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                {buildInfo ? buildInfo.version : "…"}
                            </span>
                            {buildInfo?.betaTag && <BetaBadge tag={buildInfo.betaTag} />}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                            <button
                                type="button"
                                onClick={handleCopyHash}
                                className={cn(
                                    "outline-none transition-colors hover:text-foreground",
                                    copiedHash && "text-emerald-500 hover:text-emerald-500",
                                )}
                                title={t("settings.about.copyHashHint")}
                            >
                                {t("settings.about.build")}{" "}
                                <span className="font-mono">
                                    {buildInfo?.buildHash ? buildInfo.buildHash.slice(0, 8) : "…"}
                                </span>
                            </button>

                            <span aria-hidden className="text-muted-foreground/30">·</span>

                            <button
                                type="button"
                                disabled={checking}
                                onClick={handleUpdateClick}
                                className={cn(
                                    "flex items-center gap-1 outline-none transition-colors hover:text-foreground disabled:pointer-events-none",
                                    available && "text-amber-500 hover:text-amber-400",
                                )}
                            >
                                <RefreshCw className={cn("h-2.5 w-2.5 shrink-0", checking && "animate-spin")} />
                                {checking
                                    ? t("settings.about.checking")
                                    : available
                                      ? t("settings.about.updateTo", { version: latestVersion ?? "" })
                                      : t("settings.about.checkUpdates")}
                            </button>
                        </div>
                    </div>

                    {buildInfo?.betaTag && <BetaNotice />}

                    <button
                        type="button"
                        onClick={() => navigate("/settings/licenses")}
                        className="group flex items-center gap-2 rounded-full border border-border/60 bg-card/40 py-1.5 ps-3 pe-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:border-border hover:bg-accent/60 hover:text-foreground"
                    >
                        <Scale className="h-3.5 w-3.5" />
                        {t("settings.about.licenses")}
                        <ChevronRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </button>

                    <UpdateModal open={updateModalOpen} onOpenChange={setUpdateModalOpen} />

                </div>
            </div>

            {/* Подвал: прибит к низу страницы */}
            <footer className="flex shrink-0 flex-col items-center gap-1 px-4 pb-4 pt-2 text-center">
                <p className="text-[11px] text-muted-foreground/50">
                    {t("settings.about.footer.poweredBy")}{" "}
                    <button
                        type="button"
                        className="underline underline-offset-2 transition-colors hover:text-foreground"
                        onClick={() => void BrowserOpenURL("https://wails.io")}
                    >
                        Wails
                    </button>
                    {" "}&{" "}
                    <button
                        type="button"
                        className="underline underline-offset-2 transition-colors hover:text-foreground"
                        onClick={() => void BrowserOpenURL("https://xtls.github.io")}
                    >
                        Xray
                    </button>
                    {" "}&{" "}
                    <button
                        type="button"
                        className="underline underline-offset-2 transition-colors hover:text-foreground"
                        onClick={() => void BrowserOpenURL("https://react.dev")}
                    >
                        React
                    </button>
                </p>
                <p className="text-[10px] text-muted-foreground/40">
                    {t("settings.about.footer.rights", { year: new Date().getFullYear() })}
                </p>
                <p className="text-[10px] text-muted-foreground/40">
                    {t("settings.about.footer.love")}{" "}
                    <span className="text-red-400 animate-pulse">♥</span>
                </p>
            </footer>
        </div>
    )
}
