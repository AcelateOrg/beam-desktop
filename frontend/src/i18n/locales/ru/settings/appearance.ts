/**
 * Настройки → Внешний вид
 * Экран: src/pages/settings/Appearance.tsx
 * Карточки: components/appearance/*  ·  Темы: lib/theme.ts, themes/*
 */
export default {
    title: "Внешний вид",

    // ─── Карточка «Темы» ────────────────────────────────────────────────

    themes: {
        title: "Темы",
        description: "Выберите визуальный стиль приложения или создайте свой.",
        builtinSection: "Готовые",
        customSection: "Пользовательские",
        wallpaper: "Из обоев",
        newTheme: "Новая тема",
        edit: "Редактировать тему «{{name}}»",
        delete: "Удалить тему «{{name}}»",
        collapse: "Свернуть",
        showMore: "Показать ещё",

        // Встроенные темы: название плитки и подсказка
        builtin: {
            system: { label: "Системная", description: "Следует за оформлением ОС." },
            light: { label: "Светлая", description: "Классическая светлая тема Beam." },
            dark: { label: "Тёмная", description: "Классическая тёмная тема Beam." },
            amoled: { label: "AMOLED", description: "Чистый чёрный фон для OLED-экранов." },
            cosmic: { label: "Космическая", description: "Глубокий фон с бирюзовым акцентом." },
            purple: { label: "Фиолетовая", description: "Бархатный фиолет с неоновым акцентом." },
            blue: { label: "Синяя", description: "Мягкий тёмно-синий в духе редакторов кода." },
            slate: { label: "Slate", description: "Холодный серый с лёгким синим подтоном." },
            stone: { label: "Stone", description: "Тёплый графит со спокойным контрастом." },
            emerald: { label: "Изумрудная", description: "Глубокий зелёный с изумрудным акцентом." },
            sunset: { label: "Закат", description: "Тёплый янтарь с оранжевыми бликами." },
            nord: { label: "Норд", description: "Арктический серый с морозно-голубым акцентом." },
            rose: { label: "Розовая", description: "Розовый подтон с ярким розовым акцентом." },
            mocha: { label: "Catppuccin Mocha", description: "Пастельная тёмная палитра с лавандовым акцентом." },
            latte: { label: "Catppuccin Latte", description: "Светлая пастель с фиолетовым акцентом." },
            dracula: { label: "Dracula", description: "Классическая тёмная тема с фиолетовым акцентом." },
            tokyo: { label: "Tokyo Night", description: "Ночной индиго с голубым неоном." },
            gruvbox: { label: "Gruvbox", description: "Тёплый ретро-графит с жёлтым акцентом." },
        },
    },

    // ─── Редактор своей темы (диалог) ───────────────────────────────────

    editor: {
        titleNew: "Новая тема",
        titleEdit: "Редактирование темы",
        description: "Выберите акцент и фон — остальная палитра построится автоматически.",
        defaultName: "Моя тема",
        name: "Название",
        section: "Раздел",
        create: "Создать тему",

        tab: {
            accent: "Акцент",
            surface: "Фон",
        },

        accentColor: "Цвет акцента",
        quickPick: "Быстрый выбор",
        saturationBrightness: "Насыщенность и яркость",
        hue: "Оттенок",

        base: {
            title: "База",
            dark: "Тёмная",
            light: "Светлая",
            amoled: "AMOLED",
        },

        surface: {
            title: "Оттенок фона",
            fromAccent: "Как у акцента",
            custom: "Свой",
        },

        depth: {
            title: "Глубина",
            aria: "Глубина фона",
            deeper: "Глубже",
            lighter: "Светлее",
            amoledHint: "В AMOLED фон всегда чёрный.",
        },

        saturation: {
            title: "Насыщенность",
            aria: "Насыщенность фона",
            amoledHint: "Влияет только на карточки и меню.",
        },

        // Подписи плашек под превью: из чего строится палитра
        palette: {
            title: "Палитра",
            background: "Фон",
            sidebar: "Боковая панель",
            card: "Карточки",
            hover: "Наведение",
            border: "Рамки",
            accent: "Акцент",
        },

        // Текст в мини-превью окна. Это макет, значения выдуманные
        preview: {
            usage: "19 из 50 ГБ · 23 дня",
            search: "Поиск сервера…",
            connect: "Подключить",
        },
    },

    // ─── Карточка «Акцентный цвет» ──────────────────────────────────────

    accent: {
        title: "Акцентный цвет",
        description: "Кнопки, выделение и графики. Тема остаётся та же.",
        fromTheme: "Как в теме",
        custom: "Свой цвет",
        done: "Готово",
        wallpaperHint: "«Из обоев» берёт акцент из картинки.",
        customThemeHint: "У своей темы акцент задаётся в её редакторе.",
    },

    // ─── Карточка «Фон» ─────────────────────────────────────────────────

    backdrop: {
        title: "Фон",
        description: "Картинка под интерфейсом.",
        off: "Нет",
        wallpaper: "Обои",
        wallpaperMissing: "Обои не найдены",
        photo: "Своё фото",
        replace: "Заменить",
        remove: "Удалить",
        blur: "Размытие",
        brightness: "Яркость",
        density: "Плотность панелей",
        resetSliders: "Сбросить ползунки",
        matchColors: "Цвета под фон",

        style: {
            content: "Стеклянное меню",
            sidebar: "Тёмное меню",
        },

        error: {
            change: "Не удалось изменить фон",
            save: "Не удалось сохранить фон",
            upload: "Не удалось загрузить фото",
            remove: "Не удалось удалить фото",
            savePhoto: "Не удалось сохранить фото",
            readPhoto: "Не удалось прочитать фото",
            unsupportedFormat: "Этот формат изображения не поддерживается",
            processPhoto: "Не удалось обработать фото",
            appOnly: "Доступно только в приложении",
        },
    },

    // ─── Карточка «Шрифт интерфейса» ────────────────────────────────────

    font: {
        title: "Шрифт интерфейса",
        description: "Шрифт для отображения текста во всём приложении.",
        // Слово на плитке шрифта: показывает, как выглядят буквы этого языка
        sample: "Привет",
        custom: "Свой шрифт",
        customHint: "TTF, OTF, WOFF, WOFF2 — до 10 МБ",
        delete: "Удалить шрифт «{{name}}»",
    },

    // ─── Карточка «Скругление углов» ────────────────────────────────────

    radius: {
        title: "Скругление углов",
        description: "Радиус скругления кнопок, карточек и элементов интерфейса.",
        small: "Маленькое",
        medium: "Среднее",
        large: "Большое",
        round: "Круглое",
    },

    // ─── Карточка «Анимация переходов» ──────────────────────────────────

    animation: {
        title: "Анимация переходов",
        description: "Стиль анимации при смене вкладок и страниц.",
        slide: { label: "Слайд", description: "Справа" },
        slideUp: { label: "Снизу", description: "Снизу вверх" },
        fade: { label: "Фейд", description: "Плавное" },
        none: { label: "Нет", description: "Мгновенно" },
    },

    // ─── Уведомления ────────────────────────────────────────────────────

    toast: {
        fontTooLarge: "Файл шрифта больше 10 МБ",
        fontReadFailed: "Не удалось прочитать шрифт",
        fontFormats: "Подходят TTF, OTF, WOFF и WOFF2",
        fontSaveFailed: "Не удалось сохранить шрифт",
        fontAdded: "Шрифт «{{name}}» добавлен",
        fontDeleteFailed: "Не удалось удалить шрифт",
        themeSaveFailed: "Не удалось сохранить тему",
        themeDeleteFailed: "Не удалось удалить тему",
        themeDeleted: "Тема «{{name}}» удалена",
        undo: "Отменить",
    },
} as const
