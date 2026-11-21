/**
 * Настройки → О приложении и экран «Лицензии»
 * Структура повторяет ru/settings/about.ts.
 */
import type ru from "../../ru/settings/about"
import type { LocaleShape } from "../../../locale-shape"

export default {
    title: "About",

    version: "Version",
    build: "build",
    copyHashHint: "Click to copy the build hash",
    checking: "Checking…",
    updateTo: "Update to {{version}}",
    checkUpdates: "Check for updates",
    licenses: "Licenses",

    beta: {
        badgeTitle: "Beta build, tag {{tag}}",
        title: "Closed beta",
        description: "This version of BEAM must not be shared with third parties. Only the closed beta team is permitted to use it.",
    },

    footer: {
        // «Powered by Wails & Xray & React» — названия ссылками, слова между ними тут
        poweredBy: "Powered by",
        rights: "© {{year}} Acelate. All rights reserved.",
        love: "Made with love for our product",
    },

    toast: {
        checkFailed: "Couldn't check for updates",
        upToDate: "You're on the latest version",
        devModeOn: "Developer mode enabled",
        hashCopied: "Build hash copied",
        hashCopyFailed: "Couldn't copy the hash",
    },

    // ─── Экран «Лицензии» ───────────────────────────────────────────────

    licensesPage: {
        title: "Licenses",
        search: "Search by name, author or license",
        clear: "Clear",
        licenseText: "License text",
        thanks: "Beam is built on open-source software. Thanks to all the authors!",
        nothingFound: "Nothing found",
        footer: "Click a project to open its website, or a license to read its text.",

        // Разделы списка сторонних компонентов
        section: {
            core: { title: "Core and networking", hint: "Xray, protocols, tunnel" },
            desktop: { title: "Desktop", hint: "Window, tray, system" },
            ui: { title: "Interface", hint: "React and components" },
            fonts: { title: "Fonts", hint: "Google Fonts" },
            data: { title: "Data", hint: "Downloaded separately" },
        },

        // Пометки у отдельных компонентов
        note: {
            modified: "Modified version",
            windowsDriver: "Windows driver",
            staticLinkingException: "With a static linking exception",
            iconSets: "Icons under their respective set licenses",
            geoData: "geoip.dat and geosite.dat",
        },
    },

    // ─── Карточка «Лицензия Beam» ───────────────────────────────────────
    // Пересказ Beam Source License 1.0 простыми словами. Юридически действует
    // английский текст LICENSE — при правке лицензии обнови и эти пункты.

    beamLicense: {
        title: "Beam license",
        description: "The code is source-available, but it isn't open source. The core and tunnel are open.",
        appAndBridge: "App and bridge · Beam Source License 1.0",

        component: {
            desktop: "App",
            bridge: "Core bridge",
            core: "Xray-based core",
            tun: "Tunnel",
        },

        allowedTitle: "You can",
        allowed: {
            use: { title: "Use it", hint: "Official builds, at home, at work or in your company" },
            read: { title: "Read the code", hint: "Study and verify what Beam does and how" },
            build: { title: "Build and modify for yourself", hint: "On your own devices, for personal or internal use" },
            contribute: { title: "Contribute", hint: "Via pull requests under the CLA" },
            fork: { title: "Fork on GitHub", hint: "To prepare and submit your changes" },
            quote: { title: "Quote it", hint: "Short snippets in articles and discussions, with a link" },
            recommend: { title: "Recommend it to customers", hint: "For providers: links to builds and subscription headers" },
        },

        forbiddenTitle: "You can't",
        forbidden: {
            distribute: { title: "Distribute or sell it", hint: "Beam or modified versions, as code or builds" },
            stores: { title: "Publish to app stores", hint: "Or mirrors, package repositories, installer sites" },
            rebrand: { title: "Rebrand it", hint: "A different name, logo or your own product based on Beam" },
            compete: { title: "Build a competitor", hint: "Take the code, design or assets for your own or someone else's client" },
            saas: { title: "Run it as a service", hint: "A hosted or managed Beam for other people" },
            copyright: { title: "Remove copyright notices", hint: "Delete or hide authorship and license notices" },
            bypass: { title: "Bypass protections", hint: "Signing, updates and integrity checks, in order to redistribute" },
        },

        mpl: {
            title: "beam-core and beam-tun: MPL-2.0",
            description: "You can use, modify and distribute them, including in your own products. Modified files stay open under MPL-2.0, and copyright notices must be kept.",
        },

        fineTitle: "Good to know",
        fine: {
            trademarks: "The names \"Beam\" and \"Acelate\" and their logos are trademarks. The license grants no rights to them.",
            termination: "Break the terms and you lose your rights. If it's your first time and you fix it within 30 days of notice, they're restored.",
            warranty: "Beam is provided \"as is\", without warranty.",
            permission: "Need something that's not allowed? It's possible with written permission from Acelate.",
            legal: "The full text in the repository's LICENSE file is what's legally binding.",
        },
    },
} satisfies LocaleShape<typeof ru>
