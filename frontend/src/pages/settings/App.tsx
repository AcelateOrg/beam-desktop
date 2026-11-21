import { useEffect, useState } from "react"
import {
  Activity,
  Fingerprint,
  HelpCircle,
  Minimize2,
  Monitor,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Zap
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { UnsavedBar } from "@/components/ui/unsaved-bar"
import { SettingsCard, SettingsRow } from "@/components/ui/settings-card"
import { GetApplicationSettings, GetHwidSettings, GetPingSettings, SaveApplicationSettings, SaveHwidSettings, SavePingSettings, SetOnboardingCompleted } from "@wailsjs/go/handlers/SettingsHandler"
import { getPlatform } from "@/lib/platform"
import LanguageCard from "@/components/app/LanguageCard"
import { t } from "@/i18n"

interface ApplicationSettings {
  launchOnStartup: boolean
  minimizeToTray: boolean
  autoConnect: boolean
  disableSubscriptionAutoRefresh: boolean
}

interface HwidState {
  enabled: boolean
  mode: string
  value: string
}

interface PingSettings {
  nodeMode: string
  connectionMode: string
}

const defaultApplicationSettings: ApplicationSettings = {
  launchOnStartup: false,
  minimizeToTray: false,
  autoConnect: false,
  disableSubscriptionAutoRefresh: false,
}

const defaultHwid: HwidState = { enabled: false, mode: "auto", value: "" }
const defaultPingSettings: PingSettings = { nodeMode: "auto", connectionMode: "http" }

export default function AppSettings() {
  const navigate = useNavigate()
  const platform = getPlatform()
  const isWindows = platform === "windows"
  const isMacOS = platform === "darwin"
  const isLinux = platform === "linux"

  const [settings, setSettings] = useState<ApplicationSettings>(defaultApplicationSettings)
  const [hwid, setHwid] = useState<HwidState>(defaultHwid)
  const [ping, setPing] = useState<PingSettings>(defaultPingSettings)
  const [original, setOriginal] = useState<{ app: ApplicationSettings; hwid: HwidState; ping: PingSettings } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resettingOnboarding, setResettingOnboarding] = useState(false)

  useEffect(() => {
    void loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [appResult, hwidResult, pingResult] = await Promise.all([
        GetApplicationSettings(),
        GetHwidSettings(),
        GetPingSettings(),
      ])

      const app: ApplicationSettings = appResult.success && appResult.data
        ? {
            launchOnStartup: appResult.data.launchOnStartup ?? false,
            minimizeToTray: appResult.data.minimizeToTray ?? false,
            autoConnect: appResult.data.autoConnect ?? false,
            disableSubscriptionAutoRefresh: appResult.data.disableSubscriptionAutoRefresh ?? false,
          }
        : defaultApplicationSettings

      const nextHwid: HwidState = hwidResult.success && hwidResult.data
        ? {
            enabled: hwidResult.data.enabled,
            mode: hwidResult.data.mode || "auto",
            value: hwidResult.data.value,
          }
        : defaultHwid

      const nextPing: PingSettings = pingResult.success && pingResult.data
        ? {
            nodeMode: pingResult.data.nodeMode || "auto",
            connectionMode: pingResult.data.connectionMode || "http",
          }
        : defaultPingSettings

      setSettings(app)
      setHwid(nextHwid)
      setPing(nextPing)
      setOriginal({ app, hwid: nextHwid, ping: nextPing })
    } catch {
      toast.error(t("settings.app.toast.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const [appRes, hwidRes, pingRes] = await Promise.all([
        SaveApplicationSettings(settings),
        SaveHwidSettings({ enabled: hwid.enabled, mode: hwid.mode, value: hwid.value }),
        SavePingSettings({ nodeMode: ping.nodeMode, connectionMode: ping.connectionMode }),
      ])

      if (!appRes.success || !hwidRes.success || !pingRes.success) {
        const error = appRes.error || hwidRes.error || pingRes.error
        toast.error(t("settings.app.toast.saveError"), { description: error })
        return
      }

      setOriginal({ app: settings, hwid, ping })
      toast.success(t("settings.app.toast.saved"))
    } catch {
      toast.error(t("settings.app.toast.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const update = <K extends keyof ApplicationSettings>(field: K, value: ApplicationSettings[K]) =>
    setSettings(prev => ({ ...prev, [field]: value }))

  const handleResetOnboarding = async () => {
    setResettingOnboarding(true)
    try {
      const result = await SetOnboardingCompleted(false)
      if (!result.success) {
        toast.error(t("settings.app.toast.onboardingResetFailed"))
        return
      }
      navigate("/onboarding", { replace: true })
    } catch {
      toast.error(t("settings.app.toast.onboardingResetFailed"))
    } finally {
      setResettingOnboarding(false)
    }
  }

  const hasChanges = original !== null &&
    (JSON.stringify(settings) !== JSON.stringify(original.app) ||
      JSON.stringify(hwid) !== JSON.stringify(original.hwid) ||
      JSON.stringify(ping) !== JSON.stringify(original.ping))

  const hwidStatus = !hwid.enabled
    ? t("settings.app.hwid.mode.disabled")
    : hwid.mode === "manual"
      ? t("settings.app.hwid.mode.manual")
      : t("settings.app.hwid.mode.auto")

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <PageHeader icon={<Monitor className="h-4 w-4" />} title={t("settings.app.title")} />

      <ScrollArea className="min-h-0 flex-1">
        <div className={hasChanges ? "space-y-4 p-3 pb-28" : "space-y-4 p-3 pb-6"}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <LanguageCard />

              {/* Основное поведение */}
              <SettingsCard
                icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                title={t("settings.app.behavior.title")}
                description={t("settings.app.behavior.description")}
              >
                <div className="flex flex-col">
                  <SettingsRow
                    icon={<Play className="h-4 w-4" />}
                    title={t("settings.app.behavior.launchOnStartup.title")}
                    description={
                      isMacOS
                        ? t("settings.app.behavior.launchOnStartup.descriptionMacos")
                        : t("settings.app.behavior.launchOnStartup.description")
                    }
                    action={
                      <Switch
                        checked={settings.launchOnStartup}
                        disabled={!isWindows && !isLinux}
                        onCheckedChange={v => update("launchOnStartup", v)}
                      />
                    }
                  />
                  <Separator />
                  <SettingsRow
                    icon={<Zap className="h-4 w-4" />}
                    title={t("settings.app.behavior.autoConnect.title")}
                    description={t("settings.app.behavior.autoConnect.description")}
                    action={
                      <Switch
                        checked={settings.autoConnect}
                        onCheckedChange={v => update("autoConnect", v)}
                      />
                    }
                  />
                  <Separator />
                  <SettingsRow
                    icon={<RefreshCw className="h-4 w-4" />}
                    title={t("settings.app.behavior.subscriptionAutoRefresh.title")}
                    description={t("settings.app.behavior.subscriptionAutoRefresh.description")}
                    action={
                      <Switch
                        checked={!settings.disableSubscriptionAutoRefresh}
                        onCheckedChange={v => update("disableSubscriptionAutoRefresh", !v)}
                      />
                    }
                  />
                  <Separator />
                  <SettingsRow
                    icon={<Minimize2 className="h-4 w-4" />}
                    title={t("settings.app.behavior.minimizeToTray.title")}
                    description={
                      isMacOS
                        ? t("settings.app.behavior.minimizeToTray.descriptionMacos")
                        : t("settings.app.behavior.minimizeToTray.description")
                    }
                    action={
                      <Switch
                        checked={!isMacOS && settings.minimizeToTray}
                        disabled={isMacOS}
                        onCheckedChange={v => update("minimizeToTray", v)}
                      />
                    }
                  />
                </div>
              </SettingsCard>

              {/* Сетевой отклик и проверка */}
              <SettingsCard
                icon={<Activity className="h-3.5 w-3.5" />}
                title={t("settings.app.ping.title")}
                description={t("settings.app.ping.description")}
              >
                <div className="flex flex-col">
                  <SettingsRow
                    icon={<Radio className="h-4 w-4" />}
                    title={t("settings.app.ping.nodeMode.title")}
                    description={t("settings.app.ping.nodeMode.description")}
                    action={
                      <Select value={ping.nodeMode} onValueChange={v => setPing(p => ({ ...p, nodeMode: v }))}>
                        <SelectTrigger className="h-8 w-auto min-w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">{t("settings.app.ping.nodeMode.auto")}</SelectItem>
                          <SelectItem value="protocol">{t("settings.app.ping.nodeMode.protocol")}</SelectItem>
                          <SelectItem value="tcp">{t("settings.app.ping.nodeMode.tcp")}</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                  />
                  <Separator />
                  <SettingsRow
                    icon={<Activity className="h-4 w-4" />}
                    title={t("settings.app.ping.connectionMode.title")}
                    description={t("settings.app.ping.connectionMode.description")}
                    action={
                      <Select value={ping.connectionMode} onValueChange={v => setPing(p => ({ ...p, connectionMode: v }))}>
                        <SelectTrigger className="h-8 w-auto min-w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="http">{t("settings.app.ping.connectionMode.http")}</SelectItem>
                          <SelectItem value="tcp">{t("settings.app.ping.connectionMode.tcp")}</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                  />
                </div>
              </SettingsCard>

              {/* Идентификатор устройства */}
              <SettingsCard
                icon={<Fingerprint className="h-3.5 w-3.5" />}
                title={t("settings.app.hwid.title")}
                description={t("settings.app.hwid.description")}
              >
                <div className="flex flex-col">
                  <SettingsRow
                    icon={<Fingerprint className="h-4 w-4" />}
                    title={t("settings.app.hwid.send.title")}
                    description={t("settings.app.hwid.send.description")}
                    action={
                      <Switch
                        checked={hwid.enabled}
                        onCheckedChange={v => setHwid(h => ({ ...h, enabled: v }))}
                      />
                    }
                  />
                  {hwid.enabled && (
                    <>
                      <Separator />
                      <SettingsRow
                        icon={<SlidersHorizontal className="h-4 w-4" />}
                        title={t("settings.app.hwid.value.title")}
                        description={t("settings.app.hwid.value.description", { mode: hwidStatus })}
                        action={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/settings/hwid")}
                          >
                            {t("settings.app.hwid.value.configure")}
                          </Button>
                        }
                      />
                    </>
                  )}
                </div>
              </SettingsCard>

              {/* Прочее / Быстрые действия */}
              <SettingsCard
                icon={<HelpCircle className="h-3.5 w-3.5" />}
                title={t("settings.app.service.title")}
                description={t("settings.app.service.description")}
              >
                <div className="flex flex-col">
                  <SettingsRow
                    icon={<RotateCcw className="h-4 w-4" />}
                    title={t("settings.app.service.onboarding.title")}
                    description={t("settings.app.service.onboarding.description")}
                    action={
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={resettingOnboarding}
                        onClick={handleResetOnboarding}
                      >
                        <RotateCcw className="me-2 h-3.5 w-3.5" />
                        {resettingOnboarding ? t("settings.app.service.onboarding.resetting") : t("settings.app.service.onboarding.action")}
                      </Button>
                    }
                  />
                </div>
              </SettingsCard>
            </>
          )}
        </div>
      </ScrollArea>

      {hasChanges && (
        <UnsavedBar
          saving={saving}
          onSave={handleSave}
          onDiscard={() => {
            if (!original) return
            setSettings(original.app)
            setHwid(original.hwid)
            setPing(original.ping)
          }}
        />
      )}
    </div>
  )
}
