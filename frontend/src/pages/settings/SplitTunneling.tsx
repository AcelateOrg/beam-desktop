import { useEffect, useMemo, useState, type ReactElement } from "react"
import {
    CircleHelp,
    FolderOpen,
    Globe,
    Monitor,
    Plus,
    Server,
    Split,
    Trash2,
    TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { UnsavedBar } from "@/components/ui/unsaved-bar"
import { RoutingModeSwitch } from "@/components/protun/RoutingModeSwitch"
import { ProcessPickerDialog } from "@/components/app/ProcessPickerDialog"
import { appDisplayName, cn, normalizeAppIdentifier } from "@/lib/utils"
import { getPlatform } from "@/lib/platform"
import type { RoutingMode } from "@/lib/protun/types"
import type { RunningApplication, SplitTunnelSettings } from "@/types/api"
import { GetSplitTunnel, GetSplitTunnelConflicts, ListRunningApplications, SaveSplitTunnelSettings, SetSplitTunnelEnabled } from "@wailsjs/go/handlers/SettingsHandler"
import { PickExecutable } from "@wailsjs/go/handlers/WindowHandler"
import { t } from "@/i18n"
const defaultSettings: SplitTunnelSettings = {
    enabled: false,
    mode: "exclude",
    apps: [],
    domains: [],
    ips: [],
}

function toSplitTunnelSettings(data: any): SplitTunnelSettings {
    return {
        enabled: data.enabled ?? false,
        mode: (data.mode === "include" ? "include" : "exclude") as
            | "exclude"
            | "include",
        apps: data.apps ?? [],
        domains: data.domains ?? [],
        ips: data.ips ?? [],
    }
}

function appendUnique(
    items: string[],
    value: string,
    normalizer?: (value: string) => string
): string[] {
    const nextValue = normalizer ? normalizer(value) : value.trim()
    if (!nextValue) return items

    const nextKey = nextValue.toLowerCase()
    if (items.some((item) => item.toLowerCase() === nextKey)) return items

    return [...items, nextValue]
}

function RulesHeader({
                         totalRules,
                         enabled,
                         mode,
                         toggling,
                         onModeChange,
                         onToggle,
                         routingMode,
                         onRoutingModeChange,
                     }: {
    totalRules: number
    enabled: boolean
    mode: SplitTunnelSettings["mode"]
    toggling: boolean
    onModeChange: (value: SplitTunnelSettings["mode"]) => void
    onToggle: (value: boolean) => void
    routingMode: RoutingMode
    onRoutingModeChange: (value: RoutingMode) => void
}) {
    const modeHint =
        mode === "exclude"
            ? t("settings.splitTunneling.mode.excludeHint")
            : t("settings.splitTunneling.mode.includeHint")

    return (
        <PageHeader
            icon={<Split className="h-4 w-4" />}
            title={t("settings.splitTunneling.title")}
            showBackButton={false}
            actions={
                <>
                    {/* В узком окне счётчик и выключатель уезжают во второй этаж: справа остаётся только Easy/Pro, как в Pro. */}
                    <div className="flex items-center gap-2 max-sm:hidden">
                        <Badge variant="secondary" className="text-xs">
                            {totalRules}
                        </Badge>
                        <span className="select-none text-xs text-muted-foreground">
                            {enabled ? t("settings.splitTunneling.enabled") : t("settings.splitTunneling.disabled")}
                        </span>
                        <Switch
                            checked={enabled}
                            onCheckedChange={onToggle}
                            disabled={toggling}
                        />
                    </div>
                    <div className="mx-1 h-5 w-px bg-border max-sm:hidden" />
                    <RoutingModeSwitch active={routingMode} onSwitch={onRoutingModeChange} />
                </>
            }
            toolbar={
                <div className="flex flex-wrap items-center gap-2">
                    <TabsList className="h-8 min-w-[240px] flex-1 rounded-md bg-muted/50 p-0.5">
                        <TabsTrigger
                            value="apps"
                            className="h-7 flex-1 text-xs data-[state=active]:bg-background"
                        >
                            {t("settings.splitTunneling.tabs.apps")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="domains"
                            className="h-7 flex-1 text-xs data-[state=active]:bg-background"
                        >
                            {t("settings.splitTunneling.tabs.domains")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="ips"
                            className="h-7 flex-1 text-xs data-[state=active]:bg-background"
                        >
                            {t("settings.splitTunneling.tabs.ips")}
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-1.5 max-sm:w-full">
                        <Select
                            value={mode}
                            onValueChange={(value) =>
                                onModeChange(value as SplitTunnelSettings["mode"])
                            }
                        >
                            <SelectTrigger
                                size="sm"
                                className="h-8 w-[140px] rounded-md border-border/60 bg-muted/40 text-xs shadow-none"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="exclude">{t("settings.splitTunneling.mode.exclude")}</SelectItem>
                                <SelectItem value="include">{t("settings.splitTunneling.mode.include")}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
                                    type="button"
                                >
                                    <CircleHelp className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                                {modeHint}
                            </TooltipContent>
                        </Tooltip>

                    <div className="ms-auto flex items-center gap-2 sm:hidden">
                        <Badge variant="secondary" className="text-xs">
                            {totalRules}
                        </Badge>
                        <span className="select-none text-xs text-muted-foreground">
                            {enabled ? t("settings.splitTunneling.enabled") : t("settings.splitTunneling.disabled")}
                        </span>
                        <Switch
                            checked={enabled}
                            onCheckedChange={onToggle}
                            disabled={toggling}
                        />
                    </div>
                    </div>
                </div>
            }
        />
    )
}

function AppRuleInput({
    value,
    placeholder,
    filePickerHint,
    onChange,
    onSubmit,
    onProcessPicker,
    onFilePicker,
}: {
    value: string
    placeholder: string
    filePickerHint: string
    onChange: (value: string) => void
    onSubmit: () => void
    onProcessPicker: () => void
    onFilePicker: () => void
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-xs border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors max-sm:w-9 max-sm:px-0"
                            onClick={onProcessPicker}
                            type="button"
                        >
                            <Monitor className="h-3.5 w-3.5 sm:me-1.5" />
                            <span className="max-sm:hidden">{t("settings.splitTunneling.input.processes")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                        {t("settings.splitTunneling.input.processesHint")}
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-xs border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors max-sm:w-9 max-sm:px-0"
                            onClick={onFilePicker}
                            type="button"
                        >
                            <FolderOpen className="h-3.5 w-3.5 sm:me-1.5" />
                            <span className="max-sm:hidden">{t("settings.splitTunneling.input.file")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                        {filePickerHint}
                    </TooltipContent>
                </Tooltip>
            </div>

            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit()
                }}
                className="h-9 min-w-0 flex-1 text-sm"
            />

            <Button
                size="sm"
                className="h-9 w-9 shrink-0 px-0"
                onClick={onSubmit}
                disabled={!value.trim()}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    )
}

function RuleInput({
                       value,
                       placeholder,
                       help,
                       mono = false,
                       onChange,
                       onSubmit,
                   }: {
    value: string
    placeholder: string
    help: string
    mono?: boolean
    onChange: (value: string) => void
    onSubmit: () => void
}) {
    return (
        <div className="flex items-center gap-2">
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit()
                }}
                className={cn("h-9 flex-1", mono && "font-mono text-xs")}
            />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
                        type="button"
                    >
                        <CircleHelp className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                    {help}
                </TooltipContent>
            </Tooltip>

            <Button
                size="sm"
                className="h-9 w-9 shrink-0 px-0"
                onClick={onSubmit}
                disabled={!value.trim()}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    )
}

function RuleList({
                      items,
                      icon,
                      emptyText,
                      mono = false,
                      renderLabel,
                      onRemove,
                  }: {
    items: string[]
    icon: ReactElement
    emptyText: string
    mono?: boolean
    renderLabel?: (item: string) => string
    onRemove: (item: string) => void
}) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground">{emptyText}</p>
            </div>
        )
    }

    return (
        <Card className="gap-0 overflow-hidden py-0">
            {items.map((item, idx) => (
                <div
                    key={item}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5",
                        idx !== items.length - 1 && "border-b border-border/40"
                    )}
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                        {icon}
                    </div>

                    <span
                        className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            mono && "font-mono text-xs"
                        )}
                        title={renderLabel ? item : undefined}
                    >
                        {renderLabel ? renderLabel(item) : item}
                    </span>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(item)}
                        title={t("settings.splitTunneling.input.remove")}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
        </Card>
    )
}

