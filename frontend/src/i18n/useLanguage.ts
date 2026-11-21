import { useEffect, useState } from "react"

import { getLanguage, onLanguageChanged, type LanguageCode } from "./index"

export function useLanguage(): LanguageCode {
    const [language, setLanguageState] = useState(getLanguage)
    useEffect(() => onLanguageChanged(setLanguageState), [])
    return language
}
