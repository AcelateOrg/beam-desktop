import { useEffect, useState } from "react"
import { NodeResizer, type NodeProps } from "@xyflow/react"
import { StickyNote } from "lucide-react"
import { Direction } from "radix-ui"
import { cn } from "@/lib/utils"
import type { CommentNodeData } from "@/lib/protun/codec"
import { t } from "@/i18n"

export const PROTUN_COMMENT_TEXT_EVENT = "protun-node-comment-text"

const MIN_WIDTH = 160
const MIN_HEIGHT = 90

export function CommentNode({ id, data, selected }: NodeProps) {
    const nodeData = data as CommentNodeData
    const [text, setText] = useState(nodeData.text ?? "")
    const dir = Direction.useDirection()

    useEffect(() => {
        setText(nodeData.text ?? "")
    }, [nodeData.text])

    const commit = (value: string) => {
        window.dispatchEvent(
            new CustomEvent(PROTUN_COMMENT_TEXT_EVENT, { detail: { nodeId: id, text: value } })
        )
    }

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-2 !border-background !bg-primary"
                lineClassName="!border-primary"
            />
            <div
                dir={dir}
                className={cn(
                    "flex h-full min-h-[90px] w-full min-w-[160px] flex-col gap-1.5 rounded-lg border border-dashed p-3 transition-colors",
                    "bg-muted",
                    selected ? "border-primary" : "border-border"
                )}
            >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <StickyNote className="h-3 w-3" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">{t("protun.comment.title")}</span>
                </div>
                <textarea
                    data-nodrag
                    data-nopan
                    value={text}
                    placeholder={t("protun.comment.placeholder")}
                    className={cn(
                        "min-h-0 flex-1 resize-none bg-transparent text-xs leading-relaxed text-foreground",
                        "placeholder:text-muted-foreground focus:outline-none"
                    )}
                    style={{ pointerEvents: "all" }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={(e) => commit(e.target.value)}
                />
            </div>
        </>
    )
}
