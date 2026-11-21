import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Item, ItemActions, ItemContent } from "@/components/ui/item"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    BarChart3,
    Bug,
    ChevronRight,
    Info,
    Monitor,
    Palette,
    ScrollText,
    Settings2,
    Wifi,
} from "lucide-react"
import { GetDeveloperMode } from "@wailsjs/go/handlers/SettingsHandler"
import { isWailsNative } from "@/lib/wails-safe"
import { t } from "@/i18n"

interface SettingItem {
    icon: React.ElementType
    key: "appearance" | "app" | "connection" | "analytics" | "logs" | "developer" | "about"
    path: string
    badge?: string
    badgeVariant?: "default" | "secondary" | "destructive"
    devOnly?: boolean
}

const ALL_ITEMS: SettingItem[] = [
    {
        icon: Palette,
        key: "appearance",
        path: "/settings/appearance",
    },
    {
        icon: Monitor,
        key: "app",
        path: "/settings/app",
    },
    {
        icon: Wifi,
        key: "connection",
        path: "/settings/connection",
    },
    {
        icon: BarChart3,
        key: "analytics",
        path: "/settings/analytics",
    },
    {
        icon: ScrollText,
        key: "logs",
        path: "/settings/logs",
    },
    {
        icon: Bug,
        key: "developer",
        path: "/settings/developer",
        devOnly: true,
        badge: "DEV",
        badgeVariant: "destructive",
    },
    {
        icon: Info,
        key: "about",
        path: "/settings/about",
    },
]

export default function SettingsPage() {
    const navigate = useNavigate()
    const [devMode, setDevMode] = useState(false)

    useEffect(() => {
        if (!isWailsNative()) return
        GetDeveloperMode()
            .then((res) => { if (res.success) setDevMode(res.data ?? false) })
            .catch(() => {})
    }, [])

    const visibleItems = ALL_ITEMS.filter(item => !item.devOnly || devMode)

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <PageHeader
                icon={<Settings2 className="h-4 w-4" />}
                title={t("settings.menu.title")}
                showBackButton={false}
            />

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-2 p-3 stagger-list">
                    {visibleItems.map((item) => (
                        <Item
                            key={item.path}
                            variant="default"
                            className="animate-list-item cursor-pointer p-3 transition-colors bg-card/50 hover:bg-accent/50"
                            onClick={() => navigate(item.path)}
                        >
                            <div className="flex flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <ItemContent className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{t(`settings.menu.${item.key}.title`)}</span>
                                        {item.badge && (
                                            <Badge
                                                variant={item.badgeVariant || "secondary"}
                                                className="h-4 px-1.5 text-[9px]"
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {t(`settings.menu.${item.key}.description`)}
                                    </span>
                                </ItemContent>
                            </div>
                            <ItemActions>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </ItemActions>
                        </Item>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}