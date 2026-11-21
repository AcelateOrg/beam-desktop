import { createPortal } from "react-dom"
import { Copy, GitMerge, StickyNote, Trash2, type LucideIcon } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { DESTINATION_ADD_OPTIONS, NODE_META, SOURCE_ADD_OPTIONS, type ProTunRuleKind } from "@/lib/protun/meta"
import type { ProTunLogicOp } from "@/lib/protun/types"
import { t } from "@/i18n"

export type MenuPosition = { x: number; y: number }
export type NodeContextMenuState = MenuPosition & { targetIds: string[] }

type AddMenuCallbacks = {
    at?: MenuPosition
    hasOtherNode: boolean
    onAddRule: (kind: ProTunRuleKind, at?: MenuPosition) => void
    onAddLogic: (op: ProTunLogicOp, at?: MenuPosition) => void
    onAddComment: (at?: MenuPosition) => void
}

// The add menu content scrolls inside its own ScrollArea: the dropdown itself
// must not scroll (that is where the native scrollbar came from on small
// windows), it is only capped to the space Radix reports as available.
export const ADD_MENU_CONTENT_CLASS = "w-60 overflow-hidden p-0"

function AddMenuItem({
    icon: Icon,
    iconClassName,
    label,
    disabled,
    onSelect,
}: {
    icon: LucideIcon
    iconClassName: string
    label: string
    disabled?: boolean
    onSelect: () => void
}) {
    return (
        <DropdownMenuItem onSelect={onSelect} disabled={disabled} className="cursor-pointer gap-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
            </div>
            <span className="text-sm">{label}</span>
        </DropdownMenuItem>
    )
}

function AddMenuGroupLabel({ children }: { children: React.ReactNode }) {
    return (
        <DropdownMenuLabel className="py-1.5 text-[11px] font-normal text-muted-foreground">
            {children}
        </DropdownMenuLabel>
    )
}

export function AddNodeMenuItems({ at, hasOtherNode, onAddRule, onAddLogic, onAddComment }: AddMenuCallbacks) {
    const ruleItem = (kind: ProTunRuleKind, disabled?: boolean, suffix = "") => {
        const meta = NODE_META[kind]
        return (
            <AddMenuItem
                key={kind}
                icon={meta.icon}
                iconClassName={meta.accentText}
                label={meta.label + suffix}
                disabled={disabled}
                onSelect={() => onAddRule(kind, at)}
            />
        )
    }

    return (
        <ScrollArea viewportClassName="max-h-[min(30rem,var(--radix-dropdown-menu-content-available-height))]">
            <div className="p-1">
                <AddMenuGroupLabel>{t("protun.palette.group.sources")}</AddMenuGroupLabel>
                {SOURCE_ADD_OPTIONS.map((kind) => ruleItem(kind))}

                <DropdownMenuSeparator />
                <AddMenuGroupLabel>{t("protun.palette.group.fallback")}</AddMenuGroupLabel>
                {ruleItem("other", hasOtherNode, hasOtherNode ? t("protun.palette.alreadyOnCanvasSuffix") : "")}

                <DropdownMenuSeparator />
                <AddMenuGroupLabel>{t("protun.palette.group.destinations")}</AddMenuGroupLabel>
                {DESTINATION_ADD_OPTIONS.map((kind) => ruleItem(kind))}

                <DropdownMenuSeparator />
                <AddMenuGroupLabel>{t("protun.palette.group.logic")}</AddMenuGroupLabel>
                <AddMenuItem icon={GitMerge} iconClassName="text-muted-foreground" label={t("protun.logic.and.label")} onSelect={() => onAddLogic("and", at)} />
                <AddMenuItem icon={GitMerge} iconClassName="text-muted-foreground" label={t("protun.logic.or.label")} onSelect={() => onAddLogic("or", at)} />

                <DropdownMenuSeparator />
                <AddMenuItem icon={StickyNote} iconClassName="text-muted-foreground" label={t("protun.comment.title")} onSelect={() => onAddComment(at)} />
            </div>
        </ScrollArea>
    )
}

export function ProTunContextMenu({
    menu,
    onClose,
    onDuplicate,
    onDelete,
}: {
    menu: NodeContextMenuState | null
    onClose: () => void
    onDuplicate: (ids: string[]) => void
    onDelete: (ids: string[]) => void
}) {
    if (!menu) return null
    return createPortal(
        <DropdownMenu open onOpenChange={(open) => !open && onClose()}>
            <DropdownMenuTrigger asChild>
                <div style={{ position: "fixed", left: menu.x, top: menu.y, width: 0, height: 0 }} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-48">
                <DropdownMenuItem onSelect={() => onDuplicate(menu.targetIds)} className="cursor-pointer gap-2.5">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("protun.contextMenu.duplicate")}
                    {menu.targetIds.length > 1 ? t("protun.contextMenu.countSuffix", { count: menu.targetIds.length }) : ""}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDelete(menu.targetIds)}
                    className="cursor-pointer gap-2.5"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("protun.contextMenu.delete")}
                    {menu.targetIds.length > 1 ? t("protun.contextMenu.countSuffix", { count: menu.targetIds.length }) : ""}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>,
        document.body
    )
}

export function ProTunAddMenu({
    menu,
    onClose,
    ...callbacks
}: {
    menu: MenuPosition | null
    onClose: () => void
} & Omit<AddMenuCallbacks, "at">) {
    if (!menu) return null
    return createPortal(
        <DropdownMenu open onOpenChange={(open) => !open && onClose()}>
            <DropdownMenuTrigger asChild>
                <div style={{ position: "fixed", left: menu.x, top: menu.y, width: 0, height: 0 }} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className={ADD_MENU_CONTENT_CLASS}>
                <AddNodeMenuItems {...callbacks} at={menu} />
            </DropdownMenuContent>
        </DropdownMenu>,
        document.body
    )
}
