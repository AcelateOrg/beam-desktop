import { Check, Languages } from "lucide-react"

import CountryFlag from "@/components/ui/country-flag"
import { SettingsCard } from "@/components/ui/settings-card"
import { isLanguageAvailable, LANGUAGES, setLanguage, t } from "@/i18n"
import { useLanguage } from "@/i18n/useLanguage"
import { cn } from "@/lib/utils"

export default function LanguageCard() {
    const current = useLanguage()

    return (
        <SettingsCard
            icon={<Languages className="h-3.5 w-3.5" />}
            title={t("settings.app.language.title")}
            description={t("settings.app.language.description")}
        >
            <div
                role="radiogroup"
                aria-label={t("settings.app.language.title")}
                className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3"
            >
                {LANGUAGES.map((lang) => {
                    const selected = lang.code === current
                    const available = isLanguageAvailable(lang.code)
                    return (
                        <button
                            key={lang.code}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={!available}
                            title={available ? undefined : t("settings.app.language.unavailable")}
                            onClick={() => void setLanguage(lang.code)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors duration-200",
                                selected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-border/60 hover:border-border hover:bg-muted/30",
                                "disabled:pointer-events-none disabled:opacity-40",
                            )}
                        >
                            <CountryFlag
                                countryCode={lang.flag}
                                className="h-4 w-[1.375rem] shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
                            />
                            <span lang={lang.code} dir={lang.dir} className="min-w-0 truncate text-sm font-medium">
                                {lang.nativeName}
                            </span>
                            <Check className={cn("ms-auto h-4 w-4 shrink-0 text-primary", !selected && "invisible")} />
                        </button>
                    )
                })}
            </div>
        </SettingsCard>
    )
}
