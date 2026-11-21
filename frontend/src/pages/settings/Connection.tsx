import { useEffect, useState } from "react"
import { FaNetworkWired } from "react-icons/fa6"
import { toast } from "sonner"
import { AlertTriangle, Globe, Info, Layers, ShieldCheck } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UnsavedBar } from "@/components/ui/unsaved-bar"
import { SettingsCard, SettingsRow } from "@/components/ui/settings-card"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useKillSwitch } from "@/hooks/useKillSwitch"
import {
  GetConnectionSettings,
  GetCoreSettings,
  GetDNSSettings,
  SaveConnectionSettings,
  SaveCoreSettings,
  SaveDNSSettings,
} from "@wailsjs/go/handlers/SettingsHandler"
import { getPlatform } from "@/lib/platform"
import { cn } from "@/lib/utils"
import {
  coreFromBackend,
  coreToBackend,
  DnsCard,
  dnsFromBackend,
  dnsToBackend,
  FragmentCard,
  MuxCard,
  useSection,
  validateDns,
} from "./connection-sections"
import { t } from "@/i18n"

type Mode = "tun" | "system_proxy" | "proxy"

interface ConnectionSettings {
  mode: Mode
  proxyType: "mixed" | "http" | "socks"
  proxyHost: string
  proxyPort: number
  tunName: string
  primaryDns: string
  secondaryDns: string
  proxyDns: string
  dnsOverVpn: boolean
  mtu: number
  stack: string
}

const MODE_OPTIONS: Array<{ id: Mode; icon: React.ElementType; title: string; description: string }> = [
  {
    id: "tun",
    icon: Layers,
    get title() { return t("settings.connection.mode.tun.title") },
    get description() { return t("settings.connection.mode.tun.description") },
  },
  {
    id: "system_proxy",
    icon: Globe,
    get title() { return t("settings.connection.mode.systemProxy.title") },
    get description() { return t("settings.connection.mode.systemProxy.description") },
  },
]

// Hidden for now: the kill switch is off in the bridge (killSwitchAvailable).
const SHOW_KILL_SWITCH = false

