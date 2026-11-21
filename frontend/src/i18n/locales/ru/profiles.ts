/**
 * Профили: список, добавление, экспорт, параметры.
 * Компоненты: pages/Profiles, app/Profiles (карточка в сайдбаре главной),
 * app/profiles/*, hooks/useProfiles, hooks/useExternalOpen
 */
export default {
    title: "Профили",
    add: "Добавить профиль",
    empty: "Нет профилей. Добавьте первый!",
    noProfile: "Нет профиля",

    // ─── Карточка профиля ───────────────────────────────────────────────

    card: {
        active: "Активен",
        providerChannel: "Канал провайдера",
        unlimitedTraffic: "Безлимитный трафик",
        unlimited: "Безлимитный",
    },

    menu: {
        refresh: "Обновить",
        settings: "Параметры",
        export: "Экспортировать",
        delete: "Удалить",
    },

    deleteDialog: {
        title: "Удалить профиль?",
        description: "Профиль «{{name}}» будет удалён безвозвратно. Это действие нельзя отменить.",
        confirm: "Удалить",
    },

    // ─── Окно «Добавить профиль» ────────────────────────────────────────

    addModal: {
        title: "Добавить профиль",

        method: {
            url: { title: "URL", hint: "Ссылка на подписку" },
            beam: { title: "BEAM", hint: "Импорт из файла" },
        },

        url: {
            placeholder: "https://... или vless://...",
            hint: "vless://, vmess://, trojan://, ss://, hy2://, или ссылка на подписку (HTTP/HTTPS)",
            insecure: "⚠️ Соединение без шифрования",
        },

        file: {
            choose: "Выберите .beam файл",
            orDrop: "или перенесите сюда",
            dropHere: "Отпустите здесь",
        },

        submit: "Импортировать",
        submitting: "Импорт...",

        error: {
            onlyBeam: "Только .BEAM файлы",
            importFailed: "Ошибка импорта",
            fillFields: "Заполните поля",
        },
    },

    // ─── Окно «Экспорт профиля» ─────────────────────────────────────────

    exportModal: {
        title: "Экспорт профиля",

        method: {
            beam: { title: "BEAM", hint: "Файл .beam" },
            raw: { title: "RAW", hint: "Ссылки подписки" },
            qr: { title: "QR", hint: "Для телефона" },
        },

        copySubscription: "Скопировать ссылку подписки",
        loading: "Загрузка...",

        qr: {
            subscription: "Ссылка подписки",
            server: "Сервер {{index}}",
            nothing: "У профиля нет ссылки подписки и сохранённых ссылок серверов — показать в QR нечего",
            hintSubscription: "В BEAM на телефоне: «Добавить профиль» → «QR-код»",
            hintServer: "Только этот сервер — отсканируйте в BEAM или другом клиенте",
            copyLink: "Ссылка",
            copyImage: "Скопировать QR",
            copied: "Скопировано",
            tooLong: "Ссылка слишком длинная для QR-кода. Используйте экспорт BEAM или RAW.",
            ariaLabel: "QR-код",
        },

        beam: {
            fileName: "Имя файла",
            download: "Скачать",
            exporting: "Экспорт...",
        },

        raw: {
            none: "Для этого профиля нет сохранённых ссылок — он импортирован не из обычных vless/vmess/trojan/ss/hy2-ссылок",
            untitled: "Без названия",
            copy: "Скопировать",
            copyAll: "Скопировать всё",
        },

        toast: {
            fileSaved: "Файл сохранён",
            showInFolder: "Показать в папке",
            linkCopied: "Ссылка скопирована",
            imageCopyFailed: "Не удалось скопировать изображение",
        },
    },

    // ─── Окно «Параметры профиля» ───────────────────────────────────────

    settingsModal: {
        title: "Параметры профиля",

        autoRefresh: {
            title: "Автообновление подписки",
            disabled: "Выключено — подписка сама не обновляется",
            ownSchedule: "Обновляется раз в {{hours}}ч по своему расписанию",
            providerInterval: "Обновляется автоматически раз в {{hours}}ч",
            providerSchedule: "Обновляется автоматически по расписанию",
        },

        override: {
            title: "Своё расписание",
            active: "Обновлять раз в {{hours}}ч вместо расписания провайдера",
            emptyWithInterval: "Пусто — по расписанию провайдера ({{hours}}ч)",
            empty: "Пусто — по расписанию провайдера",
            hoursUnit: "ч",
        },

        noSubscription: "У этого профиля нет подписки — автообновление недоступно.",
        done: "Готово",
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        refreshing: "Обновляем профиль…",
        refreshed: "Профиль обновлён",
        refreshFailed: "Не удалось обновить",
        autoRefreshFailed: "Не удалось изменить автообновление",
        scheduleFailed: "Не удалось изменить расписание обновления",
        exportFailed: "Не удалось экспортировать",
        linksFailed: "Не удалось получить ссылки",
        saveFileFailed: "Не удалось сохранить файл",
        saveLinksFailed: "Не удалось сохранить ссылки",
    },

    // ─── Импорт по внешней ссылке (beam://, файл) ───────────────────────

    externalImport: {
        title: "Добавить профиль?",
        source: "Источник: {{source}}",
        beamLink: "ссылка beam://",
        confirm: "Добавить",
        cancel: "Отмена",
        failed: "Не удалось импортировать внешний Beam payload",
    },
} as const
