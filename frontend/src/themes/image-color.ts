/* Извлечение акцентного цвета из картинки — для темы «Из обоев».

   Картинка уменьшается до SAMPLE_SIZE, пиксели переводятся в OKLab и
   раскладываются по корзинам оттенка. Вес пикселя растёт с насыщенностью и
   падает к краям по светлоте, поэтому побеждает не самый частый цвет (обычно
   серое небо или чёрные тени), а заметный «живой» — как в Material You. */

import { oklchToHex, rgb8ToOklab } from './palette'

const SAMPLE_SIZE = 64
const HUE_BUCKETS = 36
/** Ниже этой chroma пиксель считается серым. */
const MIN_CHROMA = 0.04
/** Доля «цветного» веса, ниже которой обои считаются монохромными. */
const MIN_COLORFUL_SHARE = 0.03

type Bucket = { weight: number; l: number; a: number; b: number; count: number }

export function loadImage(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.decoding = 'async'
        const cleanup = () => signal?.removeEventListener('abort', onAbort)
        const onAbort = () => {
            img.src = ''
            reject(new DOMException('aborted', 'AbortError'))
        }
        img.onload = () => {
            cleanup()
            resolve(img)
        }
        img.onerror = () => {
            cleanup()
            reject(new Error(`failed to load image: ${url}`))
        }
        signal?.addEventListener('abort', onAbort, { once: true })
        img.src = url
    })
}

/** Акцентный цвет картинки в #rrggbb. Монохромная картинка даёт серый цвет
 *  (нейтральная тема), null — картинку не удалось прочитать. */
export function extractAccentColor(img: HTMLImageElement): string | null {
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) return null

    const scale = SAMPLE_SIZE / Math.max(w, h)
    const cw = Math.max(1, Math.round(w * scale))
    const ch = Math.max(1, Math.round(h * scale))

    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    let data: Uint8ClampedArray
    try {
        ctx.drawImage(img, 0, 0, cw, ch)
        data = ctx.getImageData(0, 0, cw, ch).data
    } catch {
        return null
    }

    const buckets: Bucket[] = Array.from({ length: HUE_BUCKETS }, () => ({ weight: 0, l: 0, a: 0, b: 0, count: 0 }))
    let totalWeight = 0
    let colorfulWeight = 0
    let sumL = 0
    let sumA = 0
    let sumB = 0
    let pixels = 0

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue
        const [l, a, b] = rgb8ToOklab(data[i], data[i + 1], data[i + 2])
        const c = Math.hypot(a, b)
        pixels++
        sumL += l
        sumA += a
        sumB += b

        // Светлотный колокол: чёрные тени и пересвет почти не голосуют.
        const lightWeight = Math.max(0, 1 - Math.abs(l - 0.62) / 0.42)
        totalWeight += lightWeight
        if (c < MIN_CHROMA || lightWeight === 0) continue

        const weight = lightWeight * Math.min(c, 0.3)
        colorfulWeight += lightWeight
        const hue = (Math.atan2(b, a) * 180) / Math.PI
        const index = Math.floor((((hue % 360) + 360) % 360) / (360 / HUE_BUCKETS)) % HUE_BUCKETS
        const bucket = buckets[index]
        bucket.weight += weight
        bucket.l += l * weight
        bucket.a += a * weight
        bucket.b += b * weight
        bucket.count++
    }

    if (pixels === 0) return null

    if (totalWeight === 0 || colorfulWeight / totalWeight < MIN_COLORFUL_SHARE) {
        // Монохромные обои: средний оттенок с минимальной насыщенностью.
        const hue = (Math.atan2(sumB / pixels, sumA / pixels) * 180) / Math.PI
        return oklchToHex(0.62, 0.012, ((hue % 360) + 360) % 360)
    }

    // Лучшее окно из трёх соседних корзин: градиенты не дробятся на куски.
    let best = -1
    let bestScore = 0
    for (let i = 0; i < HUE_BUCKETS; i++) {
        const score =
            buckets[(i + HUE_BUCKETS - 1) % HUE_BUCKETS].weight * 0.5 +
            buckets[i].weight +
            buckets[(i + 1) % HUE_BUCKETS].weight * 0.5
        if (score > bestScore) {
            bestScore = score
            best = i
        }
    }
    if (best < 0) return null

    let weight = 0
    let l = 0
    let a = 0
    let b = 0
    for (const offset of [-1, 0, 1]) {
        const bucket = buckets[(best + offset + HUE_BUCKETS) % HUE_BUCKETS]
        weight += bucket.weight
        l += bucket.l
        a += bucket.a
        b += bucket.b
    }
    l /= weight
    a /= weight
    b /= weight

    const hue = (((Math.atan2(b, a) * 180) / Math.PI) % 360 + 360) % 360
    // Усреднение снижает chroma — возвращаем акценту выразительность.
    const chroma = Math.min(0.2, Math.max(0.1, Math.hypot(a, b) * 1.25))
    const lightness = Math.min(0.8, Math.max(0.58, l))
    return oklchToHex(lightness, chroma, hue)
}
