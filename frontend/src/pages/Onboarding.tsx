import { useEffect, useMemo, useState, type CSSProperties, type ElementType, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Languages,
    Monitor,
    Palette,
    Play,
    ShieldCheck,
    Upload,
} from "lucide-react"
import { toast } from "sonner"
import { LANGUAGES, getLanguageInfo, setLanguage, t, type LanguageCode } from "@/i18n"
import { useLanguage } from "@/i18n/useLanguage"

import AddModal from "@/components/app/profiles/AddModal"
import TitleBar from "@/components/app/TitleBar"
import WindowControls from "@/components/app/WindowsControls"
import { Button } from "@/components/ui/button"
import CountryFlag from "@/components/ui/country-flag"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { useProfiles } from "@/hooks/useProfiles"
import { useTheme } from "@/hooks/useTheme"
import { THEME_OPTIONS, type ThemeOption } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { getPlatform } from "@/lib/platform"
import type { Theme } from "@/types/api"
import { GetApplicationSettings, SaveApplicationSettings, SetOnboardingCompleted } from "@wailsjs/go/handlers/SettingsHandler"
type StepId = "language" | "welcome" | "theme" | "profile" | "behavior"
type Direction = "forward" | "back"
type CompletionPhase = "idle" | "wizardExit" | "empty" | "trace" | "solid"

interface ApplicationSettings {
    launchOnStartup: boolean
    minimizeToTray: boolean
    autoConnect: boolean
    disableSubscriptionAutoRefresh: boolean
}

interface WizardStep {
    id: StepId
    title: string
    eyebrow: string
    description: string
    icon: ElementType
}

const defaultApplicationSettings: ApplicationSettings = {
    launchOnStartup: false,
    minimizeToTray: false,
    autoConnect: false,
    disableSubscriptionAutoRefresh: false,
}

const steps: WizardStep[] = [
    {
        id: "language",
        get title() {
            return t("onboarding.step.language.title")
        },
        get eyebrow() {
            return t("onboarding.step.language.eyebrow")
        },
        get description() {
            return t("onboarding.step.language.description")
        },
        icon: Languages,
    },
    {
        id: "welcome",
        get title() {
            return t("onboarding.step.welcome.title")
        },
        get eyebrow() {
            return t("onboarding.step.welcome.eyebrow")
        },
        get description() {
            return t("onboarding.step.welcome.description")
        },
        icon: Check,
    },
    {
        id: "theme",
        get title() {
            return t("onboarding.step.theme.title")
        },
        get eyebrow() {
            return t("onboarding.step.theme.eyebrow")
        },
        get description() {
            return t("onboarding.step.theme.description")
        },
        icon: Palette,
    },
    {
        id: "profile",
        get title() {
            return t("onboarding.step.profile.title")
        },
        get eyebrow() {
            return t("onboarding.step.profile.eyebrow")
        },
        get description() {
            return t("onboarding.step.profile.description")
        },
        icon: Upload,
    },
    {
        id: "behavior",
        get title() {
            return t("onboarding.step.behavior.title")
        },
        get eyebrow() {
            return t("onboarding.step.behavior.eyebrow")
        },
        get description() {
            return t("onboarding.step.behavior.description")
        },
        icon: Monitor,
    },
]

const compactThemeOrder: ThemeOption["value"][] = ["system", "light", "dark", "amoled"]

