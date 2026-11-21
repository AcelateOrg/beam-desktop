/**
 * Главная: кнопка подключения и всё вокруг неё.
 * Компоненты: pages/Home, ConnectionStats, NodeSelector, ServerRadial,
 * KillSwitchBanner, hooks/useVPN, hooks/useKillSwitch
 */
export default {
    // ─── Подпись под кнопкой подключения ────────────────────────────────

    status: {
        paused: "Интернет на паузе",
        error: "Ошибка подключения",
        switching: "Смена сервера...",
        switched: "Сервер сменён!",
        connecting: "Подключение...",
        unhealthy: "Проблемы с соединением",
        connected: "Вы подключены!",
        noProfile: "Добавьте профиль",
        idle: "Нажмите для подключения",
    },

    // ─── Статистика под кнопкой ─────────────────────────────────────────

    stats: {
        unstable: "Нестабильное соединение",
        ping: "Пинг",
        time: "Время",
        downloaded: "Скачано",
        uploaded: "Отдано",
    },

    // ─── Выбор сервера (выпадающий список) ──────────────────────────────

    nodeSelector: {
        placeholder: "Выбрать сервер",
        switching: "Переключение...",
        pinned: "Закреплённые",
        allServers: "Все серверы",
    },

    // ─── Радиальное меню серверов (зажать кнопку подключения) ───────────

    radial: {
        hintHold: "Тяни к серверу",
        hintClick: "Выбери сервер",
        alreadyHere: "уже здесь",
        connect: "подключиться",
        switch: "переключиться",
        allServers: "Все серверы",
        allShort: "Все",
        more: "ещё {{count}}",
    },

    // ─── Плашка Kill Switch ─────────────────────────────────────────────

    killSwitch: {
        failed: "Kill Switch не сработал: {{error}}",
        title: "Сработал Kill Switch",
        details: "Подробнее",
        tooltip: "Работают только BEAM и локальная сеть. Интернет вернётся сам, как только VPN подключится.",
        reason: "Причина: {{reason}}",
        description: "VPN отключился — интернет на паузе, чтобы ничего не утекло",
        reconnect: "Переподключить",
        restoreInternet: "Вернуть интернет",

        toast: {
            restoreFailed: "Не удалось вернуть интернет",
            saveFailed: "Не удалось сохранить",
        },
    },

    // ─── Ошибки подключения ─────────────────────────────────────────────

    toast: {
        disconnectError: "Ошибка отключения",
    },
} as const
