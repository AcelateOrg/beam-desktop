import { PROTUN_FORMAT_VERSION, type ProTunFile, type ProTunGraph, type ProTunMeta } from "./types"
import { t } from "@/i18n"

export function createProTunFile(graph: ProTunGraph, meta: Partial<ProTunMeta> = {}): ProTunFile {
    const now = new Date().toISOString()
    return {
        format: "protun",
        version: PROTUN_FORMAT_VERSION,
        meta: {
            name: meta.name?.trim() || t("protun.file.untitled"),
            createdAt: meta.createdAt || now,
            updatedAt: now,
        },
        graph,
    }
}

export function serializeProTunFile(file: ProTunFile): string {
    return JSON.stringify(file, null, 2)
}