const beamLogoPaths = [
    "M289.309 74.5094C296.5 78.9371 301.755 85.3019 305.074 93.6038C306.18 95.956 306.941 98.5157 307.356 101.283C307.771 104.05 307.978 106.956 307.978 110C307.978 120.101 305.281 128.61 299.888 135.528C294.495 142.308 286.612 147.358 276.24 150.679C269.74 152.893 262.065 154 253.214 154H187.042C185.106 154 183.377 153.308 181.856 151.925C180.473 150.403 179.781 148.673 179.781 146.736V131.792C179.781 129.717 180.473 127.987 181.856 126.604C183.377 125.082 185.106 124.321 187.042 124.321H254.874C262.757 124.321 268.703 122.868 272.714 119.962C276.033 117.333 277.692 113.597 277.692 108.755C277.692 103.912 275.964 99.9686 272.506 96.9245C268.081 93.1887 261.65 91.3208 253.214 91.3208H187.042C185.106 91.3208 183.377 90.6289 181.856 89.2453C180.473 87.7233 179.781 85.9245 179.781 83.8491V69.5283C179.781 67.5912 180.473 65.9308 181.856 64.5472C183.377 63.0252 185.106 62.2641 187.042 62.2641H249.481C252.8 62.2641 255.565 61.9874 257.778 61.434C260.129 60.8805 261.996 60.1887 263.379 59.3585C264.9 58.3899 266.076 57.3522 266.905 56.2453C267.735 55.1384 268.427 54.1006 268.98 53.1321C269.948 51.195 270.432 48.912 270.432 46.283C270.432 43.7925 270.086 41.5094 269.395 39.434C268.841 37.7736 267.873 36.2516 266.49 34.8679C264.831 32.9308 262.757 31.6164 260.267 30.9245C257.778 30.0943 254.805 29.6792 251.347 29.6792H187.042C185.106 29.6792 183.377 28.9874 181.856 27.6038C180.473 26.0818 179.781 24.283 179.781 22.2076V7.26416C179.781 5.32705 180.473 3.66667 181.856 2.28303C183.377 0.761009 185.106 0 187.042 0H249.481C266.629 0 279.836 4.84277 289.101 14.5283C296.984 22.4151 300.925 32.3082 300.925 44.2076C300.925 56.9371 297.053 67.0377 289.309 74.5094Z",
    "M441.825 0C443.899 0 445.628 0.761009 447.01 2.28303C448.393 3.66667 449.085 5.32705 449.085 7.26416V22.2076C449.085 24.1447 448.393 25.8742 447.01 27.3962C445.628 28.7799 443.899 29.4717 441.825 29.4717H363.413V61.2264H432.697C434.772 61.2264 436.5 61.9874 437.883 63.5094C439.266 64.8931 439.958 66.5535 439.958 68.4906V83.6415C439.958 85.5786 439.266 87.3082 437.883 88.8302C436.5 90.2138 434.772 90.9057 432.697 90.9057H363.413V122.868H441.825C443.899 122.868 445.628 123.629 447.01 125.151C448.393 126.535 449.085 128.195 449.085 130.132V145.075C449.085 147.013 448.393 148.742 447.01 150.264C445.628 151.648 443.899 152.34 441.825 152.34H340.595C338.659 152.34 336.93 151.648 335.409 150.264C334.026 148.742 333.334 147.013 333.334 145.075V7.26416C333.334 5.32705 334.026 3.66667 335.409 2.28303C336.93 0.761009 338.659 0 340.595 0H441.825Z",
    "M608.545 141.547C609.236 142.654 609.582 143.83 609.582 145.075C609.582 147.013 608.891 148.742 607.508 150.264C606.125 151.648 604.396 152.34 602.322 152.34H585.104C583.583 152.34 582.2 151.994 580.956 151.302C579.849 150.472 579.02 149.365 578.466 147.981L563.323 112.283H504.618L489.683 147.981C489.13 149.365 488.231 150.472 486.986 151.302C485.88 151.994 484.566 152.34 483.045 152.34H465.827C463.2 152.34 461.195 151.233 459.812 149.019C458.152 146.943 457.945 144.73 459.189 142.377L517.687 4.3585C518.24 2.97485 519.07 1.93711 520.176 1.24529C521.421 0.415097 522.804 0 524.325 0H543.824C545.345 0 546.659 0.415097 547.766 1.24529C549.01 1.93711 549.909 2.97485 550.462 4.3585L608.545 141.547ZM516.857 83.434H551.292L534.075 42.1321L516.857 83.434Z",
    "M768.741 0C770.677 0 772.337 0.761009 773.719 2.28303C775.241 3.66667 776.001 5.32705 776.001 7.26416V145.075C776.001 147.013 775.241 148.742 773.719 150.264C772.337 151.648 770.677 152.34 768.741 152.34H753.183C751.247 152.34 749.518 151.648 747.997 150.264C746.614 148.742 745.923 147.013 745.923 145.075V52.0943L707.754 101.075C706.371 102.874 704.504 103.774 702.153 103.774C699.802 103.774 697.935 102.874 696.552 101.075L657.554 51.8868V145.075C657.554 147.013 656.793 148.742 655.272 150.264C653.889 151.648 652.23 152.34 650.294 152.34H634.736C632.8 152.34 631.071 151.648 629.55 150.264C628.167 148.742 627.475 147.013 627.475 145.075V7.26416C627.475 5.32705 628.167 3.66667 629.55 2.28303C631.071 0.761009 632.8 0 634.736 0H652.783C655.134 0 657.07 0.968553 658.591 2.90566L702.153 60.6038L744.885 2.90566C746.13 0.968553 748.066 0 750.694 0H768.741Z",
    "M76.0607 0L97.6815 54.4685L152.121 76.1006L97.6815 97.7328L76.0607 152.201L54.4399 97.7328L0 76.1006L54.4399 54.4685L76.0607 0Z",
] as const

