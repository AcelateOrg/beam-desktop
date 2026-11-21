/**
 * Каркас окна: навигация, сайдбар, обновления приложения.
 * Компоненты: AppSidebar, BottomNav, ui/sidebar, UpdateIndicator, UpdateModal, hooks/useUpdate
 */
export default {
    // ─── Навигация ──────────────────────────────────────────────────────
    // title — в сайдбаре, short — в нижней панели узкого окна

    nav: {
        home: { title: "Соединение", short: "Главная" },
        profiles: { title: "Профили", short: "Профили" },
        nodes: { title: "Конфигурации", short: "Серверы" },
        routing: { title: "Маршрутизация", short: "Маршруты" },
        settings: { title: "Настройки", short: "Настройки" },
    },

    sidebar: {
        toggle: "Свернуть или развернуть меню",
    },

    // ─── Обновление приложения ──────────────────────────────────────────

    update: {
        available: "Доступно обновление",
        version: "Версия {{version}}",
        mandatory: "Обязательное обновление — эта версия больше не поддерживается",
        noChangelog: "Список изменений недоступен",
        download: "Скачать",
        downloading: "Скачивание...",
        installAndRestart: "Установить и перезапустить",
        linuxTunNote:
            "После перезапуска Beam один раз попросит права на TUN — это ожидаемо: capabilities привязаны к файлу, а файл только что заменился на новую версию.",

        toast: {
            downloadFailed: "Не удалось скачать обновление",
            installFailed: "Не удалось установить обновление",
        },
    },
} as const
