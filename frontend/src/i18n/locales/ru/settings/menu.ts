/**
 * Настройки → главный экран со списком разделов
 * Экран: src/pages/settings/Settings.tsx
 */
export default {
    title: "Настройки",

    appearance: {
        title: "Внешний вид",
        description: "Тема, шрифт, скругление",
    },
    app: {
        title: "Приложение",
        description: "Язык, автозапуск, трей, пинг, HWID",
    },
    connection: {
        title: "Соединение",
        description: "Режим, DNS, фрагментация",
    },
    analytics: {
        title: "Статистика",
        description: "Трафик, время, серверы и приложения",
    },
    logs: {
        title: "Логи",
        description: "Журнал работы ядра Xray",
    },
    developer: {
        title: "Для разработчиков",
        description: "Инструменты разработки и отладки",
    },
    about: {
        title: "О приложении",
        description: "Версия и информация",
    },
} as const