const beamTraceOrder = [4, 0, 1, 2, 3] as const

// Звезда вкатывается справа налево (beam-star-roll), и каждая буква начинает
// проявляться, когда звезда проходит над её центром. Задержки посчитаны по той
// же кривой и длительности, что у beam-star-roll в style.css: поменяешь там,
// пересчитай здесь. Индексы как в beamLogoPaths: 0 B, 1 E, 2 A, 3 M.
const beamLetterDelayMs: Record<number, number> = { 3: 140, 2: 330, 1: 420, 0: 545 }

// Смена языка перемонтирует дерево роутов (см. App), и мастер стартует заново
// с шага выбора языка. Флаг переживает перемонтирование, чтобы вместо въезда
// шага был мягкий кроссфейд и карточки не дёргались на каждый клик.
let languageSwapPending = false

function LanguageStep() {
    const current = useLanguage()
    const intlLocale = getLanguageInfo(current).intlLocale
    const names = useMemo(() => {
        try {
            return new Intl.DisplayNames([intlLocale], { type: "language" })
        } catch {
            return null
        }
    }, [intlLocale])

    const pick = (code: LanguageCode) => {
        if (code === current) return
        languageSwapPending = true
        void setLanguage(code)
    }

    return (
        <div
            role="radiogroup"
            aria-label={t("onboarding.step.language.title")}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
            {LANGUAGES.map((lang) => {
                const selected = lang.code === current
                // Базовый код: «китайский», а не «китайский (Китай)».
                const raw = names?.of(lang.code.split("-")[0]) ?? ""
                const localized = raw.charAt(0).toLocaleUpperCase(intlLocale) + raw.slice(1)
                const showLocalized = localized !== "" && localized.toLocaleLowerCase() !== lang.nativeName.toLocaleLowerCase()

                return (
                    <button
                        key={lang.code}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => pick(lang.code)}
                        className={cn(
                            "group flex min-w-0 items-center gap-3 rounded-lg border px-3.5 py-3 text-start transition-all duration-200",
                            selected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border/55 bg-muted/10 hover:border-border hover:bg-muted/30"
                        )}
                    >
                        <CountryFlag
                            countryCode={lang.flag}
                            className="h-5 w-[1.75rem] shrink-0 rounded-[4px] shadow-[0_0_0_1px_rgb(0_0_0/0.1)] transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="min-w-0 flex-1">
                            <div lang={lang.code} className="truncate text-sm font-medium">
                                {lang.nativeName}
                            </div>
                            {showLocalized && (
                                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{localized}</div>
                            )}
                        </div>
                        <Check className={cn("h-4 w-4 shrink-0 text-primary transition-opacity", selected ? "opacity-100" : "opacity-0")} />
                    </button>
                )
            })}
        </div>
    )
}

const sleep = (duration: number) =>
    new Promise<void>((resolve) => {
        window.setTimeout(resolve, duration)
    })

