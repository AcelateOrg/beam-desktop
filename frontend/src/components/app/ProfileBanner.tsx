import { useEffect, useState } from "react"
import { Direction } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Арт провайдера фоном карточки профиля (см. beam-bridge/docs/banner-guide.md).
 *
 * Картинка всегда вписана по высоте карточки и прижата к правому краю: сверху
 * и снизу ничего не обрезается, масштаб не зависит от ширины окна. На широкой
 * карточке слева просто больше цвета темы, на узкой — левая часть арта уходит
 * за край. Левая половина фрейма плавно исчезает маской, поэтому шва нет.
 * В RTL всё зеркально: арт прижат к левому краю (конец строки), а маска и
 * подложка гаснут в сторону текста справа. Саму картинку не отражаем, на ней
 * бывает текст.
 * PNG/JPG/WebP/SVG — через <img>, скрипты в SVG в таком режиме не выполняются.
 */
const fadeMask = (side: "right" | "left") =>
    `linear-gradient(to ${side}, transparent 0%, rgba(0,0,0,0.35) 25%, #000 50%)`

export function ProfileBanner({ src, className }: { src: string; className?: string }) {
    const [loaded, setLoaded] = useState(false)
    const [failed, setFailed] = useState(false)
    const mask = fadeMask(Direction.useDirection() === "rtl" ? "left" : "right")
    // Ссылка меняется, когда картинка легла в локальный кэш или обновилась.
    useEffect(() => setFailed(false), [src])
    if (failed) return null

    return (
        <div className={cn("absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]", className)}>
            <img
                src={src}
                alt=""
                draggable={false}
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                style={{ maskImage: mask, WebkitMaskImage: mask }}
                className={cn(
                    "absolute end-0 top-0 h-full w-auto max-w-none select-none transition-opacity duration-500",
                    loaded ? "opacity-100" : "opacity-0"
                )}
            />
            {/* Подложка под текст — на узких карточках арт заходит под название. */}
            <div className="absolute inset-0 bg-gradient-to-r from-card/85 via-card/35 to-transparent rtl:bg-gradient-to-l" />
        </div>
    )
}
