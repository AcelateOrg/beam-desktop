import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar"
import { NavMain } from "@/components/app/NavMain"
import UpdateIndicator from "@/components/app/UpdateIndicator"
import {LuCog, LuScrollText, LuWifi, LuServer, LuUsers, LuPlug, LuSplit} from "react-icons/lu"
import { getPlatform } from "@/lib/platform"
import { useProfiles } from "@/hooks/useProfiles"
import { t } from "@/i18n"

// Пункты навигации — общие для сайдбара и нижней панели узкого окна.
export function useNavItems() {
    const { profiles } = useProfiles()
    return ([
        { key: "home",     url: "/",         icon: LuWifi,   isEnabled: true },
        { key: "profiles", url: "/profiles", icon: LuUsers,  isEnabled: true },
        { key: "nodes",    url: "/nodes",    icon: LuServer, isEnabled: profiles.length > 0 },
        { key: "routing",  url: "/split",    icon: LuSplit,  isEnabled: true },
        { key: "settings", url: "/settings", icon: LuCog,    isEnabled: true },
    ] as const)
        .filter((item) => item.isEnabled)
        .map((item) => ({
            ...item,
            title: t(`layout.nav.${item.key}.title`),
            short: t(`layout.nav.${item.key}.short`),
        }))
}

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const isMacOS = getPlatform() === 'darwin'
    const navItems = useNavItems()

    return (
        <Sidebar collapsible="icon" variant="inset" {...props}>
            <SidebarHeader className={isMacOS ? "p-0" : "p-3"}>
                {isMacOS ? (
                    <div
                        className="h-[var(--titlebar-height)] w-full"
                        style={{ "--wails-draggable": "drag" } as React.CSSProperties}
                    />
                ) : (
                    <>
                        <img
                            className="w-36 dark:hidden"
                            src="/beamfull-dark.png"
                            alt="Beam"
                        />
                        <img
                            className="w-36 hidden dark:block"
                            src="/beamfull.png"
                            alt="Beam"
                        />
                    </>
                )}
            </SidebarHeader>
            <SidebarContent className={isMacOS ? "-mt-2" : undefined}>
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <UpdateIndicator />
            </SidebarFooter>
        </Sidebar>
    )
}