export default function SplitTunneling({
    routingMode,
    onRoutingModeChange,
}: {
    routingMode: RoutingMode
    onRoutingModeChange: (mode: RoutingMode) => void
}) {
    const [settings, setSettings] = useState<SplitTunnelSettings>(defaultSettings)
    const [originalSettings, setOriginalSettings] =
        useState<SplitTunnelSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toggling, setToggling] = useState(false)

    const [tab, setTab] = useState("apps")
    const [newApp, setNewApp] = useState("")
    const [newDomain, setNewDomain] = useState("")
    const [newIP, setNewIP] = useState("")

    const [processDialogOpen, setProcessDialogOpen] = useState(false)
    const [runningApps, setRunningApps] = useState<RunningApplication[]>([])
    const [processesLoading, setProcessesLoading] = useState(false)
    const [processQuery, setProcessQuery] = useState("")
    const [conflicts, setConflicts] = useState<{ value: string; target: string }[]>([])

    const isMac = getPlatform() === "darwin"

    const loadConflicts = async () => {
        try {
            const result = await GetSplitTunnelConflicts()
            if (result.success && result.data) setConflicts(result.data as { value: string; target: string }[])
        } catch { /* конфликт-подсветка best effort */ }
    }

    useEffect(() => {
        void loadSettings()
        void loadConflicts()
    }, [])

    const loadSettings = async () => {
        try {
            const result = await GetSplitTunnel()
            if (result.success && result.data) {
                const converted = toSplitTunnelSettings(result.data)
                setSettings(converted)
                setOriginalSettings(converted)
            }
        } catch {
            toast.error(t("settings.splitTunneling.toast.loadFailed"))
        } finally {
            setLoading(false)
        }
    }

    const loadRunningApps = async () => {
        setProcessesLoading(true)
        try {
            const result = await ListRunningApplications()
            if (!result.success || !result.data) {
                toast.error(t("settings.splitTunneling.toast.processesFailed"), {
                    description: result.error,
                })
                return
            }

            setRunningApps(result.data.filter((item) => Boolean(item?.name)))
        } catch {
            toast.error(t("settings.splitTunneling.toast.processesFailed"))
        } finally {
            setProcessesLoading(false)
        }
    }

    const handleToggle = async (enabled: boolean) => {
        setToggling(true)
        try {
            const result = await SetSplitTunnelEnabled(enabled)
            if (!result.success) {
                toast.error(t("settings.splitTunneling.toast.error"), { description: result.error })
                return
            }

            setSettings((prev) => ({ ...prev, enabled }))
            setOriginalSettings((prev) => (prev ? { ...prev, enabled } : null))
        } finally {
            setToggling(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await SaveSplitTunnelSettings(settings)
            if (!result.success) {
                toast.error(t("settings.splitTunneling.toast.saveFailed"), { description: result.error })
                return
            }

            setOriginalSettings(settings)
            void loadConflicts()
        } finally {
            setSaving(false)
        }
    }

    const addApp = (value: string) => {
        const normalized = normalizeAppIdentifier(value)
        if (!normalized) return

        setSettings((prev) => ({
            ...prev,
            apps: appendUnique(prev.apps, normalized, normalizeAppIdentifier),
        }))
        setNewApp("")
    }

    const openProcessPicker = () => {
        setProcessQuery("")
        setProcessDialogOpen(true)
        void loadRunningApps()
    }

    const addPickedExecutable = async () => {
        const result = await PickExecutable()
        if (!result.success) {
            toast.error(t("settings.splitTunneling.toast.filePickerFailed"), {
                description: result.error,
            })
            return
        }

        const picked = (result.data ?? "").trim()
        if (!picked) return
        addApp(picked)
    }

    const addDomain = (value: string) => {
        const normalized = value.trim().toLowerCase()
        if (!normalized) return

        setSettings((prev) => ({
            ...prev,
            domains: appendUnique(prev.domains, normalized),
        }))
        setNewDomain("")
    }

    const addIP = (value: string) => {
        const normalized = value.trim()
        if (!normalized) return

        setSettings((prev) => ({
            ...prev,
            ips: appendUnique(prev.ips, normalized),
        }))
        setNewIP("")
    }

    const filteredProcesses = useMemo(() => {
        const query = processQuery.trim().toLowerCase()
        if (!query) return runningApps
        return runningApps.filter((item) =>
            item.name.toLowerCase().includes(query)
        )
    }, [processQuery, runningApps])

    const hasChanges = useMemo(() => {
        if (!originalSettings) return false

        return (
            settings.mode !== originalSettings.mode ||
            JSON.stringify(settings.apps) !== JSON.stringify(originalSettings.apps) ||
            JSON.stringify(settings.domains) !==
            JSON.stringify(originalSettings.domains) ||
            JSON.stringify(settings.ips) !== JSON.stringify(originalSettings.ips)
        )
    }, [originalSettings, settings])

    const totalRules =
        settings.apps.length + settings.domains.length + settings.ips.length

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="relative flex h-full w-full flex-col overflow-hidden">
                <Tabs
                    value={tab}
                    onValueChange={setTab}
                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                    <RulesHeader
                        totalRules={totalRules}
                        enabled={settings.enabled}
                        mode={settings.mode}
                        toggling={toggling}
                        onModeChange={(mode) =>
                            setSettings((prev) => ({ ...prev, mode }))
                        }
                        onToggle={handleToggle}
                        routingMode={routingMode}
                        onRoutingModeChange={onRoutingModeChange}
                    />

                    {conflicts.length > 0 && (
                        <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <div className="text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                                <p className="font-medium">{t("settings.splitTunneling.conflict.title")}</p>
                                <p className="mt-0.5 text-amber-600/80 dark:text-amber-400/80">
                                    {t("settings.splitTunneling.conflict.intro")}
                                    {conflicts[0].target === "block" ? t("settings.splitTunneling.conflict.toBlock") : t("settings.splitTunneling.conflict.toDirect")}:
                                    {" "}{conflicts.slice(0, 5).map((c) => c.value).join(", ")}
                                    {conflicts.length > 5 && t("settings.splitTunneling.conflict.more", { count: conflicts.length - 5 })}.
                                    {" "}{t("settings.splitTunneling.conflict.outro")}
                                </p>
                            </div>
                        </div>
                    )}

                    <TabsContent value="apps" className="m-0 min-h-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div
                                className={cn(
                                    "space-y-3 p-4",
                                    hasChanges && "pb-28"
                                )}
                            >
                                <AppRuleInput
                                    value={newApp}
                                    placeholder={isMac ? "/Applications/Safari.app" : "chrome.exe"}
                                    filePickerHint={isMac ? t("settings.splitTunneling.input.pickApp") : t("settings.splitTunneling.input.pickExe")}
                                    onChange={setNewApp}
                                    onSubmit={() => addApp(newApp)}
                                    onProcessPicker={openProcessPicker}
                                    onFilePicker={() => void addPickedExecutable()}
                                />

                                <RuleList
                                    items={settings.apps}
                                    icon={<Monitor className="h-3.5 w-3.5" />}
                                    emptyText={t("settings.splitTunneling.empty.apps")}
                                    renderLabel={appDisplayName}
                                    onRemove={(item) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            apps: prev.apps.filter((value) => value !== item),
                                        }))
                                    }
                                />
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent
                        value="domains"
                        className="m-0 min-h-0 flex-1 overflow-hidden"
                    >
                        <ScrollArea className="h-full">
                            <div
                                className={cn(
                                    "space-y-3 p-4 py-2",
                                    hasChanges && "pb-28"
                                )}
                            >
                                <RuleInput
                                    value={newDomain}
                                    placeholder="example.com"
                                    help={t("settings.splitTunneling.input.domainHelp")}
                                    onChange={setNewDomain}
                                    onSubmit={() => addDomain(newDomain)}
                                />

                                <RuleList
                                    items={settings.domains}
                                    icon={<Globe className="h-3.5 w-3.5" />}
                                    emptyText={t("settings.splitTunneling.empty.domains")}
                                    onRemove={(item) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            domains: prev.domains.filter(
                                                (value) => value !== item
                                            ),
                                        }))
                                    }
                                />
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="ips" className="m-0 min-h-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div
                                className={cn(
                                    "space-y-3 p-4",
                                    hasChanges && "pb-28"
                                )}
                            >
                                <RuleInput
                                    value={newIP}
                                    placeholder={t("settings.splitTunneling.input.ipPlaceholder")}
                                    help={t("settings.splitTunneling.input.ipHelp")}
                                    mono
                                    onChange={setNewIP}
                                    onSubmit={() => addIP(newIP)}
                                />

                                <RuleList
                                    items={settings.ips}
                                    icon={<Server className="h-3.5 w-3.5" />}
                                    emptyText={t("settings.splitTunneling.empty.ips")}
                                    mono
                                    onRemove={(item) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            ips: prev.ips.filter((value) => value !== item),
                                        }))
                                    }
                                />
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <ProcessPickerDialog
                    open={processDialogOpen}
                    loading={processesLoading}
                    query={processQuery}
                    processes={filteredProcesses}
                    onOpenChange={setProcessDialogOpen}
                    onQueryChange={setProcessQuery}
                    onReload={() => void loadRunningApps()}
                    onSelect={(value) => {
                        addApp(value)
                        setProcessDialogOpen(false)
                    }}
                />

                {hasChanges && (
                    <UnsavedBar
                        saving={saving}
                        onSave={handleSave}
                        onDiscard={() =>
                            originalSettings && setSettings(originalSettings)
                        }
                    />
                )}
            </div>
        </TooltipProvider>
    )
}
