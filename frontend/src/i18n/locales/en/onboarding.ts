/**
 * Мастер первого запуска.
 * Структура повторяет ru/onboarding.ts.
 */
import type ru from "../ru/onboarding"
import type { LocaleShape } from "../../locale-shape"

export default {
    // Шаги мастера: eyebrow — маленькая подпись над заголовком
    step: {
        language: {
            eyebrow: "Language",
            title: "Choose your language",
            description: "You can change it anytime in Settings.",
        },
        welcome: {
            eyebrow: "Start",
            title: "Welcome to BEAM",
            description: "Let's set things up before your first connection.",
        },
        theme: {
            eyebrow: "Appearance",
            title: "Pick a theme",
            description: "Choose the look that suits you.",
        },
        profile: {
            eyebrow: "Import",
            title: "Add a profile",
            description: "Add a subscription, a BEAM file or a JSON config.",
        },
        behavior: {
            eyebrow: "Finish",
            title: "A couple more things",
            description: "Turn on a few options for everyday use.",
        },
    },

    // ─── Шаг «Старт» ────────────────────────────────────────────────────

    welcome: {
        title: "Welcome to BEAM",
        description: "Let's get you ready for your first connection: pick a theme, add a profile and set up how the app behaves.",
    },

    // ─── Шаг «Тема» ─────────────────────────────────────────────────────

    theme: {
        followsSystem: {
            windows: "Matches Windows",
            macos: "Matches macOS",
            linux: "Matches your system",
        },
        fixed: "Always this theme",
    },

    // ─── Шаг «Профиль» ──────────────────────────────────────────────────

    profile: {
        intro: "If you already have a profile, import it now. If not, feel free to skip this step.",
        found: "Profile found",
        notAdded: "No profile yet",
        available_one: "{{count}} profile available",
        available_other: "{{count}} profiles available",
        canSkip: "You can continue without one",
        addMore: "Add another",
        import: "Import",
    },

    // ─── Шаг «Последние настройки» ──────────────────────────────────────

    behavior: {
        autostart: {
            title: {
                windows: "Launch when Windows starts",
                macos: "Launch at login",
                linux: "Launch at login",
            },
            description: "Handy if you use Beam every day.",
            unavailableMacos: "Not available on macOS yet.",
        },
        tray: {
            title: "Minimize to tray",
            description: "Closing the window hides the app instead of quitting it.",
            descriptionMacos: "On macOS, this is handled by the system via the Dock.",
        },
    },

    // ─── Кнопки внизу ───────────────────────────────────────────────────

    nav: {
        skip: "Skip",
        back: "Back",
        next: "Next",
        finish: "Finish",
        finishing: "Saving...",
    },

    toast: {
        saveFailed: "Couldn't save settings",
        finishFailed: "Couldn't finish setup",
    },
} satisfies LocaleShape<typeof ru>
