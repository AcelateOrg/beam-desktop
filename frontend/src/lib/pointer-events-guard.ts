const OPEN_OVERLAY_SELECTOR = [
    '[role="dialog"][data-state="open"]',
    '[role="alertdialog"][data-state="open"]',
    '[role="menu"][data-state="open"]',
    '[role="listbox"][data-state="open"]',
    '[data-radix-popper-content-wrapper] [data-state="open"]',
].join(",")

function releaseIfStuck(): void {
    const body = document.body
    if (body.style.pointerEvents !== "none") return
    if (document.querySelector(OPEN_OVERLAY_SELECTOR)) return
    body.style.removeProperty("pointer-events")
}

export function initPointerEventsGuard(): () => void {
    if (typeof document === "undefined") return () => {}

    const observer = new MutationObserver(releaseIfStuck)
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] })

    window.addEventListener("pointermove", releaseIfStuck, true)
    window.addEventListener("pointerdown", releaseIfStuck, true)

    return () => {
        observer.disconnect()
        window.removeEventListener("pointermove", releaseIfStuck, true)
        window.removeEventListener("pointerdown", releaseIfStuck, true)
    }
}
