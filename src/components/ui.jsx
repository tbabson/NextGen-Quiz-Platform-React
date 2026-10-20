import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { Award, Flame, Footprints, LoaderCircle, Lock, RotateCcw, Star, Target, Trophy, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { avatarTone, badgeMeta, initials } from '../lib/gamify.js';

const ICONS = { Award, Flame, Footprints, Star, Target, Trophy, Zap };

export function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="PUNCH NextGen home">
      <motion.span
        whileHover={{ rotate: -8, scale: 1.06 }}
        className="grid size-9 place-items-center rounded-xl bg-primary shadow-[0_3px_0_0_var(--color-primary-deep)]"
      >
        <Zap className="size-5 fill-gold text-gold" strokeWidth={2.5} />
      </motion.span>
      <span className={`text-lg font-extrabold leading-none tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
        PUNCH<span className="text-primary"> NextGen</span>
      </span>
    </Link>
  );
}

/** Animated number that counts up when it scrolls into view. */
export function CountUp({ value = 0, duration = 1.1, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}

const BAR_TONES = {
  aqua: 'bg-aqua',
  primary: 'bg-primary',
  gold: 'bg-gold',
  coral: 'bg-coral',
};

export function ProgressBar({ value = 0, tone = 'aqua', className = 'h-3', track = 'bg-line', label, delay = 0.15 }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full ${track} ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <motion.div
        className={`relative h-full rounded-full ${BAR_TONES[tone]}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20, delay }}
      >
        {/* glossy highlight, Duolingo-style */}
        <span className="absolute inset-x-2 top-[22%] h-[28%] rounded-full bg-white/35" />
      </motion.div>
    </div>
  );
}

/** Circular score ring. */
export function ScoreRing({ value = 0, size = 168, stroke = 14, tone = 'var(--color-aqua)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Avatar({ name, seed, size = 'size-10', className = '' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-sm font-extrabold ${avatarTone(seed ?? name)} ${size} ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

const BADGE_TONES = {
  aqua: 'from-aqua to-[#00a08b] text-white shadow-[0_4px_0_0_var(--color-aqua-dark)]',
  coral: 'from-coral to-[#ff4f6d] text-white shadow-[0_4px_0_0_var(--color-coral-dark)]',
  gold: 'from-gold to-[#ffb020] text-navy shadow-[0_4px_0_0_var(--color-gold-dark)]',
  primary: 'from-primary to-[#7f5cff] text-white shadow-[0_4px_0_0_var(--color-primary-deep)]',
};

export function BadgeIcon({ code, locked = false, size = 'size-16', iconSize = 'size-7' }) {
  const meta = badgeMeta(code);
  const Icon = ICONS[meta.icon] ?? Award;
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-[1.4rem] ${size} ${
        locked ? 'bg-line text-slate/50' : `bg-gradient-to-br ${BADGE_TONES[meta.tone]}`
      }`}
    >
      <Icon className={iconSize} strokeWidth={2.4} />
      {locked && (
        <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border-2 border-white bg-slate text-white">
          <Lock className="size-3" strokeWidth={3} />
        </span>
      )}
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-line/70 ${className}`} />;
}

export function Spinner({ className = 'size-5' }) {
  return <LoaderCircle className={`animate-spin ${className}`} />;
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Mascot size={88} mood="happy" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-2.5 rounded-full bg-primary"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Something didn't load" }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Mascot size={80} mood="sad" />
      <h3 className="text-xl">{title}</h3>
      <p className="max-w-sm text-sm text-slate">{error?.message ?? 'Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary mt-2" onClick={onRetry}>
          <RotateCcw className="size-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Mascot size={80} mood="happy" />
      <h3 className="text-xl">{title}</h3>
      <p className="max-w-sm text-sm text-slate">{children}</p>
      {action}
    </div>
  );
}

/**
 * "Volt", the platform mascot: a friendly lightning-bolt buddy. Pure SVG so it themes with the palette.
 * mood: happy | cheer | sad | think
 */
export function Mascot({ size = 120, mood = 'happy', className = '' }) {
  const eyeY = mood === 'sad' ? 47 : 44;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      animate={mood === 'cheer' ? { y: [0, -10, 0], rotate: [0, -6, 6, 0] } : { y: [0, -4, 0] }}
      transition={{ duration: mood === 'cheer' ? 0.9 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="50" cy="94" rx="24" ry="4" fill="var(--color-navy)" opacity="0.1" />
      <rect x="18" y="16" width="64" height="66" rx="24" fill="var(--color-primary)" />
      <rect x="18" y="16" width="64" height="58" rx="24" fill="#7458f0" />
      <path d="M54 24 38 52h11l-4 20 17-28H51z" fill="var(--color-gold)" opacity="0.95" />
      <circle cx="38" cy={eyeY} r="7" fill="white" />
      <circle cx="62" cy={eyeY} r="7" fill="white" />
      <motion.g
        animate={{ scaleY: [1, 1, 0.1, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
        style={{ originY: `${eyeY}px` }}
      >
        <circle cx={mood === 'think' ? 40 : 39} cy={eyeY + (mood === 'think' ? -2 : 1)} r="3.4" fill="var(--color-navy)" />
        <circle cx={mood === 'think' ? 64 : 63} cy={eyeY + (mood === 'think' ? -2 : 1)} r="3.4" fill="var(--color-navy)" />
      </motion.g>
      {mood === 'sad' ? (
        <path d="M42 64q8-6 16 0" stroke="var(--color-navy)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : mood === 'think' ? (
        <path d="M44 62h12" stroke="var(--color-navy)" strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <path d="M40 58q10 10 20 0" stroke="var(--color-navy)" strokeWidth="3.5" fill={mood === 'cheer' ? 'var(--color-coral)' : 'none'} strokeLinecap="round" />
      )}
      <circle cx="29" cy="56" r="4" fill="var(--color-coral)" opacity="0.45" />
      <circle cx="71" cy="56" r="4" fill="var(--color-coral)" opacity="0.45" />
    </motion.svg>
  );
}

export function StatPill({ icon, value, tone, label }) {
  const Icon = ICONS[icon] ?? Star;
  const tones = {
    gold: 'bg-gold-soft text-[#8a5a00]',
    coral: 'bg-coral-soft text-coral-dark',
    aqua: 'bg-aqua-soft text-aqua-dark',
    primary: 'bg-lavender text-primary',
  };
  return (
    <span className={`chip text-sm ${tones[tone]}`} title={label}>
      <Icon className={`size-4 ${tone === 'gold' ? 'fill-gold text-gold-dark' : tone === 'coral' ? 'fill-coral text-coral' : ''}`} />
      <span className="tabular-nums">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
