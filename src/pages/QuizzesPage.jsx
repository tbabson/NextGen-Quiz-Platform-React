import { motion } from 'framer-motion';
import { ArrowRight, Check, Crown, ListChecks, Play, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuizzes } from '../api/queries.js';
import { EmptyState, ErrorState, Mascot, ProgressBar, Skeleton } from '../components/ui.jsx';
import { rise, stagger } from '../lib/motion.js';

// Zigzag offsets for path nodes (in px), giving the winding learning-path look.
const OFFSETS = [0, 44, 72, 44, 0, -44, -72, -44];

function PathNode({ quiz, index, isNext }) {
  const done = quiz.completed;
  const perfect = done && quiz.attempt && quiz.attempt.score === quiz.attempt.total;
  const to = done && quiz.attempt ? `/attempts/${quiz.attempt.id}` : `/play/${quiz.id}`;
  const style = done
    ? 'bg-gold text-navy shadow-[0_6px_0_0_var(--color-gold-dark)]'
    : isNext
      ? 'bg-aqua text-navy shadow-[0_6px_0_0_var(--color-aqua-dark)]'
      : 'bg-primary text-white shadow-[0_6px_0_0_var(--color-primary-deep)]';

  return (
    <div className="relative" style={{ transform: `translateX(${OFFSETS[index % OFFSETS.length]}px)` }}>
      {isNext && (
        <motion.span
          className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-line bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-aqua-dark shadow-card"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          Start
          <span className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-line bg-white" />
        </motion.span>
      )}
      {isNext && (
        <motion.span
          className="absolute inset-0 rounded-full bg-aqua"
          animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94, y: 4 }}>
        <Link
          to={to}
          aria-label={`${quiz.title}${done ? ' (completed)' : ''}`}
          className={`relative grid size-20 place-items-center rounded-full transition-shadow ${style}`}
        >
          {done ? (
            perfect ? <Crown className="size-9" strokeWidth={2.4} /> : <Check className="size-9" strokeWidth={3} />
          ) : isNext ? (
            <Play className="size-8 fill-navy" />
          ) : (
            <Star className="size-8 fill-white" />
          )}
        </Link>
      </motion.div>
    </div>
  );
}

function QuizCard({ quiz, isNext }) {
  const done = quiz.completed;
  const a = quiz.attempt;
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className={`card flex-1 p-5 ${isNext ? 'border-2 border-aqua/50' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {done ? (
          <span className="chip bg-success-soft text-success"><Check className="size-3.5" strokeWidth={3} /> Completed</span>
        ) : isNext ? (
          <span className="chip bg-aqua-soft text-aqua-dark">Up next</span>
        ) : (
          <span className="chip bg-lavender text-primary">Available</span>
        )}
        <span className="chip bg-surface text-slate"><ListChecks className="size-3.5" /> {quiz.question_count} questions</span>
        <span className="chip bg-gold-soft text-[#8a5a00]"><Zap className="size-3.5 fill-gold text-gold-dark" /> {quiz.max_xp} XP max</span>
      </div>
      <h3 className="mt-3 text-xl">{quiz.title}</h3>
      <p className="mt-1 text-sm text-slate">{quiz.description}</p>

      {done && a ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate">
            <span>{a.score}/{a.total} correct</span>
            <span className="text-[#8a5a00]">+{a.xp_awarded} XP earned</span>
          </div>
          <ProgressBar value={a.score / a.total} tone={a.score === a.total ? 'gold' : 'aqua'} className="mt-1.5 h-2.5" label="Score" />
          <Link to={`/attempts/${a.id}`} className="btn btn-ghost mt-4 w-full sm:w-auto">
            Review answers <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <Link to={`/play/${quiz.id}`} className={`btn mt-4 w-full sm:w-auto ${isNext ? 'btn-aqua' : 'btn-primary'}`}>
          Start quiz <ArrowRight className="size-4" />
        </Link>
      )}
    </motion.article>
  );
}

export default function QuizzesPage() {
  const { data: quizzes, isPending, isError, error, refetch } = useQuizzes();

  if (isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28" />
        {[0, 1].map((i) => <Skeleton key={i} className="h-44" />)}
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!quizzes.length) return <EmptyState title="No quizzes yet">New quizzes are on their way. Check back soon!</EmptyState>;

  const completed = quizzes.filter((q) => q.completed).length;
  const nextId = quizzes.find((q) => !q.completed)?.id;
  const allDone = completed === quizzes.length;

  return (
    <motion.div variants={stagger(0.08)} initial="initial" animate="animate" className="space-y-8">
      <motion.header variants={rise} className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary">Learning path</p>
          <h1 className="mt-1 text-3xl">Your quizzes</h1>
          <p className="mt-1 text-sm text-slate">Earn 10 XP per correct answer, plus a 20 XP bonus for a perfect score.</p>
        </div>
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-sm font-extrabold">
            <span>Progress</span>
            <span className="text-aqua-dark">{completed}/{quizzes.length}</span>
          </div>
          <ProgressBar value={completed / quizzes.length} className="mt-2 h-4" label="Path progress" />
        </div>
      </motion.header>

      <div className="relative">
        <ol className="relative space-y-10">
          {quizzes.map((quiz, i) => (
            <motion.li key={quiz.id} variants={rise} className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-center">
              <div className="flex w-full shrink-0 justify-center pt-8 sm:w-56 sm:pt-6">
                <PathNode quiz={quiz} index={i} isNext={quiz.id === nextId} />
              </div>
              <QuizCard quiz={quiz} isNext={quiz.id === nextId} />
            </motion.li>
          ))}

          {/* Finish line */}
          <motion.li variants={rise} className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-center">
            <div className="flex w-full shrink-0 justify-center sm:w-56">
              <motion.span
                animate={allDone ? { rotate: [0, -8, 8, 0] } : {}}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
                className={`grid size-24 place-items-center rounded-full ${
                  allDone ? 'bg-gold shadow-[0_6px_0_0_var(--color-gold-dark)]' : 'bg-line'
                }`}
              >
                <Mascot size={72} mood={allDone ? 'cheer' : 'think'} />
              </motion.span>
            </div>
            <div className="flex-1 rounded-3xl border-2 border-dashed border-line p-5">
              <p className="font-extrabold">{allDone ? 'Path complete! You finished every quiz.' : 'Finish line'}</p>
              <p className="text-sm text-slate">
                {allDone ? 'Amazing work. See how you rank against everyone else.' : 'Complete every quiz to finish this path.'}
              </p>
              {allDone && (
                <Link to="/leaderboard" className="btn btn-gold mt-4">
                  View leaderboard <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </motion.li>
        </ol>
      </div>
    </motion.div>
  );
}
