import { Direction } from "radix-ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import {
    AlertTriangle,
    Cpu,
    HelpCircle,
    KeyRound,
    Layers,
    Loader2,
    Lock,
    Network,
    Pencil,
    RefreshCw,
    RotateCcw,
    Server,
    ShieldCheck,
    Tag,
    Waypoints,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ServerSelectButton } from "@/components/protun/ServerPicker"
import type { ProTunServerRef } from "@/lib/protun/types"
import type { NodeConfig, NodeConfigDraft, NodeInfo, OutboundConfig } from "@/types/api"
import { t } from "@/i18n"

const CONTROL_WIDTH = "w-[180px]"

type IconComponent = ComponentType<{ className?: string }>

type FieldKind = "text" | "number" | "switch" | "list" | "select"

interface FieldSpec {
    path: string
    label: string
    kind: FieldKind
    help: string
    always?: boolean
    options?: Array<{ value: string; label: string }>
    placeholder?: string
}

interface FieldGroup {
    title: string
    icon: IconComponent
    fields: FieldSpec[]
}

const NONE = "__none__"

const FINGERPRINTS = [
    "chrome",
    "firefox",
    "safari",
    "ios",
    "android",
    "edge",
    "360",
    "qq",
    "random",
    "randomized",
].map((value) => ({ value, label: value }))

// Функция, а не константа: подписи берутся из словаря в момент рендера.
function fieldGroups(): FieldGroup[] {
    return [
        {
            title: t("nodes.config.section.server"),
            icon: Server,
            fields: [
                {
                    path: "server",
                    label: t("nodes.config.field.server.label"),
                    kind: "text",
                    help: t("nodes.config.field.server.help"),
                    always: true,
                    placeholder: "example.com",
                },
                {
                    path: "server_port",
                    label: t("nodes.config.field.port.label"),
                    kind: "number",
                    help: t("nodes.config.field.port.help"),
                    always: true,
                    placeholder: "443",
                },
            ],
        },
        {
            title: t("nodes.config.section.access"),
            icon: KeyRound,
            fields: [
                {
                    path: "uuid",
                    label: t("nodes.config.field.uuid.label"),
                    kind: "text",
                    help: t("nodes.config.field.uuid.help"),
                },
                {
                    path: "password",
                    label: t("nodes.config.field.password.label"),
                    kind: "text",
                    help: t("nodes.config.field.password.help"),
                },
                {
                    path: "method",
                    label: t("nodes.config.field.method.label"),
                    kind: "text",
                    help: t("nodes.config.field.method.help"),
                },
                {
                    path: "encryption",
                    label: t("nodes.config.field.encryption.label"),
                    kind: "text",
                    help: t("nodes.config.field.encryption.help"),
                },
                {
                    path: "flow",
                    label: t("nodes.config.field.flow.label"),
                    kind: "select",
                    help: t("nodes.config.field.flow.help"),
                    options: [{ value: "xtls-rprx-vision", label: "xtls-rprx-vision" }],
                },
                {
                    path: "packet_encoding",
                    label: t("nodes.config.field.packetEncoding.label"),
                    kind: "select",
                    help: t("nodes.config.field.packetEncoding.help"),
                    options: [
                        { value: "xudp", label: "xudp" },
                        { value: "packetaddr", label: "packetaddr" },
                    ],
                },
            ],
        },
        {
            title: t("nodes.config.section.tls"),
            icon: Lock,
            fields: [
                {
                    path: "tls.enabled",
                    label: t("nodes.config.field.tlsEnabled.label"),
                    kind: "switch",
                    help: t("nodes.config.field.tlsEnabled.help"),
                },
                {
                    path: "tls.server_name",
                    label: t("nodes.config.field.sni.label"),
                    kind: "text",
                    help: t("nodes.config.field.sni.help"),
                    placeholder: "dl.google.com",
                },
                {
                    path: "tls.alpn",
                    label: t("nodes.config.field.alpn.label"),
                    kind: "list",
                    help: t("nodes.config.field.alpn.help"),
                    placeholder: "h2, http/1.1",
                },
                {
                    path: "tls.utls.enabled",
                    label: t("nodes.config.field.utls.label"),
                    kind: "switch",
                    help: t("nodes.config.field.utls.help"),
                },
                {
                    path: "tls.utls.fingerprint",
                    label: t("nodes.config.field.fingerprint.label"),
                    kind: "select",
                    help: t("nodes.config.field.fingerprint.help"),
                    options: FINGERPRINTS,
                },
                {
                    path: "tls.insecure",
                    label: t("nodes.config.field.insecure.label"),
                    kind: "switch",
                    help: t("nodes.config.field.insecure.help"),
                },
            ],
        },
        {
            title: t("nodes.config.section.reality"),
            icon: ShieldCheck,
            fields: [
                {
                    path: "tls.reality.enabled",
                    label: t("nodes.config.field.realityEnabled.label"),
                    kind: "switch",
                    help: t("nodes.config.field.realityEnabled.help"),
                },
                {
                    path: "tls.reality.public_key",
                    label: t("nodes.config.field.publicKey.label"),
                    kind: "text",
                    help: t("nodes.config.field.publicKey.help"),
                },
                {
                    path: "tls.reality.short_id",
                    label: t("nodes.config.field.shortId.label"),
                    kind: "text",
                    help: t("nodes.config.field.shortId.help"),
                },
            ],
        },
        {
            title: t("nodes.config.section.transport"),
            icon: Network,
            fields: [
                {
                    path: "transport.type",
                    label: t("nodes.config.field.transportType.label"),
                    kind: "text",
                    help: t("nodes.config.field.transportType.help"),
                },
                {
                    path: "transport.path",
                    label: t("nodes.config.field.transportPath.label"),
                    kind: "text",
                    help: t("nodes.config.field.transportPath.help"),
                },
                {
                    path: "transport.mode",
                    label: t("nodes.config.field.xhttpMode.label"),
                    kind: "text",
                    help: t("nodes.config.field.xhttpMode.help"),
                },
                {
                    path: "transport.service_name",
                    label: t("nodes.config.field.grpcService.label"),
                    kind: "text",
                    help: t("nodes.config.field.grpcService.help"),
                },
            ],
        },
    ]
}

