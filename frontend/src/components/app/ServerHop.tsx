import { Check, Globe2 } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import { useShallow } from "zustand/react/shallow"

import { cn } from "@/lib/utils"
import { labelOf, useServerSwitch, type ServerLabel } from "@/stores/serverSwitchStore"
import { useVPNStore } from "@/stores/vpnStore"

const EMPTY: ServerLabel = { countryCode: null, name: "" }

function Flag({ code, className }: { code: string | null; className?: string }) {
    return (
        <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]", className)}>
            {code ? (
                <ReactCountryFlag
                    countryCode={code}
                    svg
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    className="absolute inset-0"
                />
            ) : (
                <Globe2 className="h-3/4 w-3/4 text-muted-foreground" />
            )}
        </span>
    )
}

/** «🇫🇮 ···→ 🇩🇪 Германия» — видно, откуда и куда переключаемся.
 *  Показывается только на время смены и пару секунд после. */
export default function ServerHop() {
    const { phase, from } = useServerSwitch()
    const to = useVPNStore(useShallow(s => labelOf(s) ?? EMPTY))

    const visible = phase !== "idle"
    const done = phase === "switched"

    return (
        <div
            aria-live="polite"
            className={cn(
                "grid transition-all duration-300 ease-out",
                visible ? "grid-rows-[1fr] opacity-100" : "-mt-3 grid-rows-[0fr] opacity-0"
            )}
        >
            <div className="overflow-hidden">
                <div className="flex items-center gap-2 rounded-full bg-white/[0.05] py-1 ps-1 pe-3 backdrop-blur-md">
                    {from && (
                        <>
                            <Flag
                                code={from.countryCode}
                                className={cn("h-5 w-5 transition-all duration-500", done && "scale-75 opacity-40 grayscale")}
                            />
                            <span className="relative flex h-1 w-8 items-center overflow-hidden rounded-full bg-white/[0.08]">
                                <span
                                    className={cn(
                                        "absolute inset-y-0 start-0 rounded-full bg-sidebar-primary",
                                        done ? "w-full transition-[width] duration-300" : "w-1/3 animate-[beam-hop_0.9s_ease-in-out_infinite]"
                                    )}
                                />
                            </span>
                        </>
                    )}
                    <Flag
                        code={to.countryCode}
                        className={cn(
                            "h-5 w-5 ring-2 transition-all duration-500",
                            done ? "ring-sidebar-primary" : "ring-transparent"
                        )}
                    />
                    <span className="max-w-[150px] truncate text-xs font-semibold text-foreground/90">
                        {to.name}
                    </span>
                    <Check
                        className={cn(
                            "h-3.5 w-3.5 text-sidebar-primary transition-all duration-300",
                            done ? "scale-100 opacity-100" : "-ms-2 w-0 scale-50 opacity-0"
                        )}
                    />
                </div>
            </div>
            <style>{`
                @keyframes beam-hop {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    )
}
