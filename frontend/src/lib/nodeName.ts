const FLAG_PATTERN = /(?:\uD83C[\uDDE6-\uDDFF]){2}/
const FLAG_PATTERN_GLOBAL = /(?:\uD83C[\uDDE6-\uDDFF]){2}/g

const LONE_INDICATOR_GLOBAL = /\uD83C[\uDDE6-\uDDFF]/g

const EMPTY_BRACKETS_GLOBAL = /(?:\(\s*\)|\[\s*\]|\{\s*\}|【\s*】)/g
const EDGE_SEPARATORS_GLOBAL = /^[\s|/\\·•‧,~—–-]+|[\s|/\\·•‧,~—–-]+$/g

const REGIONAL_INDICATOR_OFFSET = 127397

const TEXT_PREFIX_PATTERN = /^([A-Z]{2})\s+/

function flagToCountryCode(flag: string): string {
    return Array.from(flag)
        .map(char => String.fromCharCode(char.codePointAt(0)! - REGIONAL_INDICATOR_OFFSET))
        .join("")
        .toUpperCase()
}

function stripFlags(name: string): string {
    return name
        .replace(FLAG_PATTERN_GLOBAL, " ")
        .replace(LONE_INDICATOR_GLOBAL, " ")
        .replace(EMPTY_BRACKETS_GLOBAL, " ")
        .replace(/\s{2,}/g, " ")
        .replace(EDGE_SEPARATORS_GLOBAL, "")
        .trim()
}

export function parseNodeName(name: string): { countryCode: string | null; displayName: string } {
    if (!name) return { countryCode: null, displayName: "" }

    const flagMatch = name.match(FLAG_PATTERN)
    if (flagMatch) {
        const displayName = stripFlags(name)
        return {
            countryCode: flagToCountryCode(flagMatch[0]),
            displayName: displayName || name.trim(),
        }
    }

    const textPrefixMatch = name.match(TEXT_PREFIX_PATTERN)
    if (textPrefixMatch) {
        return {
            countryCode: textPrefixMatch[1].toUpperCase(),
            displayName: name.replace(TEXT_PREFIX_PATTERN, "").trim(),
        }
    }

    return { countryCode: null, displayName: name }
}
