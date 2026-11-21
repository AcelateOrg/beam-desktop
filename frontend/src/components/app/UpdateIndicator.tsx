import { useState } from "react"
import { LuDownload } from "react-icons/lu"

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useUpdate } from "@/hooks/useUpdate"
import UpdateModal from "@/components/app/UpdateModal"
import { t } from "@/i18n"

export default function UpdateIndicator() {
    const { available } = useUpdate()
    const [open, setOpen] = useState(false)

    if (!available) {
        return null
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip={t("layout.update.available")}
                    onClick={() => setOpen(true)}
                    className="relative"
                >
                    <LuDownload className="text-amber-500" />
                    <span>{t("layout.update.available")}</span>
                    <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                </SidebarMenuButton>
            </SidebarMenuItem>

            <UpdateModal open={open} onOpenChange={setOpen} />
        </SidebarMenu>
    )
}
