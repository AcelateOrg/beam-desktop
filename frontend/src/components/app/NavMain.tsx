"use client"

import { NavLink } from "react-router-dom"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconType } from "react-icons";
import { cn } from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {LuFlame} from "react-icons/lu";

export function NavMain({
                            items,
                        }: {
    items: {
        title: string
        url: string
        icon?: IconType,
        isNew?: boolean
    }[]
}) {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-1">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <NavLink to={item.url}>
                                {({ isActive }) => (
                                    <SidebarMenuButton
                                        className={cn(
                                            "p-3 px-2.5 transition-all duration-200 ease-out active:scale-[0.99]",
                                            isActive
                                                ? "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary active:bg-primary/15 active:text-primary"
                                                : "text-muted-foreground hover:bg-primary/5 hover:text-primary active:bg-primary/10 active:text-primary"
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                        tooltip={item.title}
                                    >
                                        {item.icon && <item.icon className="w-4 h-4" />}
                                        <span className="text-sm">{item.title}</span>
                                        {item.isNew ? (
                                            <Badge variant={"secondary"} className={"bg-blue-500/60 gap-1"}>
                                                <LuFlame className="w-3 h-3"/>
                                                <span className="text-[10px]">NEW</span>
                                            </Badge>
                                        ) : null}
                                    </SidebarMenuButton>
                                )}
                            </NavLink>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
