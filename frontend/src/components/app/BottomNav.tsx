import { NavLink } from "react-router-dom"
import { useNavItems } from "@/components/app/AppSidebar"
import { cn } from "@/lib/utils"

// Нижняя панель в стиле Material 3 Navigation Bar: у активного пункта
// иконка сидит в пилюле-индикаторе, подпись — под ней.
export default function BottomNav() {
    const items = useNavItems()

    return (
        <nav className="app-backdrop-clear flex shrink-0 items-stretch gap-0.5 bg-sidebar px-3 pb-3 pt-2.5">
            {items.map((item) => (
                <NavLink key={item.url} to={item.url} className="group min-w-0 flex-1" title={item.title}>
                    {({ isActive }) => (
                        <span
                            className="flex h-full flex-col items-center justify-center gap-1.5"
                            aria-current={isActive ? "page" : undefined}
                        >
                            <span
                                className={cn(
                                    "relative flex h-8 items-center justify-center overflow-hidden rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                                    isActive
                                        ? "w-14 bg-primary/15 text-primary"
                                        : "w-8 text-muted-foreground group-hover:w-14 group-hover:bg-foreground/[0.06] group-hover:text-foreground group-active:bg-foreground/10"
                                )}
                            >
                                <item.icon className="h-[18px] w-[18px]" />
                            </span>
                            <span
                                className={cn(
                                    "max-w-full truncate px-0.5 text-[11px] leading-tight transition-colors",
                                    isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground group-hover:text-foreground"
                                )}
                            >
                                {item.short}
                            </span>
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}
