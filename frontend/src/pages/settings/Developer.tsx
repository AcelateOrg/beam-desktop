import { useEffect, useState } from "react"
import {
    Bug,
    Terminal,
    RadioTower,
    ClipboardCopy,
    RotateCcw,
    Database,
    FileText,
    Wifi,
    Zap,
    AlertTriangle,
    Laptop2,
    BellRing,
} from "lucide-react"
import { toast } from "sonner"
import { Trans } from "react-i18next"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SettingsCard, SettingsRow } from "@/components/ui/settings-card"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea as SA } from "@/components/ui/scroll-area"
import { GetCoreLogging, SetCoreLogging, GetExtendedLogs, SetExtendedLogs, GetTraceLogging, SetTraceLogging, GetRealityDebug, SetRealityDebug, ResetAllData, SetDeveloperMode } from "@wailsjs/go/handlers/SettingsHandler"
import { GetActiveConfig } from "@wailsjs/go/handlers/VPNHandler"
import { DevEmulateStatus } from "@wailsjs/go/main/App"
import { useVPN } from "@/hooks/useVPN"
import { cn } from "@/lib/utils"
import { getPlatform, getDevPlatformOverride, isDevPlatformOverrideAllowed, setDevPlatformOverride, type Platform } from "@/lib/platform"
import { t } from "@/i18n"

type EmulableStatus = "disconnected" | "connecting" | "connected" | "connected_no_internet" | "disconnecting" | "error"

