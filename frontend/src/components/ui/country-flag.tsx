import type { CSSProperties } from "react"
import ReactCountryFlag from "react-country-flag"

// Флаги лежат в бандле: react-country-flag с `svg` берёт их с CDN, и без сети вместо флага рисуется битая картинка.
const FLAG_URLS = import.meta.glob<string>("/node_modules/flag-icons/flags/4x3/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
})

const BY_CODE = new Map<string, string>(
    Object.entries(FLAG_URLS).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, -".svg".length), url]),
)

interface CountryFlagProps {
    countryCode: string
    style?: CSSProperties
    className?: string
}

export default function CountryFlag({ countryCode, style, className }: CountryFlagProps) {
    const url = BY_CODE.get(countryCode.toLowerCase())
    if (!url) {
        return <ReactCountryFlag countryCode={countryCode} svg style={style} className={className} />
    }
    return (
        <img
            src={url}
            alt=""
            draggable={false}
            style={{ objectFit: "cover", ...style }}
            className={className}
        />
    )
}
