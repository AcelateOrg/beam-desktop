/**
 * Фарси (RTL). Структура повторяет ru/: те же файлы, те же ключи.
 * Если ключа не хватает или есть лишний, tsc подсветит это сразу.
 */
import type ru from "../ru"
import type { LocaleShape } from "../../locale-shape"
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
} satisfies LocaleShape<typeof ru>
