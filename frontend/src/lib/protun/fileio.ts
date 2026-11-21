import { parseProTunFile, ProTunParseError, type ProTunParseResult } from "./schema"
import { serializeProTunFile } from "./serialize"
import type { ProTunFile } from "./types"
import { SaveProTunFile } from "@wailsjs/go/handlers/WindowHandler"
import { t } from "@/i18n"

export const PROTUN_FILE_EXTENSION = ".protun"

function sanitizeFileName(name: string): string {
    const trimmed = name.trim() || t("protun.file.untitled")
    return trimmed.replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "") || "protun"
}

/**
 * Сохраняет схему через системное «Сохранить как» — как экспорт .beam в «Профилях».
 * Возвращает путь, "" если пользователь отменил. Бросает ошибку, если не вышло.
 */
export async function saveProTunFile(file: ProTunFile): Promise<string> {
    const json = serializeProTunFile(file)
    const result = await SaveProTunFile(json, `${sanitizeFileName(file.meta.name)}${PROTUN_FILE_EXTENSION}`)
    if (!result.success) throw new Error(result.error || t("protun.file.saveFailed"))
    return result.data ?? ""
}

function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ""))
        reader.onerror = () => reject(reader.error ?? new Error(t("protun.file.readFailed")))
        reader.readAsText(file)
    })
}

export function pickAndReadProTunFile(): Promise<ProTunParseResult | null> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = PROTUN_FILE_EXTENSION + ",application/json"
        input.style.display = "none"

        input.onchange = () => {
            const file = input.files?.[0]
            document.body.removeChild(input)
            if (!file) {
                resolve(null)
                return
            }
            readFileAsText(file)
                .then((text) => resolve(parseProTunFile(text)))
                .catch((err) => reject(err instanceof ProTunParseError ? err : new ProTunParseError(String(err))))
        }

        document.body.appendChild(input)
        input.click()
    })
}
