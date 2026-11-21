import { create } from 'zustand'

import { parseNodeName } from '@/lib/nodeName'
import { useVPNStore } from '@/stores/vpnStore'

/**
 * Смена сервера на живом подключении.
 *
 * Бэкенд меняет ядро на лету (адаптер остаётся) и шлёт обычные статусы
 * connecting → connected. Для UI это выглядело как «моргнуло и всё»: не
 * понятно, сменился ли сервер. Здесь смена отслеживается отдельно:
 *   switching — новый сервер выбран, ядро переключается;
 *   switched  — переключились, пару секунд показываем «куда».
 */

export type SwitchPhase = 'idle' | 'switching' | 'switched'

export interface ServerLabel {
    countryCode: string | null
    name: string
}

interface SwitchState {
    phase: SwitchPhase
    from: ServerLabel | null
}

export const useServerSwitch = create<SwitchState>(() => ({
    phase: 'idle',
    from: null,
}))

/** Переключение показывается не короче этого: иначе оно не читается. */
const MIN_SWITCH_MS = 900
/** Сколько висит «сервер сменён». */
const SWITCHED_MS = 2600
/** Если бэкенд так и не прислал connecting (конфиг тот же), закрываем. */
const NO_EVENT_MS = 2500

type VPNSnapshot = ReturnType<typeof useVPNStore.getState>

function keyOf(s: VPNSnapshot): string {
    return `${s.activeProfileId ?? ''}|${s.selectedNodeId ?? ''}`
}

export function labelOf(s: VPNSnapshot): ServerLabel | null {
    let raw = ''
    for (const cat of s.categories) {
        const node = cat.nodes.find(n => n.id === s.selectedNodeId)
        if (node) {
            raw = node.name
            break
        }
    }
    if (!raw) {
        raw = s.profiles.find(p => p.id === s.activeProfileId)?.name ?? ''
    }
    if (!raw) return null
    try {
        raw = decodeURIComponent(raw)
    } catch {
        // имя не URL-кодировано — оставляем как есть
    }
    const { countryCode, displayName } = parseNodeName(raw)
    return { countryCode, name: displayName }
}

const live = (status: string) => status === 'connected' || status === 'connected_no_internet'

let startedAt = 0
let sawConnecting = false
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
    timers.forEach(clearTimeout)
    timers = []
}

function toIdle() {
    clearTimers()
    useServerSwitch.setState({ phase: 'idle', from: null })
}

function finish() {
    clearTimers()
    const wait = Math.max(0, MIN_SWITCH_MS - (performance.now() - startedAt))
    timers.push(setTimeout(() => {
        useServerSwitch.setState({ phase: 'switched' })
        timers.push(setTimeout(toIdle, SWITCHED_MS))
    }, wait))
}

let started = false

/** Подписка на vpnStore; вызывается один раз (идемпотентно). */
export function startServerSwitchTracker() {
    if (started) return
    started = true

    useVPNStore.subscribe((state, prev) => {
        const { phase } = useServerSwitch.getState()

        // Новый сервер на живом подключении.
        // Первая загрузка профиля/нод (prev пустой) — не смена.
        const profileChanged = !!prev.activeProfileId && state.activeProfileId !== prev.activeProfileId
        const nodeChanged = state.activeProfileId === prev.activeProfileId
            && !!prev.selectedNodeId && state.selectedNodeId !== prev.selectedNodeId
        if (keyOf(state) !== keyOf(prev)
            && (((profileChanged || nodeChanged) && live(prev.status)) || phase === 'switching')) {
            if (phase !== 'switching') {
                clearTimers()
                startedAt = performance.now()
                sawConnecting = false
                useServerSwitch.setState({ phase: 'switching', from: labelOf(prev) })
                timers.push(setTimeout(() => {
                    const s = useVPNStore.getState()
                    if (!sawConnecting && live(s.status) && useServerSwitch.getState().phase === 'switching') {
                        finish()
                    }
                }, NO_EVENT_MS))
            }
            return
        }

        if (state.status === prev.status) return

        if (phase === 'switching') {
            if (state.status === 'connecting') {
                sawConnecting = true
            } else if (live(state.status)) {
                finish()
            } else {
                toIdle()
            }
            return
        }

        if (phase === 'switched' && !live(state.status)) {
            toIdle()
        }
    })
}
