import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Flame, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAttempts, useDashboard, useQuizzes } from '../api/queries.js';
import { BadgeIcon, ErrorState, Mascot, ProgressBar, Skeleton, StatTile } from '../components/ui.jsx';
import { rise, stagger } from '../lib/motion.js';
import { BADGE_CATALOG, levelFor, streakFrom, timeAgo, weekActivity } from '../lib/gamify.js';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dash = useDashboard();
  const quizzes = useQuizzes();
  const attempts = useAttempts();

  if (dash.isPending) return <DashboardSkeleton />;
  if (dash.isError) return <ErrorState error={dash.error} onRetry={dash.refetch} />;

  const d = dash.data;
  const lvl = levelFor(d.xp);
  const { streak, activeToday } = streakFrom(attempts.data);
  const week = weekActivity(attempts.data);
  const nextQuiz = quizzes.data?.find((q) => !q.completed);
  const earned = new Set(d.badges.map((b) => b.code));
  const lockedBadges = BADGE_CATALOG.filter((b) => !earned.has(b.code));
  const firstName = d.name.split(' ')[0];

  return (
    <motion.div variants={stagger(0.07)} initial="initial" animate="animate" className="space-y-6">
      {/* Level hero */}
      <motion.section
        variants={rise}
        className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-primary to-[#7a5cf5] p-6 text-white shadow-pop sm:p-8"
      >
        <div className="pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-40 -bottom-24 size-48 rounded-full bg-aqua/20" />
        <div className="relative flex items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white/75">
              {activeToday ? "You're on fire today!" : streak > 0 ? 'Keep your streak alive today!' : 'Ready for a quick win?'}
            </p>
            <h1 className="mt-1 text-3xl text-white sm:text-4xl">Hey {firstName}! 👋</h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="chip bg-gold text-sm text-navy">
                <Zap className="size-4 fill-navy" /> Level {lvl.level}
              </span>
              <span className="text-sm font-extrabold">{lvl.title}</span>
            </div>
            <div className="mt-3 max-w-md">
              <ProgressBar value={lvl.progress} tone="gold" track="bg-white/20" className="h-4" label="Level progress" />
              <p className="mt-2 text-xs font-bold text-white/75">
                {lvl.into} / {lvl.needed} XP · {lvl.toNext} XP to level {lvl.level + 1}
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <Mascot size={130} mood={activeToday ? 'cheer' : 'happy'} />
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.div variants={stagger(0.06)} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={Zap} tone="gold" label="Total XP" value={d.xp} />
        <StatTile icon={Trophy} tone="primary" label={`Rank of ${d.total_players}`} value={`#${d.rank}`} />
        <StatTile icon={CheckCircle2} tone="aqua" label="Quizzes done" value={d.quizzes_completed} suffix={` / ${d.total_quizzes}`} />
        <StatTile icon={Flame} tone="coral" label="Day streak" value={streak} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Continue learning */}
          <motion.section variants={rise} className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Continue learning</h2>
              <Link to="/quizzes" className="flex items-center gap-1 text-sm font-extrabold text-primary hover:underline">
                All quizzes <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="mt-4">
              <ProgressBar
                value={d.total_quizzes ? d.quizzes_completed / d.total_quizzes : 0}
                label="Course progress"
              />
              <p className="mt-2 text-xs font-bold text-slate">
                {d.quizzes_completed} of {d.total_quizzes} quizzes complete
              </p>
            </div>
            {quizzes.isPending ? (
              <Skeleton className="mt-5 h-24" />
            ) : nextQuiz ? (
              <div className="mt-5 flex flex-col gap-4 rounded-3xl border-2 border-aqua/30 bg-aqua-soft/60 p-5 sm:flex-row sm:items-center">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-aqua text-navy shadow-[0_4px_0_0_var(--color-aqua-dark)]">
                  <BookOpen className="size-7" strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-aqua-dark">Up next</p>
                  <p className="text-lg font-extrabold">{nextQuiz.title}</p>
                  <p className="text-sm text-slate">
                    {nextQuiz.question_count} questions · up to {nextQuiz.max_xp} XP
                  </p>
                </div>
                <Link to={`/play/${nextQuiz.id}`} className="btn btn-aqua">
                  Start <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-4 rounded-3xl bg-gold-soft p-5">
                <Mascot size={64} mood="cheer" />
                <div>
                  <p className="font-extrabold">You've completed every quiz! 🎉</p>
                  <p className="text-sm text-slate">Check the leaderboard to see where you stand.</p>
                </div>
              </div>
            )}
          </motion.section>

          {/* Recent activity */}
          <motion.section variants={rise} className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Recent activity</h2>
              <Link to="/history" className="flex items-center gap-1 text-sm font-extrabold text-primary hover:underline">
                History <ChevronRight className="size-4" />
              </Link>
            </div>
            {attempts.isPending ? (
              <Skeleton className="mt-4 h-20" />
            ) : attempts.data?.length ? (
              <ul className="mt-3 divide-y-2 divide-line">
                {attempts.data.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <Link to={`/attempts/${a.id}`} className="group flex items-center gap-4 py-3">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold ${
                          a.score === a.total ? 'bg-gold text-navy' : 'bg-lavender text-primary'
                        }`}
                      >
                        {Math.round((a.score / a.total) * 100)}%
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold group-hover:text-primary">{a.quiz_title}</p>
                        <p className="text-xs font-semibold text-slate">
                          {a.score}/{a.total} correct · {timeAgo(a.submitted_at)}
                        </p>
                      </div>
                      <span className="chip bg-gold-soft text-[#8a5a00]">+{a.xp_awarded} XP</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate">No quizzes yet. Your results will show up here.</p>
            )}
          </motion.section>
        </div>

        <div className="space-y-6">
          {/* Streak week */}
          <motion.section variants={rise} className="card p-6">
            <div className="flex items-center gap-3">
              <motion.span
                animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
                className={`grid size-12 place-items-center rounded-2xl ${streak > 0 ? 'bg-coral text-white' : 'bg-line text-slate'}`}
              >
                <Flame className={`size-6 ${streak > 0 ? 'fill-white' : ''}`} />
              </motion.span>
              <div>
                <p className="text-xl font-extrabold">{streak} day streak</p>
                <p className="text-xs font-semibold text-slate">Finish a quiz each day to grow it</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {week.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05, type: 'spring' }}
                    className={`grid size-8 place-items-center rounded-full ${
                      day.active ? 'bg-coral text-white' : day.today ? 'border-2 border-dashed border-coral/50' : 'bg-line'
                    }`}
                  >
                    {day.active && <Flame className="size-4 fill-white" />}
                  </motion.span>
                  <span className={`text-[11px] font-extrabold ${day.today ? 'text-coral' : 'text-slate'}`}>{day.label}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Badges */}
          <motion.section variants={rise} className="card p-6">
            <h2 className="text-xl">Badges</h2>
            <p className="text-xs font-semibold text-slate">
              {d.badges.length} of {Math.max(BADGE_CATALOG.length, d.badges.length)} unlocked
            </p>
            <ul className="mt-4 space-y-3">
              {d.badges.map((b, i) => (
                <motion.li
                  key={b.code}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <BadgeIcon code={b.code} size="size-12" iconSize="size-6" />
                  <div className="min-w-0">
                    <p className="font-extrabold">{b.name}</p>
                    <p className="text-xs text-slate">{b.description}</p>
                  </div>
                </motion.li>
              ))}
              {lockedBadges.map((b) => (
                <li key={b.code} className="flex items-center gap-3 opacity-80">
                  <BadgeIcon code={b.code} locked size="size-12" iconSize="size-6" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate">{b.name}</p>
                    <p className="text-xs text-slate">{b.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