function BeamFinaleLogo() {
    return (
        <div className="beam-finale-logo" aria-hidden="true">
            <svg
                className="beam-finale-trace-logo"
                viewBox="0 0 776 154"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="beamTraceGlow" x="-8%" y="-35%" width="116%" height="170%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0.78 0 0 0 0 1 0 0 0 0.6 0"
                            result="glow"
                        />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Переливающаяся обводка: градиент шире логотипа, reflect делает его
                      бесшовным, а сдвиг на две ширины за цикл гонит волну голубого
                      по буквам без скачка в конце. Волна бежит влево, вслед за звездой. SMIL, а не CSS: у SVG-градиентов
                      CSS-анимации стопов нет ни в WebView2, ни в WebKit. */}
                    <linearGradient
                        id="beamTraceGradient"
                        gradientUnits="userSpaceOnUse"
                        x1="0"
                        y1="0"
                        x2="776"
                        y2="0"
                        spreadMethod="reflect"
                    >
                        <stop offset="0" className="beam-trace-stop-base" />
                        <stop offset="0.42" className="beam-trace-stop-accent" />
                        <stop offset="0.5" className="beam-trace-stop-highlight" />
                        <stop offset="0.58" className="beam-trace-stop-accent" />
                        <stop offset="1" className="beam-trace-stop-base" />
                        <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            from="0 0"
                            to="-1552 0"
                            dur="1.8s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>
                </defs>

                <g filter="url(#beamTraceGlow)">
                    {beamTraceOrder.map((pathIndex) => (
                        <path
                            key={`line-${pathIndex}`}
                            d={beamLogoPaths[pathIndex]}
                            pathLength={1}
                            style={{ "--beam-delay": `${beamLetterDelayMs[pathIndex] ?? 0}ms` } as CSSProperties}
                            className={cn(
                                "beam-finale-line",
                                pathIndex === beamLogoPaths.length - 1 && "beam-finale-line-accent"
                            )}
                        />
                    ))}
                </g>
            </svg>

            {/* Обёртка шире логотипа: маска режет всё за пределами своего бокса,
              и без запаса свечение обрезалось бы прямоугольником. */}
            <div className="beam-finale-solid">
                <svg
                    className="beam-finale-solid-logo beam-finale-solid-vector"
                    viewBox="0 0 776 154"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {beamLogoPaths.map((path, index) => (
                        <path
                            key={`solid-${index}`}
                            d={path}
                            className={index === beamLogoPaths.length - 1 ? "beam-finale-fill-accent" : "beam-finale-fill-text"}
                        />
                    ))}
                </svg>

                <img
                    src="/beam.svg"
                    className="beam-finale-solid-logo beam-finale-solid-file"
                    alt=""
                    draggable={false}
                />
            </div>
        </div>
    )
}

