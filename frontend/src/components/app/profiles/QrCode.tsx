import { forwardRef, useId, useMemo } from "react"
import qrcode from "qrcode-generator"

import { cn } from "@/lib/utils"
import { t } from "@/i18n"

type Ecc = "L" | "M" | "Q" | "H"

interface QrMatrix {
    size: number
    ecc: Ecc
    /** modules[y][x], true is dark. */
    modules: boolean[][]
}

/**
 * Encodes [text] at the smallest version that fits with error correction M, then raises the correction
 * as far as that version allows (so short links get room for the logo). Null when it does not fit at all.
 */
function encodeQr(text: string): QrMatrix | null {
    // The library's byte mode takes one char per byte, so feed it the UTF-8 bytes (emoji in server names).
    const binary = Array.from(new TextEncoder().encode(text), (b) => String.fromCharCode(b)).join("")
    const make = (version: number, ecc: Ecc) => {
        try {
            const qr = qrcode(version as Parameters<typeof qrcode>[0], ecc)
            qr.addData(binary, "Byte")
            qr.make()
            return qr
        } catch {
            return null // "code length overflow"
        }
    }

    let qr = make(0, "M")
    if (!qr) return null
    let ecc: Ecc = "M"
    const version = (qr.getModuleCount() - 17) / 4
    for (const candidate of ["Q", "H"] as const) {
        const stronger = make(version, candidate)
        if (!stronger) break
        qr = stronger
        ecc = candidate
    }

    const size = qr.getModuleCount()
    const modules = Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => qr.isDark(y, x)))
    return { size, ecc, modules }
}

/** The BEAM star from the logo, in a 152×152 box. */
const STAR_PATH =
    "M76.0607 0L97.6815 54.4685L152.121 76.1006L97.6815 97.7328L76.0607 152.201L54.4399 97.7328L0 76.1006L54.4399 54.4685L76.0607 0Z"

/** Quiet zone around the symbol, in modules. */
const QUIET = 2

interface QrCodeProps {
    value: string
    className?: string
}

/**
 * A QR code drawn as SVG: soft rounded modules, rounded finder eyes and the BEAM star in the middle
 * when the error correction leaves room for it. Always dark on white, so any camera reads it in any theme.
 * The ref points at the <svg>, so the picture can be rasterised for the clipboard.
 */
const QrCode = forwardRef<SVGSVGElement, QrCodeProps>(function QrCode({ value, className }, ref) {
    const gradientId = `qr-ink-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
    const qr = useMemo(() => encodeQr(value), [value])

    const drawing = useMemo(() => {
        if (!qr) return null
        const { size, modules } = qr

        // The logo needs Q or H: ~22% of the side covers ~5% of the modules, well inside their margin.
        const withLogo = qr.ecc === "Q" || qr.ecc === "H"
        let logo = Math.round(size * 0.22)
        if ((size - logo) % 2 !== 0) logo++
        const logoStart = (size - logo) / 2
        const inLogo = (x: number, y: number) =>
            withLogo && x >= logoStart && x < logoStart + logo && y >= logoStart && y < logoStart + logo
        const inFinder = (x: number, y: number) =>
            (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)

        // One path for every data module: a rounded square per dark module.
        const s = 0.88
        const r = 0.34
        const o = (1 - s) / 2
        let d = ""
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!modules[y][x] || inFinder(x, y) || inLogo(x, y)) continue
                const x0 = x + QUIET + o
                const y0 = y + QUIET + o
                d +=
                    `M${x0 + r} ${y0}h${s - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${s - 2 * r}` +
                    `a${r} ${r} 0 0 1 ${-r} ${r}h${-(s - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(s - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`
            }
        }

        const finders = [
            [0, 0],
            [size - 7, 0],
            [0, size - 7],
        ].map(([fx, fy]) => [fx + QUIET, fy + QUIET])

        return { size, d, finders, withLogo, logo, logoStart: logoStart + QUIET }
    }, [qr])

    if (!drawing) {
        return (
            <div className={cn("flex aspect-square items-center justify-center rounded-2xl border bg-muted/30 p-6", className)}>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    {t("profiles.exportModal.qr.tooLong")}
                </p>
            </div>
        )
    }

    const view = drawing.size + QUIET * 2
    const ink = `url(#${gradientId})`
    const pad = drawing.logo * 0.14
    const star = drawing.logo - pad * 2 - drawing.logo * 0.12

    return (
        <svg
            ref={ref}
            viewBox={`0 0 ${view} ${view}`}
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="geometricPrecision"
            role="img"
            aria-label={t("profiles.exportModal.qr.ariaLabel")}
            className={className}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#0d0f16" />
                    <stop offset="1" stopColor="#262c45" />
                </linearGradient>
            </defs>
            <rect width={view} height={view} rx={view * 0.06} fill="#ffffff" />
            <path d={drawing.d} fill={ink} />
            {drawing.finders.map(([x, y]) => (
                <g key={`${x}-${y}`} fill={ink}>
                    <path
                        fillRule="evenodd"
                        d={`${roundedRect(x, y, 7, 7, 2.2)}${roundedRect(x + 1, y + 1, 5, 5, 1.5)}`}
                    />
                    <rect x={x + 2} y={y + 2} width={3} height={3} rx={1} />
                </g>
            ))}
            {drawing.withLogo && (
                <g>
                    <rect
                        x={drawing.logoStart + pad / 2}
                        y={drawing.logoStart + pad / 2}
                        width={drawing.logo - pad}
                        height={drawing.logo - pad}
                        rx={(drawing.logo - pad) * 0.28}
                        fill="#ffffff"
                        stroke="#e6e8ef"
                        strokeWidth={0.12}
                    />
                    <path
                        d={STAR_PATH}
                        fill={ink}
                        transform={`translate(${drawing.logoStart + (drawing.logo - star) / 2} ${drawing.logoStart + (drawing.logo - star) / 2}) scale(${star / 152.2})`}
                    />
                </g>
            )}
        </svg>
    )
})

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
    return (
        `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
        `h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`
    )
}

/** Rasterises a rendered QR <svg> to a PNG blob, for copying the picture. */
export async function qrToPng(svg: SVGSVGElement, px = 1024): Promise<Blob | null> {
    const markup = new XMLSerializer().serializeToString(svg)
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }))
    try {
        const image = new Image()
        image.decoding = "async"
        image.src = url
        await image.decode()
        const canvas = document.createElement("canvas")
        canvas.width = px
        canvas.height = px
        const ctx = canvas.getContext("2d")
        if (!ctx) return null
        ctx.drawImage(image, 0, 0, px, px)
        return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
    } finally {
        URL.revokeObjectURL(url)
    }
}

export default QrCode