// Опции BEAM для ноды (не параметры протокола): раздел «Ядро».
const NODE_FRAGMENT_PATH = "beam.fragment"
const NODE_MUX_PATH = "beam.mux"
// Вход цепочки: нода становится выходом, а трафик сначала идёт через этот сервер.
const NODE_ENTRY_PATH = "beam.entry"

const KNOWN_TOP_LEVEL_KEYS = new Set<string>([
    "beam",
    ...fieldGroups().flatMap((group) => group.fields.map((field) => field.path.split(".")[0])),
    "tag",
    "type",
])

function getByPath(source: OutboundConfig | undefined, path: string): unknown {
    if (!source) {
        return undefined
    }

    let current: unknown = source
    for (const key of path.split(".")) {
        if (current === null || typeof current !== "object") {
            return undefined
        }
        current = (current as Record<string, unknown>)[key]
    }
    return current
}

function toInputValue(value: unknown): string {
    if (value === undefined || value === null) {
        return ""
    }
    if (Array.isArray(value)) {
        return value.join(", ")
    }
    if (typeof value === "object") {
        return JSON.stringify(value)
    }
    return String(value)
}

function sameValue(a: unknown, b: unknown): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function HelpHint({ text, realKey }: { text: string; realKey: string }) {
    const side = Direction.useDirection() === "rtl" ? "left" : "right"
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    tabIndex={-1}
                    className="text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                >
                    <HelpCircle className="h-3 w-3" />
                </button>
            </TooltipTrigger>
            <TooltipContent side={side} className="max-w-[240px]">
                <p className="text-xs leading-relaxed">{text}</p>
                {/* Единственное место, где видно настоящее имя параметра. */}
                <p className="mt-1 font-mono text-[10px] opacity-60">{realKey}</p>
            </TooltipContent>
        </Tooltip>
    )
}

function Section({
    title,
    icon: Icon,
    children,
}: {
    title: string
    icon: IconComponent
    children: ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-0.5">
                <Icon className="h-3 w-3 text-muted-foreground/60" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {title}
                </p>
            </div>
            <div className="divide-y rounded-lg border">{children}</div>
        </div>
    )
}

function Row({
    label,
    help,
    realKey,
    changed,
    onReset,
    children,
}: {
    label: string
    help?: string
    realKey?: string
    changed?: boolean
    onReset?: () => void
    children: ReactNode
}) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-muted/20">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <Label className="truncate text-xs font-normal text-muted-foreground">
                    {label}
                </Label>
                {help && realKey && <HelpHint text={help} realKey={realKey} />}
                {changed && <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />}
            </div>

            {onReset && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    disabled={!changed}
                    title={t("nodes.config.resetToProvider")}
                    className="h-7 w-7 shrink-0 p-0 text-muted-foreground disabled:opacity-0"
                >
                    <RotateCcw className="h-3 w-3" />
                </Button>
            )}

            <div className={`flex ${CONTROL_WIDTH} shrink-0 justify-end`}>{children}</div>
        </div>
    )
}