function SettingToggle({
                           icon,
                           title,
                           description,
                           checked,
                           disabled,
                           onCheckedChange,
                       }: {
    icon: ReactNode
    title: string
    description: string
    checked: boolean
    disabled?: boolean
    onCheckedChange: (checked: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/20 px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background/70 text-primary">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium">{title}</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
        </div>
    )
}

export default function Onboarding() {
    const platform = getPlatform()
    const isMacOS = platform === "darwin"
    const platformKey = isMacOS ? "macos" : platform === "linux" ? "linux" : "windows"
    const navigate = useNavigate()
    const { theme, setTheme, isLoading: themeLoading } = useTheme()
    const { profiles, activeProfile, load } = useProfiles()
    const [stepIndex, setStepIndex] = useState(0)
    const [direction, setDirection] = useState<Direction>("forward")
    const [addProfileOpen, setAddProfileOpen] = useState(false)
    const [settings, setSettings] = useState<ApplicationSettings>(defaultApplicationSettings)
    const [settingsLoading, setSettingsLoading] = useState(true)
    const [finishing, setFinishing] = useState(false)
    const [completionPhase, setCompletionPhase] = useState<CompletionPhase>("idle")
    const [languageSwap] = useState(() => languageSwapPending)

    useEffect(() => {
        languageSwapPending = false
    }, [])

    const step = steps[stepIndex]
    const StepIcon = step.icon
    const isWelcome = step.id === "welcome"
    const isFirstStep = stepIndex === 0
    const isLastStep = stepIndex === steps.length - 1
    const hasProfiles = profiles.length > 0

    const visibleThemes = useMemo(() => {
        const themeMap = new Map(THEME_OPTIONS.map((option) => [option.value, option]))
        return compactThemeOrder
            .map((themeKey) => themeMap.get(themeKey))
            .filter((option): option is NonNullable<typeof option> => Boolean(option))
    }, [])

    useEffect(() => {
        void load()
        void loadApplicationSettings()
    }, [load])

    const loadApplicationSettings = async () => {
        try {
            const result = await GetApplicationSettings()
            if (result.success && result.data) {
                setSettings(result.data as ApplicationSettings)
            }
        } finally {
            setSettingsLoading(false)
        }
    }

    const setStep = (index: number) => {
        setDirection(index > stepIndex ? "forward" : "back")
        setStepIndex(index)
    }

    const goNext = () => {
        if (isLastStep) {
            void finishOnboarding()
            return
        }

        setDirection("forward")
        setStepIndex((current) => Math.min(current + 1, steps.length - 1))
    }

    const goBack = () => {
        setDirection("back")
        setStepIndex((current) => Math.max(current - 1, 0))
    }

    const finishOnboarding = async () => {
        setFinishing(true)
        let shouldStayFinishing = false

        try {
            const settingsResult = await SaveApplicationSettings(settings)
            if (!settingsResult.success) {
                toast.error(t("onboarding.toast.saveFailed"), {
                    description: settingsResult.error,
                })
                return
            }

            const onboardingResult = await SetOnboardingCompleted(true)
            if (!onboardingResult.success) {
                toast.error(t("onboarding.toast.finishFailed"))
                return
            }

            shouldStayFinishing = true
            await playCompletionTransition()
        } finally {
            if (!shouldStayFinishing) {
                setFinishing(false)
            }
        }
    }

    const playCompletionTransition = async () => {
        setCompletionPhase("wizardExit")
        await sleep(520)
        setCompletionPhase("empty")
        await sleep(220)
        // Длительности совпадают с beam-outline-draw и beam-solid-reveal в style.css.
        setCompletionPhase("trace")
        await sleep(1500)
        setCompletionPhase("solid")
        await sleep(1820)
        window.sessionStorage.setItem("beam:onboarding-main-enter", "1")
        navigate("/", { replace: true })
    }

    const skipOnboarding = async () => {
        setFinishing(true)
        try {
            await SetOnboardingCompleted(true)
            navigate("/", { replace: true })
        } finally {
            setFinishing(false)
        }
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
                <WindowControls />
                <TitleBar className="shrink-0" transparent />

                <main
                    className={cn(
                        "flex min-h-0 flex-1 items-center justify-center px-6 pb-8 pt-1",
                        completionPhase === "wizardExit" && "onboarding-wizard-exit",
                        completionPhase !== "idle" && completionPhase !== "wizardExit" && "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="w-full max-w-[640px]">
                        <section className="min-h-[386px] overflow-hidden">
                            <div
                                key={step.id}
                                className={cn(
                                    "onboarding-step",
                                    languageSwap && stepIndex === 0 && direction === "forward"
                                        ? "onboarding-step-swap"
                                        : direction === "forward"
                                          ? "onboarding-step-forward"
                                          : "onboarding-step-back"
                                )}
                            >
                                {isWelcome ? (
                                    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                                        <img
                                            src="/beamfull-dark.png"
                                            className="h-16 w-auto dark:hidden"
                                            alt="BEAM"
                                        />
                                        <img
                                            src="/beamfull.png"
                                            className="hidden h-16 w-auto dark:block"
                                            alt="BEAM"
                                        />

                                        <h1 className="mt-8 text-3xl font-semibold tracking-normal">
                                            {t("onboarding.welcome.title")}
                                        </h1>
                                        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                                            {t("onboarding.welcome.description")}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <StepIcon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs text-muted-foreground">{step.eyebrow}</div>
                                                <h1 className="mt-0.5 text-xl font-semibold">{step.title}</h1>
                                                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            {step.id === "language" && <LanguageStep />}

                                            {step.id === "theme" && (
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {visibleThemes.map((option) => {
                                                        const selected = theme === option.value

                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                disabled={themeLoading}
                                                                onClick={() => void setTheme(option.value as Theme)}
                                                                className={cn(
                                                                    "rounded-lg border p-2.5 text-start transition-all",
                                                                    selected
                                                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                                        : "border-border/55 bg-muted/10 hover:bg-muted/30"
                                                                )}
                                                            >
                                                                <div className="flex h-12 overflow-hidden rounded-md border border-border/35">
                                                                    <div
                                                                        className="w-2/3"
                                                                        style={{ backgroundColor: option.preview.background }}
                                                                    />
                                                                    <div
                                                                        className="w-1/3 border-s border-border/30"
                                                                        style={{ backgroundColor: option.preview.sidebar }}
                                                                    />
                                                                </div>

                                                                <div className="mt-2 flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <div className="text-sm font-medium">
                                                                            {option.label}
                                                                        </div>
                                                                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                            {option.value === "system"
                                                                                ? t(`onboarding.theme.followsSystem.${platformKey}`)
                                                                                : t("onboarding.theme.fixed")}
                                                                        </div>
                                                                    </div>
                                                                    {selected && <Check className="h-4 w-4 text-primary" />}
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {step.id === "profile" && (
                                                <div className="max-w-xl">
                                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                                        {t("onboarding.profile.intro")}
                                                    </p>

                                                    <div className="mt-5 rounded-lg bg-muted/20 px-4 py-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm font-medium">
                                                                    {hasProfiles ? t("onboarding.profile.found") : t("onboarding.profile.notAdded")}
                                                                </div>
                                                                <div className="mt-1 text-xs text-muted-foreground">
                                                                    {activeProfile?.name ?? (hasProfiles ? t("onboarding.profile.available", { count: profiles.length }) : t("onboarding.profile.canSkip"))}
                                                                </div>
                                                            </div>

                                                            <Button
                                                                type="button"
                                                                variant={hasProfiles ? "outline" : "default"}
                                                                onClick={() => setAddProfileOpen(true)}
                                                            >
                                                                <Upload className="h-4 w-4" />
                                                                {hasProfiles ? t("onboarding.profile.addMore") : t("onboarding.profile.import")}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {step.id === "behavior" && (
                                                <div className="space-y-3">
                                                    <SettingToggle
                                                        icon={<Play className="h-4 w-4" />}
                                                        title={t(`onboarding.behavior.autostart.title.${platformKey}`)}
                                                        description={isMacOS
                                                            ? t("onboarding.behavior.autostart.unavailableMacos")
                                                            : t("onboarding.behavior.autostart.description")}
                                                        checked={!isMacOS && settings.launchOnStartup}
                                                        disabled={settingsLoading || isMacOS}
                                                        onCheckedChange={(checked) =>
                                                            setSettings((current) => ({
                                                                ...current,
                                                                launchOnStartup: checked,
                                                            }))
                                                        }
                                                    />

                                                    <SettingToggle
                                                        icon={<ShieldCheck className="h-4 w-4" />}
                                                        title={t("onboarding.behavior.tray.title")}
                                                        description={isMacOS
                                                            ? t("onboarding.behavior.tray.descriptionMacos")
                                                            : t("onboarding.behavior.tray.description")}
                                                        checked={!isMacOS && settings.minimizeToTray}
                                                        disabled={settingsLoading || isMacOS}
                                                        onCheckedChange={(checked) =>
                                                            setSettings((current) => ({
                                                                ...current,
                                                                minimizeToTray: checked,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="mt-6">
                            <div className="flex items-center justify-center gap-1.5">
                                {steps.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setStep(index)}
                                        aria-label={item.title}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-300",
                                            index === stepIndex
                                                ? "w-8 bg-primary"
                                                : index < stepIndex
                                                    ? "w-4 bg-primary/60"
                                                    : "w-4 bg-muted hover:bg-muted-foreground/30"
                                        )}
                                    />
                                ))}
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-3">
                                {isFirstStep ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={skipOnboarding}
                                        disabled={finishing}
                                        className="text-muted-foreground"
                                    >
                                        {t("onboarding.nav.skip")}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={goBack}
                                        disabled={finishing}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {t("onboarding.nav.back")}
                                    </Button>
                                )}

                                <Button type="button" onClick={goNext} disabled={finishing}>
                                    {isLastStep ? (finishing ? t("onboarding.nav.finishing") : t("onboarding.nav.finish")) : t("onboarding.nav.next")}
                                    {!isLastStep && <ChevronRight className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>

                <AddModal open={addProfileOpen} onOpenChange={setAddProfileOpen} />

                {(completionPhase === "trace" || completionPhase === "solid") && (
                    <div className={cn("onboarding-finale", `onboarding-finale-${completionPhase}`)}>
                        <BeamFinaleLogo />
                    </div>
                )}
            </div>
        </SidebarProvider>
    )
}