function KillSwitchCard({ mode }: { mode: Mode }) {
  const killSwitch = useKillSwitch()
  if (!killSwitch.supported) return null

  const toggle = (enabled: boolean) => {
    killSwitch
      .setEnabled(enabled)
      .then(() => toast.success(enabled ? t("settings.connection.killSwitch.enabled") : t("settings.connection.killSwitch.disabled")))
      .catch((e) => toast.error("Kill Switch", { description: e instanceof Error ? e.message : undefined }))
  }

  return (
    <SettingsCard
      icon={<ShieldCheck className="h-3.5 w-3.5" />}
      title={t("settings.connection.killSwitch.title")}
      description={t("settings.connection.killSwitch.description")}
    >
      <SettingsRow
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Kill Switch"
        description={
          <span className="inline-flex items-center gap-1.5">
            {t("settings.connection.killSwitch.row")}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
                  aria-label={t("common.action.details")}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-72">
                <p className="leading-snug">
                  {t("settings.connection.killSwitch.details")}
                  {mode === "tun" ? t("settings.connection.killSwitch.detailsTun") : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          </span>
        }
        action={<Switch checked={killSwitch.enabled} onCheckedChange={toggle} />}
      />
    </SettingsCard>
  )
}

export default function Connection() {
  const connection = useSection<ConnectionSettings>(
    async () => {
      const res = await GetConnectionSettings()
      return { success: res.success, error: res.error, data: res.data as ConnectionSettings | undefined }
    },
    (value) => SaveConnectionSettings({ ...value, proxyType: "mixed" }),
  )
  const dns = useSection(
    async () => {
      const res = await GetDNSSettings()
      return { success: res.success, error: res.error, data: res.data ? dnsFromBackend(res.data) : undefined }
    },
    (value) => SaveDNSSettings(dnsToBackend(value)),
  )
  const core = useSection(
    async () => {
      const res = await GetCoreSettings()
      return { success: res.success, error: res.error, data: res.data ? coreFromBackend(res.data) : undefined }
    },
    (value) => SaveCoreSettings(coreToBackend(value)),
  )
  const sections = [connection, dns, core]

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const reloadAll = () => Promise.all(sections.map((s) => s.reload()))

  useEffect(() => {
    reloadAll()
      .catch((e) => toast.error(t("settings.connection.toast.loadFailed"), { description: e instanceof Error ? e.message : undefined }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasChanges = sections.some((s) => s.hasChanges)

  const handleSave = async () => {
    const problem = dns.value && dns.hasChanges ? validateDns(dns.value) : null
    if (problem) {
      toast.error(t("settings.connection.toast.checkDns"), { description: problem })
      return
    }
    setSaving(true)
    try {
      // Соединение — первым: сохранение DNS переписывает его резолверы.
      for (const section of sections) await section.commit()
      // Бэкенд нормализует значения — показываем то, что сохранилось.
      await reloadAll()
      toast.success(t("settings.connection.toast.saved"), { description: t("settings.connection.toast.savedHint") })
    } catch (e) {
      toast.error(t("settings.connection.toast.saveFailed"), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !connection.value || !dns.value || !core.value) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const settings = connection.value
  const updateField = <K extends keyof ConnectionSettings>(field: K, value: ConnectionSettings[K]) =>
    connection.update((prev) => ({ ...prev, [field]: value }))

  const platform = getPlatform()
  const systemProxyIsFlaky = settings.mode === "system_proxy" && (platform === "darwin" || platform === "linux")

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <PageHeader icon={<FaNetworkWired className="h-4 w-4" />} title={t("settings.connection.title")} />

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("space-y-4 p-3", hasChanges ? "pb-28" : "pb-6")}>
          <SettingsCard
            icon={<FaNetworkWired className="h-3.5 w-3.5" />}
            title={t("settings.connection.mode.title")}
            description={t("settings.connection.mode.description")}
          >
            <div className="p-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label={t("settings.connection.mode.title")}>
                {MODE_OPTIONS.map((option) => {
                  const selected = settings.mode === option.id
                  const Icon = option.icon
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => updateField("mode", option.id)}
                      className={cn(
                        "group relative flex h-full flex-col justify-between items-start rounded-xl border-2 p-3.5 text-start transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        selected
                          ? "border-primary bg-primary/[0.04] shadow-sm shadow-primary/5"
                          : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30",
                      )}
                    >
                      <div className="flex w-full flex-col gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className={cn("text-sm font-medium tracking-tight", selected ? "text-primary" : "text-foreground")}>
                            {option.title}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {systemProxyIsFlaky && (
              <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  {platform === "darwin" ? t("settings.connection.mode.flakyMac") : t("settings.connection.mode.flakyLinux")}
                </p>
              </div>
            )}

            {settings.mode === "proxy" && (
              <>
                <Separator />
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3 p-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("settings.connection.mode.address")}</Label>
                    <Input
                      value={settings.proxyHost}
                      onChange={(e) => updateField("proxyHost", e.target.value)}
                      placeholder="127.0.0.1"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("settings.connection.mode.port")}</Label>
                    <Input
                      type="number"
                      value={settings.proxyPort || ""}
                      onChange={(e) => updateField("proxyPort", parseInt(e.target.value, 10) || 0)}
                      placeholder="2080"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </SettingsCard>

          {SHOW_KILL_SWITCH && <KillSwitchCard mode={settings.mode} />}

          <DnsCard value={dns.value} onChange={(next) => dns.update(() => next)} />
          <FragmentCard value={core.value} onChange={(next) => core.update(() => next)} />
          <MuxCard value={core.value} onChange={(next) => core.update(() => next)} />
        </div>
      </ScrollArea>

      {hasChanges && (
        <UnsavedBar
          saving={saving}
          onSave={handleSave}
          onDiscard={() => sections.forEach((s) => s.discard())}
        />
      )}
    </div>
  )
}