const STATUS_OPTIONS: { value: EmulableStatus; label: string; color: string }[] = [
    { value: "disconnected",          get label() { return t("settings.developer.emulate.status.disconnected") },        color: "bg-muted text-muted-foreground" },
    { value: "connecting",            get label() { return t("settings.developer.emulate.status.connecting") },   color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { value: "connected",             get label() { return t("settings.developer.emulate.status.connected") },       color: "bg-green-500/20 text-green-400 border-green-500/30" },
    { value: "connected_no_internet", get label() { return t("settings.developer.emulate.status.connectedNoInternet") },    color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    { value: "disconnecting",         get label() { return t("settings.developer.emulate.status.disconnecting") },    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { value: "error",                 get label() { return t("settings.developer.emulate.status.error") },           color: "bg-destructive/20 text-destructive border-destructive/30" },
]

const TOAST_SAMPLES: { label: string; show: () => void }[] = [
    { get label() { return t("settings.developer.toastDemo.button.success") }, show: () => toast.success(t("settings.developer.toastDemo.sample.profileUpdated")) },
    {
        get label() { return t("settings.developer.toastDemo.button.error") },
        show: () => toast.error(t("settings.developer.toastDemo.sample.serverSwitchFailed"), { description: "dial tcp 203.0.113.7:443: i/o timeout" }),
    },
    {
        get label() { return t("settings.developer.toastDemo.button.warning") },
        show: () => toast.warning(t("settings.developer.toastDemo.sample.subscriptionExpiring"), { description: t("settings.developer.toastDemo.sample.subscriptionExpiringHint") }),
    },
    { get label() { return t("settings.developer.toastDemo.button.info") }, show: () => toast.info(t("settings.developer.toastDemo.sample.updateAvailable")) },
    { get label() { return t("settings.developer.toastDemo.button.plain") }, show: () => toast(t("settings.developer.toastDemo.sample.linkCopied")) },
    {
        get label() { return t("settings.developer.toastDemo.button.loadingSuccess") },
        show: () => {
            const id = toast.loading(t("settings.developer.toastDemo.sample.updatingProfile"))
            window.setTimeout(() => toast.success(t("settings.developer.toastDemo.sample.profileUpdated"), { id }), 2000)
        },
    },
    {
        get label() { return t("settings.developer.toastDemo.button.loadingError") },
        show: () => {
            const id = toast.loading(t("settings.developer.toastDemo.sample.updatingProfile"))
            window.setTimeout(
                () => toast.error(t("settings.developer.toastDemo.sample.updateFailed"), { id, description: t("settings.developer.toastDemo.sample.updateFailedHint") }),
                2000,
            )
        },
    },
    {
        get label() { return t("settings.developer.toastDemo.button.actions") },
        show: () =>
            toast(t("settings.developer.toastDemo.sample.addProfile"), {
                description: t("settings.developer.toastDemo.sample.addProfileSource"),
                duration: Infinity,
                action: { label: t("settings.developer.toastDemo.sample.add"), onClick: () => toast.success(t("settings.developer.toastDemo.sample.profileAdded")) },
                cancel: { label: t("common.action.cancel"), onClick: () => {} },
            }),
    },
    {
        get label() { return t("settings.developer.toastDemo.button.long") },
        show: () =>
            toast.error(t("settings.developer.toastDemo.sample.longTitle"), {
                description:
                    "failed to build outbound: transport xhttp: extra: unknown field \"scMaxEachPostBytes\" in a very long backend error that keeps going and going so the description has to be clamped instead of growing forever",
            }),
    },
    {
        get label() { return t("settings.developer.toastDemo.button.burst") },
        show: () => {
            toast.success(t("settings.developer.toastDemo.sample.profileUpdated"))
            window.setTimeout(() => toast.info(t("settings.developer.toastDemo.sample.updateAvailable")), 250)
            window.setTimeout(() => toast.warning(t("settings.developer.toastDemo.sample.subscriptionExpiring")), 500)
            window.setTimeout(() => toast.error(t("settings.developer.toastDemo.sample.pingFailed")), 750)
        },
    },
    { get label() { return t("settings.developer.toastDemo.button.dismissAll") }, show: () => toast.dismiss() },
]

export default function Developer() {
    const { status } = useVPN()
    const [devPlatform, setDevPlatformState] = useState<Platform | null>(getDevPlatformOverride)
    const platformOverrideAllowed = isDevPlatformOverrideAllowed()
    const [coreLogging, setCoreLoggingState] = useState(true)
    const [coreLoggingLoading, setCoreLoggingLoading] = useState(false)
    const [extendedLogs, setExtendedLogsState] = useState(false)
    const [extendedLogsLoading, setExtendedLogsLoading] = useState(false)
    const [traceLogging, setTraceLoggingState] = useState(false)
    const [traceLoading, setTraceLoading] = useState(false)
    const [realityDebug, setRealityDebugState] = useState(false)
    const [realityDebugLoading, setRealityDebugLoading] = useState(false)
    const [configOpen, setConfigOpen] = useState(false)
    const [configJSON, setConfigJSON] = useState<string | null>(null)
    const [configLoading, setConfigLoading] = useState(false)
    const [emulating, setEmulating] = useState<EmulableStatus | null>(null)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [disabling, setDisabling] = useState(false)

    useEffect(() => {
        GetCoreLogging()
            .then(r => { if (r.success) setCoreLoggingState(r.data ?? true) })
            .catch(() => {})
        GetExtendedLogs()
            .then(r => { if (r.success) setExtendedLogsState(r.data ?? false) })
            .catch(() => {})
        GetTraceLogging()
            .then(r => { if (r.success) setTraceLoggingState(r.data ?? false) })
            .catch(() => {})
        GetRealityDebug()
            .then(r => { if (r.success) setRealityDebugState(r.data ?? false) })
            .catch(() => {})
    }, [])

    const handleCoreLoggingToggle = async (val: boolean) => {
        setCoreLoggingLoading(true)
        try {
            const r = await SetCoreLogging(val)
            if (r.success) {
                setCoreLoggingState(val)
            } else {
                toast.error(t("settings.developer.toast.coreLogsFailed"), { description: r.error })
            }
        } catch (e) {
            toast.error(t("settings.developer.toast.coreLogsFailed"), { description: String(e) })
        } finally {
            setCoreLoggingLoading(false)
        }
    }

    const handleExtendedLogsToggle = async (val: boolean) => {
        setExtendedLogsLoading(true)
        try {
            const r = await SetExtendedLogs(val)
            if (r.success) {
                setExtendedLogsState(val)
            } else {
                toast.error(t("settings.developer.toast.tunLogsFailed"), { description: r.error })
            }
        } catch (e) {
            toast.error(t("settings.developer.toast.tunLogsFailed"), { description: String(e) })
        } finally {
            setExtendedLogsLoading(false)
        }
    }

    const handleTraceToggle = async (val: boolean) => {
        setTraceLoading(true)
        try {
            const r = await SetTraceLogging(val)
            if (r.success) {
                setTraceLoggingState(val)
            } else {
                toast.error(t("settings.developer.toast.logLevelFailed"), { description: r.error })
            }
        } finally {
            setTraceLoading(false)
        }
    }

    const handleRealityDebugToggle = async (val: boolean) => {
        setRealityDebugLoading(true)
        try {
            const r = await SetRealityDebug(val)
            if (r.success) {
                setRealityDebugState(val)
            } else {
                toast.error(t("settings.developer.toast.realityFailed"), { description: r.error })
            }
        } finally {
            setRealityDebugLoading(false)
        }
    }

    const handleOpenConfig = async () => {
        setConfigLoading(true)
        setConfigOpen(true)
        try {
            const r = await GetActiveConfig()
            if (r.success && r.data) {
                try {
                    const parsed = JSON.parse(r.data)
                    setConfigJSON(JSON.stringify(parsed, null, 2))
                } catch {
                    setConfigJSON(r.data)
                }
            } else {
                setConfigJSON(null)
                toast.error(r.error || t("settings.developer.core.config.noProfile"))
            }
        } catch (e) {
            setConfigJSON(null)
        } finally {
            setConfigLoading(false)
        }
    }

    const handleCopyConfig = () => {
        if (!configJSON) return
        navigator.clipboard.writeText(configJSON)
    }

    const handleEmulate = async (s: EmulableStatus) => {
        setEmulating(s)
        try {
            const r = await DevEmulateStatus(s)
            if (!r.success) toast.error(t("settings.developer.toast.emulateFailed"), { description: r.error })
        } finally {
            setEmulating(null)
        }
    }

    const handleReset = async () => {
        setResetting(true)
        try {
            const r = await ResetAllData()
            if (r.success) {
                setResetDialogOpen(false)
            } else {
                toast.error(t("settings.developer.toast.resetFailed"), { description: r.error })
            }
        } finally {
            setResetting(false)
        }
    }

    const handleDisableDevMode = async () => {
        setDisabling(true)
        try {
            await SetDeveloperMode(false)
        } finally {
            setDisabling(false)
        }
    }

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
            <PageHeader
                icon={<Bug className="h-4 w-4" />}
                title={t("settings.developer.title")}
                actions={
                    <Badge variant="destructive" className="text-[10px]">DEV</Badge>
                }
            />

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-4 p-3 pb-8">
                    {/* Эмуляция статуса VPN */}
                    <SettingsCard
                        icon={<Wifi className="h-3.5 w-3.5" />}
                        title={t("settings.developer.emulate.title")}
                        description={t("settings.developer.emulate.description")}
                    >
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <span>{t("settings.developer.emulate.current")}</span>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={emulating !== null}
                                        onClick={() => handleEmulate(opt.value)}
                                        className={cn(
                                            "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                                            "hover:opacity-80 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
                                            status === opt.value
                                                ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                                : "",
                                            opt.color
                                        )}
                                    >
                                        {emulating === opt.value ? "..." : opt.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                {t("settings.developer.emulate.note")}
                            </p>
                        </div>
                    </SettingsCard>

                    {/* Симуляция платформы */}
                    {platformOverrideAllowed && (
                    <SettingsCard
                        icon={<Laptop2 className="h-3.5 w-3.5" />}
                        title={t("settings.developer.platform.title")}
                        description={t("settings.developer.platform.description")}
                    >
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <span>{t("settings.developer.platform.current")}</span>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {getPlatform()}
                                </Badge>
                            </div>
                            <div className="flex gap-2">
                                {(['windows', 'darwin', 'linux'] as Platform[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            const next = devPlatform === p ? null : p
                                            setDevPlatformOverride(next)
                                            setDevPlatformState(next)
                                        }}
                                        className={cn(
                                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                                            "hover:opacity-80 active:scale-[0.97]",
                                            devPlatform === p
                                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                : "border-border/60 bg-muted/40 text-muted-foreground"
                                        )}
                                    >
                                        {p === 'windows' ? 'Windows' : p === 'darwin' ? 'macOS' : 'Linux'}
                                    </button>
                                ))}
                                {devPlatform !== null && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDevPlatformOverride(null)
                                            setDevPlatformState(null)
                                        }}
                                        className="rounded-lg border border-dashed border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:opacity-80 transition-all"
                                    >
                                        {t("settings.developer.platform.auto")}
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                {t("settings.developer.platform.note")}
                            </p>
                        </div>
                    </SettingsCard>
                    )}

                    {/* Уведомления */}
                    <SettingsCard
                        icon={<BellRing className="h-3.5 w-3.5" />}
                        title={t("settings.developer.toastDemo.title")}
                        description={t("settings.developer.toastDemo.description")}
                    >
                        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
                            {TOAST_SAMPLES.map((sample) => (
                                <Button
                                    key={sample.label}
                                    size="sm"
                                    variant="outline"
                                    className="justify-start text-xs"
                                    onClick={sample.show}
                                >
                                    {sample.label}
                                </Button>
                            ))}
                        </div>
                    </SettingsCard>

                    {/* Ядро Xray */}
                    <SettingsCard
                        icon={<Terminal className="h-3.5 w-3.5" />}
                        title={t("settings.developer.core.title")}
                        description={t("settings.developer.core.description")}
                    >
                        <SettingsRow
                            icon={<Terminal className="h-4 w-4" />}
                            title={t("settings.developer.core.logs.title")}
                            description={t("settings.developer.core.logs.description")}
                            action={
                                <Switch
                                    checked={coreLogging}
                                    disabled={coreLoggingLoading}
                                    onCheckedChange={handleCoreLoggingToggle}
                                />
                            }
                        />
                        <Separator />
                        <SettingsRow
                            icon={<FileText className="h-4 w-4" />}
                            title={t("settings.developer.core.tunLogs.title")}
                            description={t("settings.developer.core.tunLogs.description")}
                            action={
                                <Switch
                                    checked={extendedLogs}
                                    disabled={extendedLogsLoading}
                                    onCheckedChange={handleExtendedLogsToggle}
                                />
                            }
                        />
                        <Separator />
                        <SettingsRow
                            icon={<RadioTower className="h-4 w-4" />}
                            title={t("settings.developer.core.trace.title")}
                            description={t("settings.developer.core.trace.description")}
                            action={
                                <Switch
                                    checked={traceLogging}
                                    disabled={traceLoading}
                                    onCheckedChange={handleTraceToggle}
                                />
                            }
                        />
                        <Separator />
                        <SettingsRow
                            icon={<Bug className="h-4 w-4" />}
                            title={t("settings.developer.core.reality.title")}
                            description={t("settings.developer.core.reality.description")}
                            action={
                                <Switch
                                    checked={realityDebug}
                                    disabled={realityDebugLoading}
                                    onCheckedChange={handleRealityDebugToggle}
                                />
                            }
                        />
                        <Separator />
                        <SettingsRow
                            icon={<ClipboardCopy className="h-4 w-4" />}
                            title={t("settings.developer.core.config.title")}
                            description={t("settings.developer.core.config.description")}
                            action={
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleOpenConfig}
                                    disabled={configLoading}
                                >
                                    {configLoading ? t("common.loading") : t("settings.developer.core.config.open")}
                                </Button>
                            }
                        />
                    </SettingsCard>

                    {/* Опасная зона */}
                    <SettingsCard
                        icon={<Database className="h-3.5 w-3.5" />}
                        title={t("settings.developer.danger.title")}
                        description={t("settings.developer.danger.description")}
                        variant="destructive"
                    >
                        <SettingsRow
                            icon={<RotateCcw className="h-4 w-4" />}
                            title={t("settings.developer.danger.reset.title")}
                            description={t("settings.developer.danger.reset.description")}
                            action={
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setResetDialogOpen(true)}
                                >
                                    {t("settings.developer.danger.reset.button")}
                                </Button>
                            }
                        />
                        <Separator />
                        <SettingsRow
                            icon={<Zap className="h-4 w-4" />}
                            title={t("settings.developer.danger.disable.title")}
                            description={t("settings.developer.danger.disable.description")}
                            action={
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={disabling}
                                    onClick={handleDisableDevMode}
                                >
                                    {disabling ? "..." : t("settings.developer.danger.disable.button")}
                                </Button>
                            }
                        />
                    </SettingsCard>
                </div>
            </ScrollArea>

            {/* Диалог конфига */}
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-4 pt-4 pb-3 border-b">
                        <DialogTitle className="text-sm font-medium flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-muted-foreground" />
                            {t("settings.developer.core.config.dialogTitle")}
                        </DialogTitle>
                    </DialogHeader>
                    <SA className="h-[60vh]">
                        {configLoading ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                {t("common.loading")}
                            </div>
                        ) : configJSON ? (
                            <pre className="p-4 font-mono text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
                                {configJSON}
                            </pre>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 opacity-40" />
                                <span>{t("settings.developer.core.config.noProfile")}</span>
                            </div>
                        )}
                    </SA>
                    <DialogFooter className="px-4 py-3 border-t">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCopyConfig}
                            disabled={!configJSON}
                        >
                            <ClipboardCopy className="h-3.5 w-3.5 me-1.5" />
                            {t("common.action.copy")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfigOpen(false)}>
                            {t("settings.developer.core.config.close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалог сброса */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="max-w-sm p-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            {t("settings.developer.resetDialog.title")}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        <Trans i18nKey="settings.developer.resetDialog.description" components={{ b: <strong /> }} />
                    </p>
                    <DialogFooter className="pt-2 gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetDialogOpen(false)}
                            disabled={resetting}
                        >
                            {t("common.action.cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={resetting}
                            onClick={handleReset}
                        >
                            {resetting ? t("settings.developer.resetDialog.resetting") : t("settings.developer.resetDialog.confirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
