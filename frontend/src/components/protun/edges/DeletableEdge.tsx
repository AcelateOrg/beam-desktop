import { createContext, useContext, useState, type CSSProperties } from "react"
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from "@xyflow/react"
import { Scissors } from "lucide-react"
import { useEdgeInConflict } from "@/lib/protun/conflicts"
import { t } from "@/i18n"

/** Which edge is under the cursor and whether the canvas is editable. */
export const EdgeUiContext = createContext<{
    hoveredId: string | null
    locked: boolean
    hover: (id: string) => void
    unhover: () => void
}>({
    hoveredId: null,
    locked: false,
    hover: () => {},
    unhover: () => {},
})

/**
 * Bezier edge with a remove button in the middle: shown on hover or when the
 * edge is selected. Lets the user cut exactly one link between blocks.
 */
export function DeletableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    selected,
    interactionWidth,
}: EdgeProps) {
    const { hoveredId, locked, hover, unhover } = useContext(EdgeUiContext)
    const inConflict = useEdgeInConflict(id)
    const { setEdges } = useReactFlow()
    const [path, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    })

    const active = !locked && (selected || hoveredId === id)
    // Курсор на ножницах: связь краснеет и «рвётся» — видно, что именно режем.
    const [cutting, setCutting] = useState(false)
    const baseWidth = (style?.strokeWidth as number) ?? 1.5
    // Связь конфликтующего правила красная: видно, куда уходит спорный трафик.
    const baseStyle: CSSProperties | undefined = inConflict
        ? {
              ...style,
              stroke: "var(--destructive)",
              filter: "drop-shadow(0 0 3px color-mix(in oklab, var(--destructive) 60%, transparent))",
          }
        : style
    const edgeStyle: CSSProperties | undefined = cutting
        ? {
              ...style,
              stroke: "var(--destructive)",
              strokeWidth: baseWidth + 1.5,
              strokeDasharray: "6 5",
              animation: "none",
              filter: "drop-shadow(0 0 4px color-mix(in oklab, var(--destructive) 70%, transparent))",
              transition: "stroke 120ms, stroke-width 120ms",
          }
        : selected
          ? { ...baseStyle, strokeWidth: baseWidth + 1.5 }
          : baseStyle

    return (
        <>
            <BaseEdge id={id} path={path} style={edgeStyle} markerEnd={markerEnd} interactionWidth={interactionWidth ?? 24} />
            {active && (
                <EdgeLabelRenderer>
                    <button
                        type="button"
                        title={t("protun.canvas.cutEdge")}
                        aria-label={t("protun.canvas.cutEdge")}
                        className="protun-cut-btn nodrag nopan pointer-events-auto absolute flex h-7 w-7 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground shadow-md transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-destructive hover:bg-destructive hover:text-white hover:shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_25%,transparent)]"
                        style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
                        onMouseEnter={() => {
                            hover(id)
                            setCutting(true)
                        }}
                        onMouseLeave={() => {
                            setCutting(false)
                            unhover()
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            setCutting(false)
                            unhover()
                            setEdges((eds) => eds.filter((edge) => edge.id !== id))
                        }}
                    >
                        <Scissors className="protun-cut-icon h-3.5 w-3.5" />
                    </button>
                </EdgeLabelRenderer>
            )}
        </>
    )
}
