import { motion } from 'framer-motion';
import { ChevronRight, Crown, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAttempts } from '../api/queries.js';
import { EmptyState, ErrorState, ProgressBar, Skeleton } from '../components/ui.jsx';
import { rise, stagger } from '../lib/motion.js';
import { formatDate } from '../lib/gamify.js';

export default function HistoryPage() {
  const { data: attempts, isPending, isError, error, refetch } = useAttempts();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const totalXp = attempts.reduce((sum, a) => sum + a.xp_awarded, 0);
  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score / a.total, 0) / attempts.length * 100) : 0;

  return (
    <motion.div variants={stagger(0.06)} initial="initial" animate="animate" className="space-y-6">
      <motion.header variants={rise}>
        <p className="text-xs font-extrabold uppercase tracking-wider text-primary">Your journey</p>
        <h1 className="mt-1 text-3xl">Quiz history</h1>
      </motion.header>

      {!attempts.length ? (
        <EmptyState title="No attempts yet" action={<Link to="/quizzes" className="btn btn-primary mt-2">Start your first quiz</Link>}>
          Complete a quiz and your results, XP and answer breakdown will appear here.
        </EmptyState>
      ) : (
        <>
          <motion.div variants={rise} className="grid grid-cols-3 gap-3">
            {[
              ['Quizzes', attempts.length, 'bg-aqua-soft'],
              ['XP earned', totalXp, 'bg-gold-soft'],
              ['Avg. score', `${avg}%`, 'bg-lavender'],
            ].map(([label, value, bg]) => (
              <div key={label} className={`rounded-3xl p-4 ${bg}`}>
                <p className="text-2xl font-extrabold tabular-nums">{value}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate">{label}</p>
              </div>
            ))}
          </motion.div>

          <ul className="space-y-3">
            {attempts.map((a) => {
              const pct = Math.round((a.score / a.total) * 100);
              const perfect = a.score === a.total;
              return (
                <motion.li key={a.id} variants={rise}>
                  <Link to={`/attempts/${a.id}`} className="card group flex items-center gap-4 p-4 transition-shadow hover:shadow-pop sm:p-5">
                    <span
                      className={`grid size-14 shrink-0 place-items-center rounded-2xl text-base font-extrabold ${
                        perfect ? 'bg-gold text-navy' : pct >= 50 ? 'bg-aqua-soft text-aqua-dark' : 'bg-coral-soft text-coral-dark'
                      }`}
                    >
                      {perfect ? <Crown className="size-6" /> : `${pct}%`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold group-hover:text-primary">{a.quiz_title}</p>
                      <p className="text-xs font-semibold text-slate">
                        {a.score}/{a.total} correct · {formatDate(a.submitted_at)}
                      </p>
                      <ProgressBar value={a.score / a.total} tone={perfect ? 'gold' : 'aqua'} className="mt-2 h-2" label="Score" />
                    </div>
                    <span className="chip hidden bg-gold-soft text-[#8a5a00] sm:inline-flex">
                      <Zap className="size-3.5 fill-gold text-gold-dark" /> +{a.xp_awarded}
                    </span>
                    <ChevronRight className="size-5 text-slate transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </>
      )}
    </motion.div>
  );
}
