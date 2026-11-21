import { useState } from "react"

import { useBackdrop } from "@/hooks/useBackdrop"
import { cn } from "@/lib/utils"
import { reportBackdropImageError } from "@/themes/backdrop"

/** Картинка под интерфейсом: размытие + подложка цветом фона темы.
 *  Поверхности в это время полупрозрачные (см. setBackdropActive в controller). */
export default function BackdropLayer() {
    const { imageUrl, config } = useBackdrop()
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null)

    if (!imageUrl) return null

    const blur = config.blur
    // Отрицательное затемнение — осветление тёмных фото (до ×2 яркости).
    const brightness = config.dim < 0 ? 1 - config.dim / 100 : 1
    const filters = [
        blur > 0 ? `blur(${blur}px)` : "",
        brightness !== 1 ? `brightness(${brightness})` : "",
    ].filter(Boolean).join(" ")

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <img
                key={imageUrl}
                src={imageUrl}
                alt=""
                draggable={false}
                decoding="async"
                onLoad={() => setLoadedUrl(imageUrl)}
                onError={() => reportBackdropImageError(imageUrl)}
                className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                    loadedUrl === imageUrl ? "opacity-100" : "opacity-0",
                )}
                style={{
                    filter: filters || undefined,
                    transform: blur > 0 ? `scale(${1 + Math.min(0.15, blur / 160)})` : undefined,
                }}
            />
            <div
                className="absolute inset-0 bg-background transition-opacity duration-300"
                style={{ opacity: Math.max(0, config.dim) / 100 }}
            />
        </div>
    )
}