interface FieldRowProps {
    spec: FieldSpec
    value: unknown
    originalValue: unknown
    onChange: (value: unknown) => void
    onReset: () => void
}

function FieldRow({ spec, value, originalValue, onChange, onReset }: FieldRowProps) {
    const changed = !sameValue(value, originalValue)
    const textValue = toInputValue(value)

    const handleTextChange = (raw: string) => {
        if (raw.trim() === "") {
            onChange(null)
            return
        }

        if (spec.kind === "number") {
            const parsed = Number(raw)
            onChange(Number.isFinite(parsed) ? parsed : raw)
            return
        }

        if (spec.kind === "list") {
            onChange(
                raw
                    .split(",")
                    .map((item) => item.trim())
                    .filter((item) => item !== "")
            )
            return
        }

        onChange(raw)
    }

    const options = spec.options ?? []
    const hasCurrent = textValue === "" || options.some((option) => option.value === textValue)

    return (
        <Row
            label={spec.label}
            help={spec.help}
            realKey={spec.path}
            changed={changed}
            onReset={onReset}
        >
            {spec.kind === "switch" ? (
                <Switch checked={value === true} onCheckedChange={onChange} />
            ) : spec.kind === "select" ? (
                <Select
                    value={textValue === "" ? NONE : textValue}
                    onValueChange={(next) => onChange(next === NONE ? null : next)}
                >
                    <SelectTrigger size="sm" className="w-full text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE} className="text-xs text-muted-foreground">
                            {t("nodes.config.notSet")}
                        </SelectItem>
                        {!hasCurrent && (
                            <SelectItem value={textValue} className="text-xs">
                                {textValue}
                            </SelectItem>
                        )}
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    value={textValue}
                    placeholder={spec.placeholder ?? t("nodes.config.notSet")}
                    inputMode={spec.kind === "number" ? "numeric" : undefined}
                    onChange={(event) => handleTextChange(event.target.value)}
                    className="h-8 w-full font-mono text-xs"
                />
            )}
        </Row>
    )
}

interface NodeConfigDialogProps {
    node: NodeInfo | null
    open: boolean
    onOpenChange: (open: boolean) => void
    loadConfig: (nodeId: string) => Promise<NodeConfig | null>
    saveConfig: (nodeId: string, draft: NodeConfigDraft) => Promise<NodeConfig | null>
}

