import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

const EDGE_OFFSET = 16
// Clears the bottom navigation bar the narrow layout shows instead of the sidebar.
const BOTTOM_NAV_OFFSET = 88

// Sonner only drives the queue, stacking and swipe. Its own look is switched
// off (`unstyled`) and every colour comes from the app theme tokens in
// style.css (.beam-toast), so toasts follow the theme, accent, radius and font
// the user picked instead of sonner's light/dark palette.
const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
    const narrow = useIsMobile()
    const offset = { bottom: narrow ? BOTTOM_NAV_OFFSET : EDGE_OFFSET }

    return (
        <Sonner
            position="bottom-center"
            closeButton
            gap={10}
            visibleToasts={4}
            offset={offset}
            mobileOffset={offset}
            icons={{
                success: <CircleCheck />,
                info: <Info />,
                warning: <TriangleAlert />,
                error: <CircleAlert />,
                loading: <Loader2 className="animate-spin" />,
                close: <X />,
            }}
            toastOptions={{
                duration: 4500,
                ...toastOptions,
                unstyled: true,
                classNames: { toast: "beam-toast", ...toastOptions?.classNames },
            }}
            {...props}
        />
    )
}

export { Toaster }
