import { useCallback, useRef, useState } from "react"
import { FileCog, Globe, Layers, Plus, Scissors, Trash2, Waves } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { SettingsCard, SettingsRow } from "@/components/ui/settings-card"
import { cn } from "@/lib/utils"
import { settings } from "@wailsjs/go/models"
import { t } from "@/i18n"

// Карточки DNS, фрагментации и Mux страницы «Соединение».

export interface APIResult<T> {
    success: boolean
    data?: T
    error?: string
}

/** Раздел настроек: загрузка, правка, сохранение без собственных уведомлений. */
export function useSection<T>(load: () => Promise<APIResult<T>>, save: (value: T) => Promise<APIResult<boolean>>) {
    const [value, setValue] = useState<T | null>(null)
    const [original, setOriginal] = useState<T | null>(null)
    const io = useRef({ load, save })
    io.current = { load, save }

    const reload = useCallback(async () => {
        const res = await io.current.load()
        if (!res.success || !res.data) throw new Error(res.error || t("settings.connection.toast.noData"))
        setValue(res.data)
        setOriginal(res.data)
    }, [])

    const hasChanges = value !== null && original !== null && JSON.stringify(value) !== JSON.stringify(original)

    const commit = async () => {
        if (!value || !hasChanges) return
        const res = await io.current.save(value)
        if (!res.success) throw new Error(res.error || t("settings.connection.toast.sectionSaveFailed"))
    }

    return {
        value,
        update: (fn: (prev: T) => T) => setValue((prev) => (prev ? fn(prev) : prev)),
        hasChanges,
        reload,
        commit,
        discard: () => setValue(original),
    }
}

// --- Общие элементы ---------------------------------------------------------