export function NodeConfigDialog({
    node,
    open,
    onOpenChange,
    loadConfig,
    saveConfig,
}: NodeConfigDialogProps) {
    const [config, setConfig] = useState<NodeConfig | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState("")
    const [overrides, setOverrides] = useState<Record<string, unknown>>({})
    const [pinned, setPinned] = useState(false)

    const openedAtRef = useRef(0)

    const loadConfigRef = useRef(loadConfig)
    loadConfigRef.current = loadConfig
    const onOpenChangeRef = useRef(onOpenChange)
    onOpenChangeRef.current = onOpenChange

    const nodeId = node?.id ?? null

    useEffect(() => {
        if (!open || !nodeId) {
            return
        }

        let cancelled = false
        setLoading(true)
        setConfig(null)
        openedAtRef.current = Date.now()

        void loadConfigRef.current(nodeId).then((loaded) => {
            if (cancelled) {
                return
            }
            setLoading(false)
            if (!loaded) {
                onOpenChangeRef.current(false)
                return
            }
            setConfig(loaded)
            setName(loaded.name)
            setOverrides({ ...(loaded.overrides ?? {}) })
            setPinned(loaded.isPinned)
        })

        return () => {
            cancelled = true
        }
    }, [open, nodeId])

    const valueOf = useCallback(
        (path: string): unknown => {
            if (path in overrides) {
                return overrides[path]
            }
            return getByPath(config?.outbound, path)
        },
        [overrides, config]
    )

    const setValue = useCallback((path: string, value: unknown) => {
        setOverrides((prev) => ({ ...prev, [path]: value }))
    }, [])

    const resetValue = useCallback((path: string) => {
        setOverrides((prev) => {
            const next = { ...prev }
            delete next[path]
            return next
        })
    }, [])

    // Опции «Ядра» живут только в правках: у провайдера их нет. У закреплённой
    // ноды правки вшиты в конфиг, поэтому там читаем из outbound.
    const nodeOption = (path: string): unknown => {
        if (path in overrides) {
            return overrides[path]
        }
        return config?.isPinned ? getByPath(config.outbound, path) : undefined
    }

    const entryRef = nodeOption(NODE_ENTRY_PATH) as ProTunServerRef | undefined | null
    const otherKeys = useMemo(() => {
        if (!config) {
            return [] as Array<{ key: string; value: string }>
        }
        return Object.keys(config.outbound)
            .filter((key) => !KNOWN_TOP_LEVEL_KEYS.has(key))
            .map((key) => ({
                key,
                value: JSON.stringify(config.outbound[key]) ?? "null",
            }))
    }, [config])

    const visibleGroups = useMemo(() => {
        if (!config) {
            return [] as FieldGroup[]
        }

        return fieldGroups().map((group) => ({
            ...group,
            fields: group.fields.filter(
                (field) =>
                    field.always ||
                    field.path in overrides ||
                    getByPath(config.outbound, field.path) !== undefined ||
                    (field.path.startsWith("tls.") &&
                        getByPath(config.outbound, "tls") !== undefined)
            ),
        })).filter((group) => group.fields.length > 0)
    }, [config, overrides])

    const editedCount = Object.keys(overrides).length

    const dirty = useMemo(() => {
        if (!config) {
            return false
        }
        return (
            name !== config.name ||
            pinned !== config.isPinned ||
            JSON.stringify(overrides) !== JSON.stringify(config.overrides ?? {})
        )
    }, [config, name, overrides, pinned])

    const handleSave = useCallback(async () => {
        if (!nodeId || !config || saving) {
            return
        }

        setSaving(true)
        const saved = await saveConfig(nodeId, {
            name: name.trim(),
            overrides,
            pinned,
        })
        setSaving(false)

        if (saved) {
            onOpenChange(false)
        }
    }, [nodeId, config, saving, saveConfig, name, overrides, pinned, onOpenChange])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="gap-0 overflow-hidden p-0 sm:max-w-lg"
                showCloseButton={false}
                onInteractOutside={(event) => {
                    if (Date.now() - openedAtRef.current < 300) {
                        event.preventDefault()
                    }
                }}
            >
                <DialogHeader className="border-b px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <DialogTitle className="min-w-0 flex-1 truncate text-sm font-medium">
                            {config?.name || node?.name || t("nodes.config.fallbackTitle")}
                        </DialogTitle>
                        {config && (
                            <span className="shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                                {config.type}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground"
                            onClick={() => onOpenChange(false)}
                            type="button"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <DialogDescription className="sr-only">
                        {t("nodes.config.subtitle")}
                    </DialogDescription>
                </DialogHeader>

                {loading || !config ? (
                    <div className="flex h-72 items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <TooltipProvider delayDuration={200}>
                        <ScrollArea className="h-[420px] max-h-[60vh]">
                            <div className="space-y-4 px-4 py-3">
                                <Section title={t("nodes.config.section.main")} icon={Tag}>
                                    <Row
                                        label={t("nodes.config.name.label")}
                                        help={t("nodes.config.name.help")}
                                        realKey={t("nodes.config.name.providerName", { name: config.baseName || "—" })}
                                        changed={name !== config.baseName}
                                        onReset={() => setName(config.baseName)}
                                    >
                                        <Input
                                            value={name}
                                            placeholder={config.baseName}
                                            onChange={(event) => setName(event.target.value)}
                                            className="h-8 w-full text-xs"
                                        />
                                    </Row>
                                </Section>

                                {config.rawLinkStale && (
                                    <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                                            {t("nodes.config.staleLink")}
                                        </p>
                                    </div>
                                )}

                                {visibleGroups.map((group) => (
                                    <Section key={group.title} title={group.title} icon={group.icon}>
                                        {group.fields.map((field) => (
                                            <FieldRow
                                                key={field.path}
                                                spec={field}
                                                value={valueOf(field.path)}
                                                originalValue={getByPath(config.original, field.path)}
                                                onChange={(value) => setValue(field.path, value)}
                                                onReset={() => resetValue(field.path)}
                                            />
                                        ))}
                                    </Section>
                                ))}

                                <Section title={t("nodes.config.section.core")} icon={Cpu}>
                                    <Row
                                        label={t("nodes.config.fragment.label")}
                                        help={t("nodes.config.fragment.help")}
                                        realKey={NODE_FRAGMENT_PATH}
                                        changed={NODE_FRAGMENT_PATH in overrides}
                                        onReset={() => resetValue(NODE_FRAGMENT_PATH)}
                                    >
                                        <Switch
                                            checked={nodeOption(NODE_FRAGMENT_PATH) !== false}
                                            onCheckedChange={(checked) =>
                                                !checked
                                                    ? setValue(NODE_FRAGMENT_PATH, false)
                                                    : config.isPinned
                                                        ? setValue(NODE_FRAGMENT_PATH, true)
                                                        : resetValue(NODE_FRAGMENT_PATH)
                                            }
                                        />
                                    </Row>
                                    <Row
                                        label={t("nodes.config.mux.label")}
                                        help={t("nodes.config.mux.help")}
                                        realKey={NODE_MUX_PATH}
                                        changed={NODE_MUX_PATH in overrides}
                                        onReset={() => resetValue(NODE_MUX_PATH)}
                                    >
                                        <Select
                                            value={nodeOption(NODE_MUX_PATH) === "on" || nodeOption(NODE_MUX_PATH) === "off" ? String(nodeOption(NODE_MUX_PATH)) : NONE}
                                            onValueChange={(next) =>
                                                next !== NONE
                                                    ? setValue(NODE_MUX_PATH, next)
                                                    : config.isPinned
                                                        ? setValue(NODE_MUX_PATH, "")
                                                        : resetValue(NODE_MUX_PATH)
                                            }
                                        >
                                            <SelectTrigger size="sm" className="w-full text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE} className="text-xs text-muted-foreground">
                                                    {t("nodes.config.mux.inherit")}
                                                </SelectItem>
                                                <SelectItem value="on" className="text-xs">{t("nodes.config.mux.on")}</SelectItem>
                                                <SelectItem value="off" className="text-xs">{t("nodes.config.mux.off")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Row>
                                </Section>

                                <Section title={t("nodes.config.section.chain")} icon={Waypoints}>
                                    <Row
                                        label={t("nodes.config.chain.label")}
                                        help={t("nodes.config.chain.help")}
                                        realKey={NODE_ENTRY_PATH}
                                        changed={NODE_ENTRY_PATH in overrides}
                                        onReset={() =>
                                            config.isPinned
                                                ? setValue(NODE_ENTRY_PATH, null)
                                                : resetValue(NODE_ENTRY_PATH)
                                        }
                                    >
                                        <ServerSelectButton
                                            compact
                                            placeholder={t("nodes.config.chain.none")}
                                            value={entryRef ?? undefined}
                                            onPick={(ref) => setValue(NODE_ENTRY_PATH, ref)}
                                        />
                                    </Row>
                                </Section>

                                {config.hasSubscription && (
                                    <Section title={t("nodes.config.section.subscription")} icon={RefreshCw}>
                                        <div className="flex items-center gap-2 px-3 py-2.5">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs">{t("nodes.config.pin.label")}</p>
                                                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                                                    {t("nodes.config.pin.help")}
                                                </p>
                                            </div>
                                            <Switch checked={pinned} onCheckedChange={setPinned} />
                                        </div>
                                    </Section>
                                )}

                                {otherKeys.length > 0 && (
                                    <Section title={t("nodes.config.section.other")} icon={Layers}>
                                        {otherKeys.map((item) => (
                                            <Row key={item.key} label={item.key}>
                                                <span className="truncate text-end font-mono text-[10px] text-muted-foreground">
                                                    {item.value}
                                                </span>
                                            </Row>
                                        ))}
                                    </Section>
                                )}

                                <p className="px-0.5 text-[10px] leading-relaxed text-muted-foreground/70">
                                    {t("nodes.config.hint")}
                                </p>
                            </div>
                        </ScrollArea>
                    </TooltipProvider>
                )}

                <div className="flex items-center gap-2 border-t px-4 py-3">
                    {editedCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOverrides({})}
                            className="text-xs text-muted-foreground"
                        >
                            {t("nodes.config.resetEdits", { count: editedCount })}
                        </Button>
                    )}

                    <div className="flex-1" />

                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        {t("common.action.cancel")}
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading || saving || !dirty}>
                        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                        {t("common.action.save")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
