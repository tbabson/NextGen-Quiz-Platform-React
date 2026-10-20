import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, Trophy, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAttempt } from '../api/queries.js';
import { BadgeIcon, CountUp, ErrorState, Mascot, ScoreRing, Skeleton } from '../components/ui.jsx';
import { rise, stagger } from '../lib/motion.js';
import { formatDate, scoreMessage } from '../lib/gamify.js';

const BRAND_CONFETTI = ['#6246EA', '#00BFA6', '#FFC857', '#FF6B6B', '#E9E5FF'];

function celebrate(big) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const base = { colors: BRAND_CONFETTI, disableForReducedMotion: true, zIndex: 60 };
  confetti({ ...base, particleCount: big ? 140 : 70, spread: big ? 100 : 70, origin: { y: 0.55 } });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 250);
    setTimeout(() => confetti({ ...base, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 400);
  }
}

function BadgeUnlockModal({ badges, onClose }) {
  const [i, setI] = useState(0);
  const badge = badges[i];
  const last = i === badges.length - 1;

  useEffect(() => {
    celebrate(true);
  }, [i]);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-navy/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        key={badge.code}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-title"
        initial={{ scale: 0.6, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="card relative w-full max-w-sm overflow-hidden p-8 text-center"
      >
        <motion.div
          className="pointer-events-none absolute inset-x-0 -top-20 mx-auto size-72 rounded-full bg-[conic-gradient(from_0deg,var(--color-gold-soft),var(--color-lavender),var(--color-aqua-soft),var(--color-gold-soft))] opacity-80"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative">
          <p className="chip mx-auto bg-gold text-navy">
            <Sparkles className="size-3.5" /> Badge unlocked{badges.length > 1 && ` · ${i + 1}/${badges.length}`}
          </p>
          <motion.div
            className="mx-auto mt-6 w-fit"
            initial={{ rotate: -30, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
          >
            <BadgeIcon code={badge.code} size="size-28" iconSize="size-14" />
          </motion.div>
          <h2 id="badge-title" className="mt-6 text-2xl">{badge.name}</h2>
          <p className="mt-1 text-slate">{badge.description}</p>
          <button type="button" autoFocus className="btn btn-primary mt-7 w-full" onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? 'Awesome!' : 'Next badge'} <ArrowRight className="size-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultRow({ r, index }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`rounded-3xl border-2 bg-white p-4 sm:p-5 ${r.is_correct ? 'border-success/25' : 'border-danger/25'}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl text-white ${r.is_correct ? 'bg-success' : 'bg-danger'}`}
          aria-label={r.is_correct ? 'Correct' : 'Incorrect'}
        >
          {r.is_correct ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate">Question {r.position}</p>
          <p className="mt-0.5 font-extrabold">{r.text}</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className={`rounded-2xl px-3 py-2 ${r.is_correct ? 'bg-success-soft' : 'bg-danger-soft'}`}>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate">Your answer</p>
              <p className={`font-bold ${r.is_correct ? 'text-success' : 'text-danger'}`}>{r.selected_option?.text ?? 'No answer'}</p>
            </div>
            {!r.is_correct && (
              <div className="rounded-2xl bg-success-soft px-3 py-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate">Correct answer</p>
                <p className="font-bold text-success">{r.correct_option?.text}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}

export default function AttemptPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: attempt, isPending, isError, error, refetch } = useAttempt(id);

  // Celebrate only right after a new submission, and only once (refreshing the page won't replay it).
  const [fresh] = useState(() => Boolean(location.state?.fresh));
  const [showBadges, setShowBadges] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (location.state?.fresh) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    if (!fresh || !attempt) return undefined;
    if (attempt.badges_awarded.length) {
      const t = setTimeout(() => setShowBadges(true), 1400);
      return () => clearTimeout(t);
    }
    if (attempt.percentage >= 50) {
      const t = setTimeout(() => celebrate(attempt.perfect), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [fresh, attempt]);

  if (isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-72" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState error={error} title={error.status === 404 ? 'Result not found' : "Couldn't load this result"} onRetry={error.status === 404 ? undefined : refetch} />;
  }

  const msg = scoreMessage(attempt.percentage);
  const ringTone = attempt.perfect ? 'var(--color-gold)' : attempt.percentage >= 50 ? 'var(--color-aqua)' : 'var(--color-coral)';
  const shown = attempt.results.filter((r) => filter === 'all' || (filter === 'wrong' ? !r.is_correct : r.is_correct));
  const wrongCount = attempt.total - attempt.score;

  return (
    <motion.div variants={stagger(0.08)} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={rise}>
        <Link to="/quizzes" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate hover:text-primary">
          <ArrowLeft className="size-4" /> Back to quizzes
        </Link>
      </motion.div>

      {/* Score hero */}
      <motion.section variants={rise} className="card relative overflow-hidden p-6 sm:p-8">
        {attempt.perfect && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,200,87,0.25),transparent)]" />
        )}
        <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
          <ScoreRing value={attempt.score / attempt.total} tone={ringTone}>
            <div>
              <p className="text-4xl font-extrabold tabular-nums">
                <CountUp value={attempt.percentage} />%
              </p>
              <p className="text-xs font-bold text-slate">{attempt.score}/{attempt.total} correct</p>
            </div>
          </ScoreRing>

          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-primary">{attempt.quiz.title}</p>
            <h1 className="mt-1 text-3xl sm:text-4xl">{msg.title}</h1>
            <p className="mt-2 text-slate">{msg.subtitle}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
                className="flex items-center gap-2 rounded-2xl bg-gold px-4 py-2.5 text-navy shadow-[0_4px_0_0_var(--color-gold-dark)]"
              >
                <Zap className="size-5 fill-navy" />
                <span className="text-xl font-extrabold">
                  +<CountUp value={attempt.xp_awarded} duration={1.4} /> XP
                </span>
              </motion.div>
              {attempt.perfect && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.9, type: 'spring' }}
                  className="chip bg-coral px-4 py-2.5 text-sm text-white"
                >
                  <Trophy className="size-4" /> Perfect bonus +20
                </motion.span>
              )}
            </div>
            <p className="mt-4 text-xs font-semibold text-slate">Completed {formatDate(attempt.submitted_at)}</p>
          </div>

          <div className="hidden lg:block">
            <Mascot size={120} mood={attempt.percentage >= 50 ? 'cheer' : 'sad'} />
          </div>
        </div>

        {attempt.badges_awarded.length > 0 && (
          <div className="relative mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-lavender p-4">
            <p className="text-sm font-extrabold text-primary">Badges earned:</p>
            {attempt.badges_awarded.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => setShowBadges(true)}
                className="flex items-center gap-2 rounded-2xl bg-white py-1.5 pr-3 pl-1.5 text-sm font-extrabold hover:shadow-card"
              >
                <BadgeIcon code={b.code} size="size-8" iconSize="size-4" /> {b.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
          <Link to="/quizzes" className="btn btn-primary">
            Next quiz <ArrowRight className="size-4" />
          </Link>
          <Link to="/leaderboard" className="btn btn-ghost">
            <Trophy className="size-4" /> Leaderboard
          </Link>
        </div>
      </motion.section>

      {/* Breakdown */}
      <motion.section variants={rise}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Question breakdown</h2>
          <div className="flex rounded-2xl border-2 border-line bg-white p-1" role="tablist" aria-label="Filter results">
            {[
              ['all', `All ${attempt.total}`],
              ['right', `Correct ${attempt.score}`],
              ['wrong', `Missed ${wrongCount}`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className="relative rounded-xl px-3 py-1.5 text-xs font-extrabold"
              >
                {filter === key && <motion.span layoutId="result-filter" className="absolute inset-0 rounded-xl bg-lavender" />}
                <span className={`relative ${filter === key ? 'text-primary' : 'text-slate'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-4 space-y-3">
          {shown.map((r, i) => <ResultRow key={r.question_id} r={r} index={i} />)}
          {!shown.length && (
            <li className="rounded-3xl border-2 border-dashed border-line p-8 text-center text-sm font-semibold text-slate">
              {filter === 'wrong' ? 'Nothing missed. Flawless! 🎯' : 'Nothing to show here.'}
            </li>
          )}
        </ul>
      </motion.section>

      <AnimatePresence>
        {showBadges && attempt.badges_awarded.length > 0 && (
          <BadgeUnlockModal badges={attempt.badges_awarded} onClose={() => setShowBadges(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
