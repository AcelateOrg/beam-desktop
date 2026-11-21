import { useEffect, useRef, useState } from 'react';
import { useVPN } from '@/hooks/useVPN';
import { cn } from '@/lib/utils';
import { useServerSwitch } from '@/stores/serverSwitchStore';
import { RADIAL_HOLD_MS, useServerRadial } from '@/components/app/ServerRadial';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseSpeed: number;
    length: number;
    alpha: number;
    decay?: number;
    color: string;
    isBurst?: boolean;
}

const MAX_PARTICLES = 60;
const ACCEL_RAMP_MS = 3000;

const GLOW = {
    backdropOpacity: 1,
    backdropScale: 1.25,
    backdropAppearMs: 800,
    backdropHideMs: 300,
    shadowInnerSize: '18px',
    shadowOuterSize: '60px',
} as const;

type Rgb = [number, number, number];

/** Цвет частиц, если переменную темы не удалось разобрать. */
const FALLBACK_RGB: Rgb = [0, 200, 255];
/** Заведомо невероятный цвет: если fillStyle его сохранил, значение не распознано. */
const SENTINEL_COLOR = '#010203';

/** Переводит CSS-переменную (oklch, color-mix и т.п.) в sRGB: рисует пиксель
 *  на 1×1 canvas и читает его обратно. */
function resolveCssVarRgb(element: Element, name: string): Rgb {
    const value = getComputedStyle(element).getPropertyValue(name).trim();
    if (!value) return FALLBACK_RGB;

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    if (!ctx) return FALLBACK_RGB;

    ctx.fillStyle = SENTINEL_COLOR;
    ctx.fillStyle = value;
    if (ctx.fillStyle === SENTINEL_COLOR) return FALLBACK_RGB;

    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
}

function mixWithWhite([r, g, b]: Rgb, amount: number): Rgb {
    const mix = (v: number) => Math.round(v + (255 - v) * amount);
    return [mix(r), mix(g), mix(b)];
}

/** Префикс «rgba(r, g, b, » — альфа дописывается при отрисовке. */
function rgbaPrefix([r, g, b]: Rgb): string {
    return `rgba(${r}, ${g}, ${b}, `;
}

/** preview — статичная копия в состоянии «подключено» (превью тем):
 *  не реагирует на VPN и не кликается. */
