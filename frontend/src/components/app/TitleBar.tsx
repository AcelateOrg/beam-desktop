// В узком окне навигация — панель снизу (BottomNav), кнопка сайдбара не нужна.
export default function TitleBar({ className, transparent }: { className?: string; transparent?: boolean }) {
    return (
        <div
            className={`h-[var(--titlebar-height)] ${transparent ? "bg-transparent" : "bg-sidebar"} flex items-center px-2 select-none ${className}`}
            style={{ "--wails-draggable": "drag" } as React.CSSProperties}
        />
    )
}
