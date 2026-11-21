import { useEffect, useState } from "react"
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import AppLayout from "./layouts/AppLayout"
import MainPage from "./pages/Home"
import NodesPage from "./pages/Nodes"
import LogsPage from "./pages/Logs"
import ProfilesPage from "./pages/Profiles"
import SettingsPage from "./pages/settings/Settings"
import RoutingPage from "@/pages/routing/RoutingPage"
import AboutApp from "@/pages/settings/AboutApp"
import Licenses from "@/pages/settings/Licenses"
import AnalyticsPage from "@/pages/settings/Analytics"
import AppSettings from "@/pages/settings/App"
import Hwid from "@/pages/settings/Hwid"
import AppearancePage from "@/pages/settings/Appearance"
import Connection from "@/pages/settings/Connection"
import Onboarding from "@/pages/Onboarding"
import Developer from "@/pages/settings/Developer"
import NotFound from "./pages/NotFound"
import { useExternalOpen } from "@/hooks/useExternalOpen"
import { useCrashWatchdog } from "@/hooks/useCrashWatchdog"
import { GetOnboardingCompleted } from "@wailsjs/go/handlers/SettingsHandler"
import { GlobalErrorBoundary } from "@/components/ui/error-boundary"
import { isWailsNative } from "@/lib/wails-safe"
import { initPlatform, PLATFORM_OVERRIDE_CHANGED_EVENT } from "@/lib/platform"
import { initPointerEventsGuard } from "@/lib/pointer-events-guard"
import { useLanguage } from "@/i18n/useLanguage"
import { getLanguageInfo } from "@/i18n/languages"
import { Direction } from "radix-ui"

function ExternalOpenBridge() {
    useExternalOpen()
    return null
}

function CrashWatchdogBridge() {
    useCrashWatchdog()
    return null
}

function OnboardingGate() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (location.pathname === "/onboarding") return
        if (!isWailsNative()) return

        let cancelled = false
        GetOnboardingCompleted()
            .then((result) => {
                if (cancelled) return
                if (result.success && result.data !== true) {
                    navigate("/onboarding", { replace: true })
                }
            })
            .catch((error) => {
                console.warn("[OnboardingGate] Failed to check onboarding:", error)
            })

        return () => { cancelled = true }
    }, [location.pathname, navigate])

    return null
}

export default function App() {
    const [remountKey, setRemountKey] = useState(0)
    // Смена языка перемонтирует страницы: тексты берутся из глобального t,
    // и так перерисовывается всё, включая строки из констант модулей.
    const language = useLanguage()
    const dir = getLanguageInfo(language).dir

    useEffect(() => {
        const handler = () => setRemountKey((k) => k + 1)
        window.addEventListener(PLATFORM_OVERRIDE_CHANGED_EVENT, handler)
        return () => window.removeEventListener(PLATFORM_OVERRIDE_CHANGED_EVENT, handler)
    }, [])

    useEffect(() => {
        void initPlatform()
    }, [])

    useEffect(() => {
        return initPointerEventsGuard()
    }, [])

    return (
        <Direction.Provider dir={dir}>
        <BrowserRouter>
            <Toaster dir={dir} />
            <TooltipProvider delayDuration={200}>
            <GlobalErrorBoundary>
                <ExternalOpenBridge />
                <CrashWatchdogBridge />
                <OnboardingGate />
                <Routes key={`${remountKey}:${language}`}>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/" element={<AppLayout />}>
                        <Route index element={<MainPage />} />
                        <Route path="nodes" element={<NodesPage />} />
                        <Route path="profiles" element={<ProfilesPage />} />
                        <Route path="split" element={<RoutingPage />} />
                    </Route>
                    <Route path="settings" element={<AppLayout />}>
                        <Route index element={<SettingsPage />} />
                        <Route path="app" element={<AppSettings />} />
                        <Route path="hwid" element={<Hwid />} />
                        <Route path="appearance" element={<AppearancePage />} />
                        <Route path="about" element={<AboutApp />} />
                        <Route path="licenses" element={<Licenses />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="connection" element={<Connection />} />
                        <Route path="developer" element={<Developer />} />
                        <Route path="logs" element={<LogsPage />} />
                    </Route>
                </Routes>
            </GlobalErrorBoundary>
            </TooltipProvider>
        </BrowserRouter>
        </Direction.Provider>
    )
}
