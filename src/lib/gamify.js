/**
 * Client-side presentation of progress. Everything here is derived from data the API returns
 * (XP, attempts, badges); nothing is invented or sent back to the server.
 */

export const XP_PER_LEVEL = 50;

const LEVEL_TITLES = ['Rookie', 'Explorer', 'Scholar', 'Achiever', 'Ace', 'Mastermind', 'Legend'];

export function levelFor(xp = 0) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    into,
    needed: XP_PER_LEVEL,
    toNext: XP_PER_LEVEL - into,
    progress: into / XP_PER_LEVEL,
  };
}

/** Consecutive calendar days (local time) with at least one completed quiz, ending today or yesterday. */
export function streakFrom(attempts = []) {
  const days = new Set(attempts.map((a) => dayKey(new Date(a.submitted_at))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak, activeToday: days.has(dayKey(new Date())) };
}

/** The last 7 days, oldest first, flagging which had activity. */
export function weekActivity(attempts = []) {
  const days = new Set(attempts.map((a) => dayKey(new Date(a.submitted_at))));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), active: days.has(dayKey(d)), today: i === 6 };
  });
}

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Display catalog for the seeded badges, so locked ones can be shown as goals.
 * Unknown codes from the API still render with a fallback style.
 */
export const BADGE_CATALOG = [
  { code: 'FIRST_STEPS', name: 'First Steps', description: 'Complete your first quiz.', icon: 'Footprints', tone: 'aqua' },
  { code: 'PERFECT_SCORE', name: 'Perfect Score', description: 'Score 100% on any quiz.', icon: 'Target', tone: 'coral' },
  { code: 'XP_100', name: 'XP 100', description: 'Reach 100 XP.', icon: 'Zap', tone: 'gold' },
];

export const badgeMeta = (code) =>
  BADGE_CATALOG.find((b) => b.code === code) ?? { code, icon: 'Award', tone: 'primary' };

export function scoreMessage(percentage) {
  if (percentage === 100) return { title: 'Flawless!', subtitle: 'A perfect score. You nailed every single one.' };
  if (percentage >= 80) return { title: 'Brilliant work!', subtitle: "You really know your stuff." };
  if (percentage >= 50) return { title: 'Nice effort!', subtitle: 'Solid progress. Review the misses below to level up.' };
  return { title: 'Keep going!', subtitle: 'Every expert started here. Check the answers and learn from them.' };
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const AVATAR_TONES = ['bg-primary text-white', 'bg-aqua text-navy', 'bg-gold text-navy', 'bg-coral text-white', 'bg-navy text-white'];

export function avatarTone(seed = '') {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const timeAgo = (iso) => {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (seconds >= size) return rtf.format(-Math.floor(seconds / size), unit);
  }
  return 'just now';
};
