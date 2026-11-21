import { EventsOn } from '@wailsjs/runtime/runtime'

import { isWailsNative } from '@/lib/wails-safe'

type Listener = (visible: boolean) => void

const listeners = new Set<Listener>()
let visible = typeof document === 'undefined' ? true : !document.hidden
let started = false

function setVisible(next: boolean) {
    if (next === visible) return
    visible = next

    listeners.forEach(listener => {
        try {
            listener(next)
        } catch (e) {
            console.warn('[visibility] listener failed:', e)
        }
    })
}

function start() {
    if (started) return
    started = true

    if (isWailsNative()) {
        EventsOn('app:hidden', () => setVisible(false))
        EventsOn('app:activated', () => setVisible(true))
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            setVisible(!document.hidden)
        })
    }
}

export function isAppVisible(): boolean {
    start()
    return visible
}

export function onAppVisibilityChange(listener: Listener): () => void {
    start()
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