export default function ConnectButton({ preview = false }: { preview?: boolean } = {}) {
    const vpn = useVPN();
    const { toggle, clearError } = vpn;
    // Смена сервера на живом подключении — не «подключение с нуля»: кнопка
    // остаётся цветной, вокруг бежит дуга, по завершении — вспышка.
    const switchPhase = useServerSwitch(s => s.phase);
    const isSwitching = !preview && switchPhase === 'switching';
    const isConnected = preview || vpn.isConnected || isSwitching;
    const isLoading = !preview && vpn.isLoading && !isSwitching;
    const hasError = !preview && vpn.hasError;
    const isNoInternet = !preview && vpn.isNoInternet;

    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isExploding, setIsExploding] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const loadStartTimeRef = useRef<number>(0);
    const prevLoadingRef = useRef(isLoading);

    const lastClickRef = useRef<number>(0);

    // Зажать кнопку (или ПКМ) — радиальное меню быстрой смены сервера.
    const radial = useServerRadial({
        buttonRef,
        enabled: !preview && !isLoading && !isSwitching,
        isConnected: vpn.isConnected,
        onConnect: () => {
            clearError();
            toggle();
        },
    });

    const handleClick = () => {
        if (preview) return;
        if (radial.consumeClick()) return;

const now = performance.now();
        if (now - lastClickRef.current < 350) return;
        lastClickRef.current = now;
        if (isLoading) return;
        if (hasError) clearError();
        toggle();
    };

    useEffect(() => {
        if (switchPhase !== 'switched' || preview) return;
        setIsExploding(true);
        const timer = setTimeout(() => setIsExploding(false), 650);
        return () => clearTimeout(timer);
    }, [switchPhase, preview]);

    useEffect(() => {
        if (isLoading) {
            loadStartTimeRef.current = performance.now();
        }

        if (prevLoadingRef.current && !isLoading && isConnected) {
            setIsExploding(true);
            const timer = setTimeout(() => setIsExploding(false), 650);
            return () => clearTimeout(timer);
        }

        prevLoadingRef.current = isLoading;
    }, [isLoading, isConnected]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const size = 880;
        canvas.width = size;
        canvas.height = size;
        const cx = size / 2;
        const cy = size / 2;

        let particles: Particle[] = [];
        let bloomFlash = 0;

        // Частицы и вспышка берут акцент текущей темы. Читаем с самого canvas,
        // чтобы учесть палитру, заскоупленную на обёртку (превью тем).
        const accentRgb = resolveCssVarRgb(canvas, '--sidebar-primary');
        const accentColor = rgbaPrefix(accentRgb);
        const palette = [
            accentColor,
            rgbaPrefix(mixWithWhite(accentRgb, 0.25)),
            'rgba(255, 255, 255, ',
            rgbaPrefix(mixWithWhite(accentRgb, 0.55)),
        ];

        const getButtonRadius = () => {
            if (!buttonRef.current) return 110;
            return (buttonRef.current.offsetWidth / 2) * (isLoading ? 0.96 : 1);
        };

        const spawnInwardDust = (): Particle => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 360 + Math.random() * 80;
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;

            const dx = cx - x;
            const dy = cy - y;
            const len = Math.hypot(dx, dy) || 1;

            return {
                x,
                y,
                vx: dx / len,
                vy: dy / len,
                baseSpeed: 2.5 + Math.random() * 1.5,
                length: 8 + Math.random() * 12,
                alpha: 0.08,
                color: palette[Math.floor(Math.random() * palette.length)],
                isBurst: false,
            };
        };

        if (isExploding) {
            bloomFlash = 1.0;
            const currentR = getButtonRadius();

            particles.forEach((p) => {
                const dx = p.x - cx;
                const dy = p.y - cy;
                const dist = Math.hypot(dx, dy) || 1;
                const blastSpeed = 4.5 + Math.random() * 6.5;
                p.vx = (dx / dist) * blastSpeed;
                p.vy = (dy / dist) * blastSpeed;
                p.isBurst = true;
                p.decay = 0.02 + Math.random() * 0.02;
                p.alpha = 0.95;
                p.length = 16 + Math.random() * 20;
            });

            const burstCount = Math.min(45, MAX_PARTICLES - particles.length);
            for (let i = 0; i < burstCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3.5 + Math.random() * 8;
                particles.push({
                    x: cx + Math.cos(angle) * (currentR * 0.5),
                    y: cy + Math.sin(angle) * (currentR * 0.5),
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    baseSpeed: speed,
                    length: 12 + Math.random() * 16,
                    alpha: 1,
                    decay: 0.018 + Math.random() * 0.02,
                    color: palette[Math.floor(Math.random() * palette.length)],
                    isBurst: true,
                });
            }
        }

        const render = () => {
            ctx.clearRect(0, 0, size, size);
            const currentR = getButtonRadius();

            const elapsed = performance.now() - loadStartTimeRef.current;
            const progress = isLoading ? Math.min(1, elapsed / ACCEL_RAMP_MS) : 0;
            const timeAcceleration = 1.0 + Math.pow(progress, 1.8) * 2.5;

            if (isLoading && particles.length < MAX_PARTICLES) {
                const spawnChance = 0.25 + progress * 0.45;
                if (Math.random() < spawnChance) {
                    particles.push(spawnInwardDust());
                }
            }

            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                if (!p.isBurst) {
                    const distToCenter = Math.hypot(cx - p.x, cy - p.y);
                    const distanceBoost = 1 + (380 - distToCenter) / 220;
                    const currentSpeed = Math.min(12, p.baseSpeed * timeAcceleration * distanceBoost);

                    p.x += p.vx * currentSpeed;
                    p.y += p.vy * currentSpeed;
                    p.alpha = Math.min(0.75, p.alpha + 0.03);

                    const tailLength = p.length * (0.8 + (currentSpeed / 4) * 0.7);
                    const tailX = p.x - p.vx * tailLength;
                    const tailY = p.y - p.vy * tailLength;

                    const grad = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
                    grad.addColorStop(0, `${p.color}0)`);
                    grad.addColorStop(1, `${p.color}${p.alpha})`);

                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(p.x, p.y);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.4;
                    ctx.stroke();

                    if (distToCenter <= currentR * 0.45) {
                        particles.splice(i, 1);
                    }
                } else {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.955;
                    p.vy *= 0.955;
                    p.alpha -= p.decay || 0.02;

                    if (p.alpha <= 0) {
                        particles.splice(i, 1);
                        continue;
                    }

                    const speed = Math.hypot(p.vx, p.vy);
                    const normVx = p.vx / (speed || 1);
                    const normVy = p.vy / (speed || 1);
                    const tailLength = p.length * (speed / 4.5);

                    const tailX = p.x - normVx * tailLength;
                    const tailY = p.y - normVy * tailLength;

                    const grad = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
                    grad.addColorStop(0, `${p.color}0)`);
                    grad.addColorStop(1, `${p.color}${p.alpha})`);

                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(p.x, p.y);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.6;
                    ctx.stroke();
                }
            }
            ctx.restore();

            if (bloomFlash > 0.01) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, currentR + 150);
                grad.addColorStop(0, `rgba(255, 255, 255, ${bloomFlash * 0.8})`);
                grad.addColorStop(0.35, `${accentColor}${bloomFlash * 0.45})`);
                grad.addColorStop(1, 'transparent');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, currentR + 150, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                bloomFlash *= 0.88;
            }

            if (isLoading || isExploding || bloomFlash > 0.01 || particles.length > 0) {
                animId = requestAnimationFrame(render);
            }
        };

        render();

        return () => cancelAnimationFrame(animId);
    }, [isLoading, isExploding]);

    const isActiveGlow = isConnected || hasError;
    const glowVars = hasError
        ? { css: 'var(--destructive)', tw: 'bg-destructive' }
        : isNoInternet
            ? { css: 'rgb(249 115 22)', tw: 'bg-orange-500' }
            : { css: 'var(--sidebar-primary)', tw: 'bg-sidebar-primary' };

    const glowColor = (alpha: number) =>
        `color-mix(in oklab, ${glowVars.css} ${alpha}%, transparent)`;

    const backdropStyle: React.CSSProperties = {
        transition: `opacity ${isActiveGlow ? GLOW.backdropAppearMs : GLOW.backdropHideMs}ms ease-out, transform 800ms cubic-bezier(0.16, 1.2, 0.3, 1)`,
        opacity: isActiveGlow ? GLOW.backdropOpacity : 0,
        transform: isActiveGlow ? `scale(${GLOW.backdropScale})` : 'scale(0.95)',
        animation: isActiveGlow ? 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
    };

    // Тень в покое — тёмная, но не чисто чёрная: фон темы, затемнённый до
    // тени, чтобы она ложилась в палитру и не выглядела грязным пятном.
    const shadowMix = (alpha: number) =>
        `color-mix(in oklab, color-mix(in oklab, var(--background) 35%, black) ${alpha}%, transparent)`;

    const restingShadow = [
        `0 10px 28px -8px ${shadowMix(55)}`,
        `0 2px 6px -2px ${shadowMix(35)}`,
        'inset 0 1px 1px 0 rgba(255, 255, 255, 0.07)',
    ].join(', ');

    const hoveredShadow = [
        `0 16px 36px -8px ${shadowMix(65)}`,
        `0 4px 10px -2px ${shadowMix(40)}`,
        'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
    ].join(', ');

    const activeShadow = `0 0 ${GLOW.shadowInnerSize} 4px ${glowColor(65)},
                          0 0 ${GLOW.shadowOuterSize} 16px ${glowColor(25)},
                          inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)`;

    const boxShadow = isActiveGlow ? activeShadow : isHovered ? hoveredShadow : restingShadow;

