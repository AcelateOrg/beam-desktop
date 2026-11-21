import { useVPNStore } from "@/stores/vpnStore"

// Счётчик подключений к серверам: радиальное меню ставит самые частые первыми.
// Хранится локально; старые значения плавно затухают, чтобы недавние привычки
// весили больше месячной давности.

const KEY = "beam.serverUsage.v1"
const DECAY = 0.97

export function getServerUsage(): Record<string, number> {
    try {
        const raw = localStorage.getItem(KEY)
        return raw ? (JSON.parse(raw) as Record<string, number>) : {}
    } catch {
        return {}
    }
}

function bump(id: string) {
    const usage = getServerUsage()
    for (const k of Object.keys(usage)) {
        usage[k] *= DECAY
        if (usage[k] < 0.05) delete usage[k]
    }
    usage[id] = (usage[id] ?? 0) + 1
    try {
        localStorage.setItem(KEY, JSON.stringify(usage))
    } catch {
        /* переполнено или запрещено — не страшно */
    }
}

const isUp = (s: string) => s === "connected" || s === "connected_no_internet"

// Считаем фактические сессии: подключение и смену сервера на живом туннеле.
useVPNStore.subscribe((state, prev) => {
    const id = state.selectedNodeId
    if (!id || !isUp(state.status)) return
    if (!isUp(prev.status) || prev.selectedNodeId !== id) bump(id)
})
