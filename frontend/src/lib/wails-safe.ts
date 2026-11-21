export function isWailsNative(): boolean {
    if (typeof window === 'undefined') {
        return false
    }
    return typeof (window as unknown as { go?: { main?: unknown } }).go?.main !== 'undefined'
}

export async function safeCall<T>(
    fn: () => Promise<T>,
    fallback: T
): Promise<T> {
    if (!isWailsNative()) {
        console.warn('[Wails-Safe] Go functions unavailable (browser mode), using fallback')
        return fallback
    }
    try {
        return await fn()
    } catch (error) {
        console.error('[Wails-Safe] Go call failed:', error)
        return fallback
    }
}