export function OptionTiles<T extends string>({
    value,
    options,
    onChange,
    className,
}: {
    value: T
    options: Array<{ id: T; label: string; caption?: string }>
    onChange: (value: T) => void
    className?: string
}) {
    return (
        <div role="radiogroup" className={cn("grid gap-2.5", className)}>
            {options.map((option) => {
                const selected = option.id === value
                return (
                    <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            selected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border/60 hover:border-border hover:bg-muted/30",
                        )}
                    >
                        <span className="max-w-full truncate text-sm font-medium">{option.label}</span>
                        {option.caption && (
                            <span className="max-w-full truncate text-[10px] text-muted-foreground" title={option.caption}>
                                {option.caption}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

function Field({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-9 font-mono text-sm"
            />
        </div>
    )
}

// --- DNS -----------------------------------------------------------------------

type DnsProvider = "google" | "cloudflare" | "quad9" | "adguard" | "custom"

const DNS_PROVIDERS: Array<{ id: DnsProvider; label: string; caption: string; servers?: [string, string] }> = [
    { id: "google", label: "Google", caption: "8.8.8.8", servers: ["8.8.8.8", "8.8.4.4"] },
    { id: "cloudflare", label: "Cloudflare", caption: "1.1.1.1", servers: ["1.1.1.1", "1.0.0.1"] },
    { id: "quad9", label: "Quad9", caption: "9.9.9.9", servers: ["9.9.9.9", "149.112.112.112"] },
    { id: "adguard", label: "AdGuard", get caption() { return t("settings.connection.dns.adguardCaption") }, servers: ["94.140.14.14", "94.140.15.15"] },
    { id: "custom", get label() { return t("settings.connection.dns.custom") }, get caption() { return t("settings.connection.dns.customCaption") } },
]

export interface DnsState {
    provider: DnsProvider
    primary: string
    secondary: string
    useProfile: boolean
    // Остальное (правила, hosts, кэш) в интерфейсе не правится и сохраняется как есть.
    raw: settings.DNSSettings
}

const isLocalScheme = (address: string) => /^[a-z0-9]+\+local:\/\//i.test(address)

export function dnsFromBackend(raw: settings.DNSSettings): DnsState {
    const servers = raw.servers ?? []
    const addresses = servers.map((s) => s.address)
    const preset = DNS_PROVIDERS.find(
        (p) =>
            p.servers &&
            addresses.length === p.servers.length &&
            p.servers.every((address, i) => address === addresses[i]) &&
            servers.every((s) => !s.direct),
    )
    return {
        provider: preset?.id ?? "custom",
        primary: addresses[0] ?? "",
        secondary: addresses[1] ?? "",
        useProfile: !!raw.useProfileDns,
        raw,
    }
}

export function dnsToBackend(state: DnsState): settings.DNSSettings {
    const preset = DNS_PROVIDERS.find((p) => p.id === state.provider)?.servers
    const addresses = preset ?? [state.primary, state.secondary].map((a) => a.trim()).filter(Boolean)
    return settings.DNSSettings.createFrom({
        ...state.raw,
        servers: addresses.map((address) => ({ address, direct: isLocalScheme(address) })),
        useProfileDns: state.useProfile,
    })
}

export function validateDns(state: DnsState): string | null {
    if (state.provider !== "custom") return null
    if (!state.primary.trim()) return t("settings.connection.dns.error.empty")
    const local = [state.primary, state.secondary].some((a) => /^(localhost|127\.|::1|\[::1\])/i.test(a.trim()))
    return local ? t("settings.connection.dns.error.local") : null
}

export function DnsCard({ value, onChange }: { value: DnsState; onChange: (next: DnsState) => void }) {
    const select = (provider: DnsProvider) => {
        // «Вручную» стартует с адресов выбранного сейчас провайдера.
        const current = DNS_PROVIDERS.find((p) => p.id === value.provider)?.servers
        if (provider === "custom" && current) {
            onChange({ ...value, provider, primary: current[0], secondary: current[1] })
            return
        }
        onChange({ ...value, provider })
    }

    return (
        <SettingsCard icon={<Globe className="h-3.5 w-3.5" />} title={t("settings.connection.dns.title")} description={t("settings.connection.dns.description")}>
            <div className="space-y-3 p-4">
                <OptionTiles
                    value={value.provider}
                    options={DNS_PROVIDERS}
                    onChange={select}
                    className="grid-cols-3 sm:grid-cols-5"
                />
                {value.provider === "custom" && (
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label={t("settings.connection.dns.primary")}
                            value={value.primary}
                            onChange={(primary) => onChange({ ...value, primary })}
                            placeholder={t("settings.connection.dns.primaryPlaceholder")}
                        />
                        <Field
                            label={t("settings.connection.dns.secondary")}
                            value={value.secondary}
                            onChange={(secondary) => onChange({ ...value, secondary })}
                            placeholder={t("settings.connection.dns.secondaryPlaceholder")}
                        />
                    </div>
                )}
            </div>
            <Separator />
            <SettingsRow
                icon={<FileCog className="h-4 w-4" />}
                title={t("settings.connection.dns.fromProfile.title")}
                description={t("settings.connection.dns.fromProfile.description")}
                action={
                    <Switch
                        checked={value.useProfile}
                        onCheckedChange={(useProfile) => onChange({ ...value, useProfile })}
                    />
                }
            />
        </SettingsCard>
    )
}

// --- Фрагментация и Mux --------------------------------------------------------

type FragmentMode = "off" | "standard" | "strong" | "custom"
type Preset = "standard" | "strong"
type NoiseType = "rand" | "str" | "hex" | "base64"

interface Noise {
    type: NoiseType
    packet: string
    delay: string
}

interface FragmentFields {
    packets: string
    length: string
    interval: string
    maxSplit: string
}

export interface CoreState extends FragmentFields {
    mode: FragmentMode
    noises: Noise[]
    direct: boolean
    mux: boolean
    raw: settings.CoreSettings
}

// Дублируют domain/settings.FragmentPresets: стартовые значения для «Вручную».
const PRESETS: Record<Preset, FragmentFields> = {
    standard: { packets: "tlshello", length: "100-200", interval: "10-20", maxSplit: "" },
    strong: { packets: "1-3", length: "30-60", interval: "2-5", maxSplit: "16-32" },
}

const FRAGMENT_MODES: Array<{ id: FragmentMode; label: string; caption: string }> = [
    { id: "off", get label() { return t("settings.connection.fragment.mode.off.label") }, get caption() { return t("settings.connection.fragment.mode.off.caption") } },
    { id: "standard", get label() { return t("settings.connection.fragment.mode.standard.label") }, get caption() { return t("settings.connection.fragment.mode.standard.caption") } },
    { id: "strong", get label() { return t("settings.connection.fragment.mode.strong.label") }, get caption() { return t("settings.connection.fragment.mode.strong.caption") } },
    { id: "custom", get label() { return t("settings.connection.fragment.mode.custom.label") }, get caption() { return t("settings.connection.fragment.mode.custom.caption") } },
]

const NOISE_TYPES: Array<{ id: NoiseType; label: string; placeholder: string }> = [
    { id: "rand", get label() { return t("settings.connection.fragment.noiseType.rand") }, placeholder: "10-20" },
    { id: "str", get label() { return t("settings.connection.fragment.noiseType.str") }, placeholder: "GET / HTTP/1.1" },
    { id: "hex", get label() { return t("settings.connection.fragment.noiseType.hex") }, placeholder: "16030100" },
    { id: "base64", get label() { return t("settings.connection.fragment.noiseType.base64") }, placeholder: "7nQBAAABAAAAAAAA" },
]

const storedPreset = (raw: settings.CoreSettings): Exclude<FragmentMode, "off"> => {
    const preset = raw.fragment?.preset
    return preset === "strong" || preset === "custom" ? preset : "standard"
}

export function coreFromBackend(raw: settings.CoreSettings): CoreState {
    const f = raw.fragment ?? ({} as settings.FragmentSettings)
    return {
        mode: f.enabled ? storedPreset(raw) : "off",
        packets: f.packets ?? "",
        length: f.length ?? "",
        interval: f.interval ?? "",
        maxSplit: f.maxSplit ?? "",
        noises: (f.noises ?? []).map((n) => ({ type: (n.type || "rand") as NoiseType, packet: n.packet ?? "", delay: n.delay ?? "" })),
        direct: Boolean(f.direct),
        mux: Boolean(raw.mux?.enabled),
        raw,
    }
}

export function coreToBackend(state: CoreState): settings.CoreSettings {
    return settings.CoreSettings.createFrom({
        fragment: {
            ...state.raw.fragment,
            enabled: state.mode !== "off",
            // Выключенная фрагментация помнит последний пресет.
            preset: state.mode === "off" ? storedPreset(state.raw) : state.mode,
            packets: state.packets,
            length: state.length,
            interval: state.interval,
            maxSplit: state.maxSplit,
            noises: state.noises,
            direct: state.direct,
        },
        mux: { ...state.raw.mux, enabled: state.mux },
    })
}

export function FragmentCard({ value, onChange }: { value: CoreState; onChange: (next: CoreState) => void }) {
    const set = (patch: Partial<CoreState>) => onChange({ ...value, ...patch })
    const setNoise = (index: number, patch: Partial<Noise>) =>
        set({ noises: value.noises.map((n, i) => (i === index ? { ...n, ...patch } : n)) })

    const selectMode = (mode: FragmentMode) => {
        if (mode === "custom" && value.mode !== "custom") {
            // «Вручную» стартует с параметров текущего пресета; из «Выкл» —
            // с сохранённых своих, если они были.
            const from = value.mode === "off" ? storedPreset(value.raw) : value.mode
            set(from === "custom" ? { mode } : { mode, ...PRESETS[from] })
            return
        }
        set({ mode })
    }

    return (
        <SettingsCard
            icon={<Scissors className="h-3.5 w-3.5" />}
            title={t("settings.connection.fragment.title")}
            description={t("settings.connection.fragment.description")}
        >
            <div className="space-y-3 p-4">
                <OptionTiles value={value.mode} options={FRAGMENT_MODES} onChange={selectMode} className="grid-cols-2 sm:grid-cols-4" />

                {value.mode === "custom" && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={t("settings.connection.fragment.packets")} value={value.packets} onChange={(packets) => set({ packets })} placeholder={t("settings.connection.fragment.packetsPlaceholder")} />
                            <Field label={t("settings.connection.fragment.length")} value={value.length} onChange={(length) => set({ length })} placeholder="100-200" />
                            <Field label={t("settings.connection.fragment.interval")} value={value.interval} onChange={(interval) => set({ interval })} placeholder="10-20" />
                            <Field label={t("settings.connection.fragment.maxSplit")} value={value.maxSplit} onChange={(maxSplit) => set({ maxSplit })} placeholder={t("settings.connection.fragment.maxSplitPlaceholder")} />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Waves className="h-3.5 w-3.5" />
                                {t("settings.connection.fragment.noise")}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1"
                                disabled={value.noises.length >= 8}
                                onClick={() => set({ noises: [...value.noises, { type: "rand", packet: "10-20", delay: "10-16" }] })}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t("settings.connection.fragment.noiseAdd")}
                            </Button>
                        </div>
                        {value.noises.map((noise, index) => {
                            const meta = NOISE_TYPES.find((n) => n.id === noise.type) ?? NOISE_TYPES[0]
                            return (
                                <div key={index} className="grid grid-cols-[120px_minmax(0,1fr)_88px_auto] items-center gap-2">
                                    <Select value={noise.type} onValueChange={(type) => setNoise(index, { type: type as NoiseType })}>
                                        <SelectTrigger className="h-9 w-full text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {NOISE_TYPES.map((n) => (
                                                <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        value={noise.packet}
                                        onChange={(e) => setNoise(index, { packet: e.target.value })}
                                        placeholder={meta.placeholder}
                                        className="h-9 font-mono text-sm"
                                    />
                                    <Input
                                        value={noise.delay}
                                        onChange={(e) => setNoise(index, { delay: e.target.value })}
                                        placeholder={t("settings.connection.fragment.noiseDelay")}
                                        className="h-9 font-mono text-sm"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                        aria-label={t("settings.connection.fragment.noiseRemove")}
                                        onClick={() => set({ noises: value.noises.filter((_, i) => i !== index) })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {value.mode !== "off" && (
                <>
                    <Separator />
                    <SettingsRow
                        icon={<Scissors className="h-4 w-4" />}
                        title={t("settings.connection.fragment.direct.title")}
                        description={t("settings.connection.fragment.direct.description")}
                        action={<Switch checked={value.direct} onCheckedChange={(direct) => set({ direct })} />}
                    />
                </>
            )}
        </SettingsCard>
    )
}

export function MuxCard({ value, onChange }: { value: CoreState; onChange: (next: CoreState) => void }) {
    return (
        <SettingsCard icon={<Layers className="h-3.5 w-3.5" />} title={t("settings.connection.mux.title")}
            description={t("settings.connection.mux.description")}
        >
            <SettingsRow
                icon={<Layers className="h-4 w-4" />}
                title="Mux"
                description={t("settings.connection.mux.row")}
                action={<Switch checked={value.mux} onCheckedChange={(mux) => onChange({ ...value, mux })} />}
            />
        </SettingsCard>
    )
}
