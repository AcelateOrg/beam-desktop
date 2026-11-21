import { Position, type NodeProps } from "@xyflow/react"
import { GitMerge } from "lucide-react"
import type { LogicNodeData } from "@/lib/protun/codec"
import { useNodeConflicts } from "@/lib/protun/conflicts"
import { PriorityChip } from "@/components/protun/RuleOrder"
import { NodeCardDivider, NodeCardHeader, NodeCardNote, NodeCardShell, NodeHandle } from "./NodeShell"
import { t } from "@/i18n"

export const LOGIC_META = {
    and: {
        get label() {
            return t("protun.logic.and.label")
        },
        get description() {
            return t("protun.logic.and.description")
        },
        get note() {
            return t("protun.logic.and.note")
        },
        accentBar: "bg-chart-4",
        accentText: "text-chart-4",
    },
    or: {
        get label() {
            return t("protun.logic.or.label")
        },
        get description() {
            return t("protun.logic.or.description")
        },
        get note() {
            return t("protun.logic.or.note")
        },
        accentBar: "bg-chart-5",
        accentText: "text-chart-5",
    },
} as const

export function LogicNode({ id, data, selected }: NodeProps) {
    const nodeData = data as LogicNodeData
    const { onPath } = useNodeConflicts(id)
    const op = nodeData.op === "and" ? "and" : "or"
    const meta = LOGIC_META[op]

    return (
        <>
            <NodeHandle type="target" position={Position.Left} />
            <NodeHandle type="source" position={Position.Right} />

            <NodeCardShell selected={selected} accentBar={meta.accentBar} conflict={onPath ? "path" : undefined}>
                <NodeCardHeader
                    icon={GitMerge}
                    iconClassName={meta.accentText}
                    title={meta.label}
                    description={meta.description}
                    actions={<PriorityChip nodeId={id} />}
                />
                <NodeCardDivider />
                <NodeCardNote dotClassName={meta.accentBar}>{meta.note}</NodeCardNote>
            </NodeCardShell>
        </>
    )
}
