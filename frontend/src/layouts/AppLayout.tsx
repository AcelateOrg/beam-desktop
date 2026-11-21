import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import BottomNav from "@/components/app/BottomNav";
import AppSidebar from "@/components/app/AppSidebar";
import BackdropLayer from "@/components/app/BackdropLayer";
import { Outlet, useLocation } from "react-router-dom";
import TitleBar from "@/components/app/TitleBar";
import WindowControls from "@/components/app/WindowsControls";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PAGE_ENTER_WILL_CHANGE_FALLBACK_MS = 320

// В узком окне сайдбар прячется, а навигация становится панелью снизу.
function MobileBottomNav() {
    const { isMobile } = useSidebar()
    return isMobile ? <BottomNav /> : null
}

// Панель содержимого. В узком окне снизу есть нижняя навигация, поэтому
// скруглены все четыре угла — панель визуально отделена от неё.
function ContentSurface({ children }: { children: React.ReactNode }) {
    const { isMobile } = useSidebar()
    return (
        <div
            className={cn(
                "app-backdrop-surface h-full overflow-hidden isolate bg-background",
                isMobile
                    ? "mx-2 rounded-[var(--layout-corner-radius)] [clip-path:inset(0_round_var(--layout-corner-radius))]"
                    : "rounded-t-[var(--layout-corner-radius)] [clip-path:inset(0_round_var(--layout-corner-radius)_var(--layout-corner-radius)_0_0)]"
            )}
        >
            {children}
        </div>
    )
}

export default function AppLayout() {
    const location = useLocation()
    const [onboardingEnter, setOnboardingEnter] = useState(false)
    const pageContentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const node = pageContentRef.current
        if (!node) return
        node.style.willChange = "opacity, transform"
        const release = () => {
            node.style.willChange = "auto"
        }
        node.addEventListener("animationend", release)
        const fallback = window.setTimeout(release, PAGE_ENTER_WILL_CHANGE_FALLBACK_MS)
        return () => {
            node.removeEventListener("animationend", release)
            window.clearTimeout(fallback)
        }
    }, [location.pathname])

    useEffect(() => {
        if (window.sessionStorage.getItem("beam:onboarding-main-enter") !== "1") {
            return
        }

        window.sessionStorage.removeItem("beam:onboarding-main-enter")
        setOnboardingEnter(true)

        const timer = window.setTimeout(() => {
            setOnboardingEnter(false)
        }, 900)

        return () => window.clearTimeout(timer)
    }, [])

    return (
        <SidebarProvider>
            <BackdropLayer />
            <WindowControls />
            <div className={cn("flex h-screen w-full", onboardingEnter && "app-layout-onboarding-enter")}>
                <AppSidebar />
                <div className="flex flex-col flex-1 h-screen overflow-hidden">
                    <TitleBar className="app-backdrop-clear w-full flex-shrink-0 bg-sidebar" />
                    {/* Угол формирует сама панель: подложка цвета сайдбара + скруглённая
                        панель с обрезкой содержимого. Раньше углы рисовали SVG-маски
                        поверх контента — на дробном DPI и при композитных слоях
                        страницы (анимации, will-change) они терялись. */}
                    <SidebarInset className="app-backdrop-clear relative flex-1 overflow-hidden bg-sidebar">
                        <ContentSurface>
                            <div className="page-transition-shell">
                                <div
                                    key={location.pathname}
                                    ref={pageContentRef}
                                    className="page-transition-content"
                                >
                                    <Outlet />
                                </div>
                            </div>
                        </ContentSurface>
                    </SidebarInset>
                    <MobileBottomNav />
                </div>
            </div>
        </SidebarProvider>
    );
}
