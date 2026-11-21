/**
 * Русский — исходный язык BEAM. Остальные языки повторяют эту структуру.
 *
 * Один файл = один экран или область. Внутри файла ключи идут в том же
 * порядке, что и элементы на экране, сверху вниз.
 * Ключ в коде: t("<файл>.<блок>.<строка>"), например t("settings.app.behavior.title").
 */
import common from "./common"
import errors from "./errors"
import home from "./home"
import layout from "./layout"
import logs from "./logs"
import nodes from "./nodes"
import onboarding from "./onboarding"
import profiles from "./profiles"
import protun from "./protun"
import settings from "./settings"

export default {
    common,
    layout,
    home,
    profiles,
    nodes,
    protun,
    logs,
    settings,
    onboarding,
    errors,
} as const
