import { useEffect, useMemo, useRef } from "react";

/**
 * Presets to bulk-apply effect settings.
 * Returns partial custom_settings.
 */
export const EFFECT_PRESETS: Record<string, any> = {
  none: {
    effect_border_beam: false,
    effect_border_glow: false,
    effect_particles: false,
    effect_aurora: false,
    effect_cta_pulse: false,
    effect_cta_shimmer: false,
    effect_confetti: false,
  },
  neon: {
    effect_border_beam: true,
    effect_border_glow: true,
    effect_particles: false,
    effect_aurora: false,
    effect_cta_pulse: true,
    effect_cta_shimmer: true,
    effect_confetti: true,
    effect_color: '#22d3ee',
    effect_color_2: '#a855f7',
  },
  aurora: {
    effect_border_beam: false,
    effect_border_glow: true,
    effect_particles: false,
    effect_aurora: true,
    effect_cta_pulse: false,
    effect_cta_shimmer: true,
    effect_confetti: true,
    effect_color: '#8b5cf6',
    effect_color_2: '#ec4899',
  },
  minimal: {
    effect_border_beam: false,
    effect_border_glow: false,
    effect_particles: false,
    effect_aurora: false,
    effect_cta_pulse: false,
    effect_cta_shimmer: true,
    effect_confetti: false,
  },
  festivo: {
    effect_border_beam: true,
    effect_border_glow: false,
    effect_particles: true,
    effect_aurora: false,
    effect_cta_pulse: true,
    effect_cta_shimmer: true,
    effect_confetti: true,
    effect_color: '#f59e0b',
    effect_color_2: '#ef4444',
  },
};

const EFFECT_STYLES = `
@keyframes ck-border-beam {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes ck-aurora {
  0%, 100% { transform: translate3d(-10%, -10%, 0) rotate(0deg); }
  50% { transform: translate3d(10%, 10%, 0) rotate(180deg); }
}
@keyframes ck-particle-float {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-120vh) translateX(40px); opacity: 0; }
}
@keyframes ck-cta-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--ck-effect-color, rgba(139,92,246,0.55)); }
  50% { box-shadow: 0 0 0 14px rgba(139,92,246,0); }
}
@keyframes ck-cta-shimmer {
  0% { transform: translateX(-120%) skewX(-20deg); }
  100% { transform: translateX(220%) skewX(-20deg); }
}
.ck-border-beam {
  position: relative;
  isolation: isolate;
}
.ck-border-beam::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(90deg,
    var(--ck-effect-color, #8b5cf6),
    var(--ck-effect-color-2, #ec4899),
    var(--ck-effect-color, #8b5cf6));
  background-size: 200% 200%;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: ck-border-beam 3s linear infinite;
  pointer-events: none;
  z-index: 1;
}
.ck-border-glow {
  box-shadow:
    0 0 0 1px var(--ck-effect-color, #8b5cf6),
    0 0 24px -4px var(--ck-effect-color, #8b5cf6),
    0 0 60px -10px var(--ck-effect-color-2, #ec4899) !important;
}
.ck-cta-pulse {
  animation: ck-cta-pulse 2s ease-out infinite;
}
.ck-cta-shimmer {
  position: relative;
  overflow: hidden;
}
.ck-cta-shimmer::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: 0; width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  animation: ck-cta-shimmer 2.6s ease-in-out infinite;
  pointer-events: none;
}
`;

let stylesInjected = false;
const ensureStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.setAttribute('data-checkout-effects', 'true');
  el.innerHTML = EFFECT_STYLES;
  document.head.appendChild(el);
  stylesInjected = true;
};

interface EffectsProps {
  settings?: any;
  /** scope=preview limits absolute positioning to the parent container */
  scope?: 'page' | 'preview';
}

/**
 * Overlay layer for background effects (particles, aurora).
 * Place inside a `position: relative` parent. It is pointer-events:none.
 */
export const CheckoutEffectsLayer = ({ settings = {}, scope = 'page' }: EffectsProps) => {
  useEffect(() => { ensureStyles(); }, []);

  const color = settings.effect_color || '#8b5cf6';
  const color2 = settings.effect_color_2 || '#ec4899';

  const particles = useMemo(() => {
    if (!settings.effect_particles) return [];
    const count = scope === 'preview' ? 18 : 36;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, [settings.effect_particles, scope]);

  if (!settings.effect_particles && !settings.effect_aurora) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        ['--ck-effect-color' as any]: color,
        ['--ck-effect-color-2' as any]: color2,
        zIndex: 0,
      }}
      aria-hidden
    >
      {settings.effect_aurora && (
        <>
          <div
            className="absolute -inset-[20%] opacity-40 blur-3xl"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${color}, transparent 50%), radial-gradient(circle at 70% 60%, ${color2}, transparent 55%)`,
              animation: 'ck-aurora 18s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -inset-[20%] opacity-25 blur-3xl"
            style={{
              background: `radial-gradient(circle at 60% 20%, ${color2}, transparent 50%), radial-gradient(circle at 20% 80%, ${color}, transparent 55%)`,
              animation: 'ck-aurora 24s ease-in-out infinite reverse',
            }}
          />
        </>
      )}
      {settings.effect_particles && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute bottom-0 rounded-full"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.id % 2 === 0 ? color : color2,
                opacity: p.opacity,
                animation: `ck-particle-float ${p.duration}s linear ${p.delay}s infinite`,
                boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? color : color2}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** Returns className string for a card that should receive border effects */
export const useEffectClasses = (settings: any = {}) => {
  useEffect(() => { ensureStyles(); }, []);
  const classes: string[] = [];
  if (settings.effect_border_beam) classes.push('ck-border-beam');
  if (settings.effect_border_glow) classes.push('ck-border-glow');
  return classes.join(' ');
};

export const useCtaEffectClasses = (settings: any = {}) => {
  useEffect(() => { ensureStyles(); }, []);
  const classes: string[] = [];
  if (settings.effect_cta_pulse) classes.push('ck-cta-pulse');
  if (settings.effect_cta_shimmer) classes.push('ck-cta-shimmer');
  return classes.join(' ');
};

export const effectCssVars = (settings: any = {}) => ({
  ['--ck-effect-color' as any]: settings.effect_color || '#8b5cf6',
  ['--ck-effect-color-2' as any]: settings.effect_color_2 || '#ec4899',
});

/**
 * Lightweight confetti burst. Trigger by calling `fireConfetti()`.
 * Returns a render-nothing element; call the returned ref function on success.
 */
export const useConfetti = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fire = () => {
    const root = containerRef.current;
    if (!root) return;
    const colors = ['#22d3ee', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('span');
      const size = 6 + Math.random() * 6;
      piece.style.cssText = `
        position:absolute;top:50%;left:50%;width:${size}px;height:${size * 0.5}px;
        background:${colors[i % colors.length]};border-radius:2px;
        transform:translate(-50%,-50%);pointer-events:none;
      `;
      root.appendChild(piece);
      const angle = (Math.PI * 2 * i) / 80 + Math.random();
      const dist = 120 + Math.random() * 220;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 120;
      piece.animate(
        [
          { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
        ],
        { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
      );
      setTimeout(() => piece.remove(), 2000);
    }
  };
  const Portal = () => (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden />
  );
  return { fire, Portal };
};