const currentScale = isLoading
        ? 'scale(0.96)'
        : isPressed
            ? 'scale(0.98)'
            : isHovered
                ? 'scale(1.02)'
                : 'scale(1)';

    const isBreathing = isConnected && !isExploding;

    return (
        <div className="relative flex items-center justify-center select-none">
            <style>{`
                @keyframes beam-micro-hum {
                    0%   { transform: translate3d(0, 0, 0); }
                    25%  { transform: translate3d(-0.45px, 0.35px, 0); }
                    50%  { transform: translate3d(0.4px, -0.4px, 0); }
                    75%  { transform: translate3d(-0.35px, -0.3px, 0); }
                    100% { transform: translate3d(0.45px, 0.3px, 0); }
                }
                @keyframes beam-breathe {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.01); }
                }
            `}</style>

            {/* Фоновые блобы */}
            <div aria-hidden className="absolute inset-0 pointer-events-none" style={backdropStyle}>
                <div className={cn('absolute inset-0 rounded-full blur-3xl transition-colors duration-[800ms]', glowVars.tw)} style={{ opacity: 0.5 }} />
                <div className={cn('absolute inset-0 rounded-full blur-2xl scale-75 transition-colors duration-[800ms]', glowVars.tw)} style={{ opacity: 0.4 }} />
            </div>

            {/* Холст под кнопкой */}
            <canvas
                ref={canvasRef}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 h-[880px] w-[880px]"
            />

            {/* Дуга смены сервера */}
            <div
                aria-hidden
                className={cn(
                    'pointer-events-none absolute z-20 rounded-full transition-opacity duration-300',
                    isSwitching ? 'opacity-100' : 'opacity-0'
                )}
                style={{
                    width: 'calc(var(--connect-btn-size) + 16px)',
                    height: 'calc(var(--connect-btn-size) + 16px)',
                    background: 'conic-gradient(from 0deg, transparent 0deg 200deg, var(--sidebar-primary) 320deg, white 360deg)',
                    WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px))',
                    maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px))',
                    animation: isSwitching ? 'spin 0.8s linear infinite' : 'none',
                    filter: 'drop-shadow(0 0 6px var(--sidebar-primary))',
                }}
            />

            {/* Зарядка долгого нажатия: дуга добегает — открывается меню серверов */}
            <svg
                aria-hidden
                viewBox="0 0 100 100"
                className="pointer-events-none absolute z-20"
                style={{
                    width: 'calc(var(--connect-btn-size) + 14px)',
                    height: 'calc(var(--connect-btn-size) + 14px)',
                    transform: 'rotate(-90deg)',
                }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="48.6"
                    fill="none"
                    stroke="var(--sidebar-primary)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={radial.charging ? 0 : 100}
                    style={{
                        opacity: radial.charging ? 1 : 0,
                        filter: 'drop-shadow(0 0 4px var(--sidebar-primary))',
                        transition: radial.charging
                            ? `stroke-dashoffset ${RADIAL_HOLD_MS}ms cubic-bezier(0.4, 0, 1, 1) 60ms, opacity 120ms ease 60ms`
                            : 'opacity 120ms ease',
                    }}
                />
            </svg>

            {/* Кнопка */}
            <button
                ref={buttonRef}
                type="button"
                onClick={handleClick}
                {...radial.handlers}
                tabIndex={preview ? -1 : undefined}
                aria-hidden={preview || undefined}
                onMouseEnter={() => { if (!preview) setIsHovered(true); }}
                onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
                onMouseDown={() => { if (!isLoading && !preview) setIsPressed(true); }}
                onMouseUp={() => setIsPressed(false)}
                style={{
                    width: 'var(--connect-btn-size)',
                    height: 'var(--connect-btn-size)',
                    boxShadow,
                    transform: isBreathing ? undefined : currentScale,
                    transition: isLoading
                        ? 'transform 450ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 500ms ease'
                        : isExploding
                            ? 'transform 650ms cubic-bezier(0.18, 1.45, 0.32, 1), box-shadow 400ms ease, background-color 300ms ease'
                            : 'transform 260ms ease-out, box-shadow 400ms ease, background-color 300ms ease',
                    animation: isBreathing ? 'beam-breathe 4s ease-in-out infinite' : 'none',
                }}
                className={cn(
                    'group relative z-10 rounded-full overflow-hidden outline-none cursor-pointer border transition-colors duration-300',
                    hasError
                        ? 'bg-destructive border-destructive text-destructive-foreground'
                        : isConnected
                            ? isNoInternet
                                ? 'bg-orange-500 border-orange-400 text-white'
                                : 'bg-sidebar-primary border-sidebar-primary text-primary-foreground'
                            : 'bg-card hover:bg-[color-mix(in_oklab,var(--sidebar-primary)_7%,var(--card))] border-border hover:border-sidebar-primary/45 text-foreground'
                )}
            >
                <div
                    className={cn(
                        "relative z-10 flex h-full w-full items-center justify-center p-[21%]",
                        isLoading && "animate-[beam-micro-hum_70ms_infinite_linear_1.8s]"
                    )}
                >
                    {/* Логотип — маска цвета currentColor. В активных состояниях он всегда
                        белый (а не primary-foreground, который на пастельных акцентах тёмный),
                        в неактивном — белый в тёмных темах и цвета акцента в светлых
                        (как раньше фирменный голубой логотип на светлом фоне). */}
                    <span
                        role="img"
                        aria-label="BEAM"
                        style={{
                            WebkitMaskImage: 'url(/beam.png)',
                            maskImage: 'url(/beam.png)',
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center',
                        }}
                        className={cn(
                            'block h-full w-full bg-current transition-all duration-300 ease-out',
                            (isConnected || hasError) && 'text-white opacity-100',
                            !isConnected && !hasError && 'text-sidebar-primary dark:text-foreground opacity-75 group-hover:opacity-95',
                            isLoading && 'opacity-25 scale-90 blur-[0.3px]',
                            isSwitching && 'opacity-60 scale-90',
                            isHovered && !isLoading && 'scale-105'
                        )}
                    />
                </div>
            </button>

            {radial.overlay}
        </div>
    );
}
