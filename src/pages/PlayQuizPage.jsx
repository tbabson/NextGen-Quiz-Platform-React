import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ListChecks, Send, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { AFTER_SUBMIT_KEYS } from '../api/queries.js';
import { ErrorState, FullScreenLoader, Mascot, ProgressBar, Spinner } from '../components/ui.jsx';

/* ---------- answer tiles: four colours + shapes, so colour is never the only cue ---------- */

const TILE_STYLES = [
  { bg: 'bg-coral', text: 'text-white', edge: 'var(--color-coral-dark)', shape: 'triangle' },
  { bg: 'bg-primary', text: 'text-white', edge: 'var(--color-primary-deep)', shape: 'diamond' },
  { bg: 'bg-aqua', text: 'text-navy', edge: 'var(--color-aqua-dark)', shape: 'circle' },
  { bg: 'bg-gold', text: 'text-navy', edge: 'var(--color-gold-dark)', shape: 'square' },
];

function Shape({ shape, className = 'size-6' }) {
  const paths = {
    triangle: <path d="M12 3 22 20H2z" />,
    diamond: <path d="M12 2 22 12 12 22 2 12z" />,
    circle: <circle cx="12" cy="12" r="10" />,
    square: <rect x="3" y="3" width="18" height="18" rx="3" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      {paths[shape]}
    </svg>
  );
}

/* ---------- draft persistence (answers + idempotency key survive a reload) ---------- */

const draftKey = (quizId) => `quiz-draft:${quizId}`;

function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function loadDraft(quizId) {
  try {
    const raw = sessionStorage.getItem(draftKey(quizId));
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable: start fresh */
  }
  return null;
}

function saveDraft(quizId, draft) {
  try {
    sessionStorage.setItem(draftKey(quizId), JSON.stringify(draft));
  } catch {
    /* non-essential */
  }
}

function clearDraft(quizId) {
  try {
    sessionStorage.removeItem(draftKey(quizId));
  } catch {
    /* non-essential */
  }
}

/* ---------- screens ---------- */

function Countdown({ quiz, onDone }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n === 0) {
      const t = setTimeout(onDone, 550);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((x) => x - 1), 700);
    return () => clearTimeout(t);
  }, [n, onDone]);

  return (
    <div className="grid min-h-dvh place-items-center overflow-hidden bg-primary px-4 text-white">
      <div className="pointer-events-none absolute -top-32 -left-32 size-[28rem] rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-aqua/20" />
      <div className="relative flex flex-col items-center text-center">
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/70">
          Get ready
        </motion.p>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 max-w-lg text-3xl text-white sm:text-4xl">
          {quiz.title}
        </motion.h1>
        <div className="mt-10 grid size-40 place-items-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={n}
              initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className={`grid size-36 place-items-center rounded-full text-6xl font-extrabold ${
                n === 0 ? 'bg-gold text-navy' : 'bg-white text-primary'
              }`}
            >
              {n === 0 ? 'Go!' : n}
            </motion.span>
          </AnimatePresence>
        </div>
        <p className="mt-10 text-sm font-bold text-white/70">
          {quiz.question_count} questions · up to {quiz.max_xp} XP
        </p>
      </div>
    </div>
  );
}

function ExitDialog({ onStay, onLeave }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end bg-navy/50 p-4 backdrop-blur-sm sm:place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onStay}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        initial={{ y: 40, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-sm p-6 text-center"
      >
        <Mascot size={84} mood="sad" className="mx-auto" />
        <h2 id="exit-title" className="mt-3 text-xl">Leave this quiz?</h2>
        <p className="mt-1 text-sm text-slate">Your answers are saved for this session, so you can pick up where you left off.</p>
        <div className="mt-5 grid gap-2">
          <button type="button" className="btn btn-primary" onClick={onStay} autoFocus>
            Keep going
          </button>
          <button type="button" className="btn btn-ghost text-coral-dark" onClick={onLeave}>
            Leave quiz
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuestionView({ question, index, total, selected, onSelect }) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col"
    >
      <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
        Question {index + 1} of {total}
      </p>
      <h1 className="mt-2 text-2xl leading-snug sm:text-3xl">{question.text}</h1>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4" role="radiogroup" aria-label="Answer options">
        {question.options.map((opt, i) => {
          const tile = TILE_STYLES[i % TILE_STYLES.length];
          const isSelected = selected === opt.id;
          const dimmed = selected && !isSelected;
          return (
            <motion.button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(opt.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: dimmed ? 0.45 : 1, y: 0, scale: isSelected ? 1.02 : 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 26 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97, y: 3 }}
              style={{ boxShadow: `0 5px 0 0 ${tile.edge}` }}
              className={`relative flex min-h-20 items-center gap-4 rounded-2xl px-5 py-4 text-left text-base font-extrabold sm:min-h-28 sm:text-lg ${tile.bg} ${tile.text} ${
                isSelected ? 'ring-4 ring-navy ring-offset-2 ring-offset-surface' : ''
              }`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/10">
                <Shape shape={tile.shape} className="size-5" />
              </span>
              <span className="flex-1">{opt.text}</span>
              <span className="hidden text-xs font-extrabold opacity-60 sm:block">{i + 1}</span>
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2.5 -right-2.5 grid size-8 place-items-center rounded-full bg-navy text-white ring-4 ring-surface"
                  >
                    <Check className="size-4" strokeWidth={3.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-5 hidden text-center text-xs font-semibold text-slate sm:block">
        Tip: press <kbd className="rounded bg-line px-1.5 py-0.5 font-bold">1</kbd>–<kbd className="rounded bg-line px-1.5 py-0.5 font-bold">{question.options.length}</kbd> to pick,{' '}
        <kbd className="rounded bg-line px-1.5 py-0.5 font-bold">Enter</kbd> to continue
      </p>
    </motion.div>
  );
}

function ReviewView({ quiz, answers, onJump }) {
  const answered = quiz.questions.filter((q) => answers[q.id]).length;
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-3xl flex-1"
    >
      <div className="flex items-center gap-4">
        <Mascot size={72} mood={answered === quiz.questions.length ? 'cheer' : 'think'} />
        <div>
          <h1 className="text-2xl sm:text-3xl">Review your answers</h1>
          <p className="text-sm text-slate">
            {answered} of {quiz.questions.length} answered. Tap any question to change it.
          </p>
        </div>
      </div>
      <ol className="mt-6 grid gap-2.5">
        {quiz.questions.map((q, i) => {
          const optIndex = q.options.findIndex((o) => o.id === answers[q.id]);
          const opt = q.options[optIndex];
          const tile = optIndex >= 0 ? TILE_STYLES[optIndex % TILE_STYLES.length] : null;
          return (
            <motion.li key={q.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <button
                type="button"
                onClick={() => onJump(i)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left transition-colors hover:border-primary/40 ${
                  opt ? 'border-line' : 'border-coral/50 bg-coral-soft/40'
                }`}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface text-sm font-extrabold text-slate">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{q.text}</span>
                  <span className={`block truncate text-xs font-semibold ${opt ? 'text-slate' : 'text-coral-dark'}`}>
                    {opt ? opt.text : 'Not answered yet'}
                  </span>
                </span>
                {tile ? (
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tile.bg} ${tile.text}`}>
                    <Shape shape={tile.shape} className="size-4" />
                  </span>
                ) : (
                  <AlertTriangle className="size-5 shrink-0 text-coral" />
                )}
              </button>
            </motion.li>
          );
        })}
      </ol>
    </motion.div>
  );
}

function SubmittingOverlay() {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-primary/95 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <Mascot size={120} mood="think" />
        <p className="text-2xl font-extrabold">Grading your answers…</p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-3 rounded-full bg-gold"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- page ---------- */

export default function PlayQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: quiz, isPending, isError, error, refetch } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => api.quiz(id),
    staleTime: 0,
  });

  const [phase, setPhase] = useState('countdown'); // countdown | play | review
  const [draft, setDraft] = useState(() => loadDraft(id) ?? { answers: {}, index: 0, key: newIdempotencyKey() });
  const [confirmExit, setConfirmExit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Resume straight into the quiz if the learner already had answers this session.
  useEffect(() => {
    if (Object.keys(draft.answers).length) setPhase('play');
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => saveDraft(id, draft), [id, draft]);

  const questions = useMemo(() => quiz?.questions ?? [], [quiz]);
  const question = questions[draft.index];
  const total = questions.length;
  const answeredCount = questions.filter((q) => draft.answers[q.id]).length;

  const select = useCallback(
    (optionId) => setDraft((d) => ({ ...d, answers: { ...d.answers, [question.id]: optionId } })),
    [question],
  );

  const goTo = useCallback((index) => {
    setDraft((d) => ({ ...d, index }));
    setPhase('play');
  }, []);

  const next = useCallback(() => {
    if (!question || !draft.answers[question.id]) return;
    if (draft.index + 1 < total) setDraft((d) => ({ ...d, index: d.index + 1 }));
    else setPhase('review');
  }, [question, draft, total]);

  const back = () => {
    if (phase === 'review') setPhase('play');
    else if (draft.index > 0) setDraft((d) => ({ ...d, index: d.index - 1 }));
  };

  const submit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    const answers = questions.map((q) => ({ question_id: q.id, option_id: draft.answers[q.id] }));
    try {
      // The same key is reused on any retry, so a double click or a flaky network can never double-award XP.
      const { result, replayed } = await api.submitQuiz(id, answers, draft.key);
      clearDraft(id);
      queryClient.setQueryData(['attempt', result.id], result);
      AFTER_SUBMIT_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      queryClient.removeQueries({ queryKey: ['quiz', id] });
      navigate(`/attempts/${result.id}`, { replace: true, state: { fresh: !replayed } });
    } catch (err) {
      setSubmitting(false);
      if (err.code === 'QUIZ_ALREADY_COMPLETED') {
        clearDraft(id);
        const attemptId = err.details?.[0]?.attempt_id;
        AFTER_SUBMIT_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
        if (attemptId) return navigate(`/attempts/${attemptId}`, { replace: true });
      }
      if (err.code === 'VALIDATION_FAILED') setPhase('review');
      setSubmitError(err);
    }
  };

  // Keyboard: 1–9 choose an option, Enter continues, Escape asks to exit.
  useEffect(() => {
    if (phase !== 'play' || !question || submitting) return undefined;
    const onKey = (e) => {
      if (confirmExit || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length) select(question.options[n - 1].id);
      else if (e.key === 'Enter') next();
      else if (e.key === 'Escape') setConfirmExit(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, question, select, next, confirmExit, submitting]);

  if (isPending) return <FullScreenLoader />;
  if (isError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          error={error}
          title={error.status === 404 ? 'Quiz not found' : "Couldn't load this quiz"}
          onRetry={error.status === 404 ? undefined : refetch}
        />
        <div className="mt-4 text-center">
          <Link to="/quizzes" className="btn btn-ghost">Back to quizzes</Link>
        </div>
      </div>
    );
  }
  // One rewarded completion per quiz: send finished quizzes to their results.
  if (quiz.completed && quiz.attempt_id) {
    clearDraft(id);
    return <Navigate to={`/attempts/${quiz.attempt_id}`} replace />;
  }

  if (phase === 'countdown') return <Countdown quiz={quiz} onDone={() => setPhase('play')} />;

  const progress = phase === 'review' ? 1 : answeredCount / total;
  const canContinue = phase === 'play' && question && draft.answers[question.id];

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 pt-5 sm:px-6">
        <button
          type="button"
          onClick={() => setConfirmExit(true)}
          className="grid size-10 shrink-0 place-items-center rounded-xl text-slate hover:bg-line"
          aria-label="Exit quiz"
        >
          <X className="size-6" strokeWidth={2.6} />
        </button>
        <ProgressBar value={progress} className="h-4" delay={0} label="Quiz progress" />
        <span className="chip shrink-0 bg-gold-soft text-sm text-[#8a5a00]">
          <Zap className="size-4 fill-gold text-gold-dark" /> {quiz.max_xp}
        </span>
      </header>

      <main className="flex flex-1 flex-col px-4 pt-8 pb-36 sm:px-6 sm:pt-12">
        <AnimatePresence mode="wait">
          {phase === 'review' ? (
            <ReviewView key="review" quiz={quiz} answers={draft.answers} onJump={goTo} />
          ) : (
            question && (
              <QuestionView
                key={question.id}
                question={question}
                index={draft.index}
                total={total}
                selected={draft.answers[question.id]}
                onSelect={select}
              />
            )
          )}
        </AnimatePresence>
      </main>

      {/* Footer action bar */}
      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)]">
        <AnimatePresence>
          {submitError && (
            <motion.div
              role="alert"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-danger-soft"
            >
              <p className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 text-sm font-bold text-danger sm:px-6">
                <AlertTriangle className="size-4 shrink-0" />
                {submitError.message}
                {submitError.code === 'NETWORK_ERROR' && ' Your answers are safe: tap Submit to retry.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={back}
            disabled={phase === 'play' && draft.index === 0}
            className="btn btn-ghost"
          >
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back</span>
          </button>

          {phase === 'play' && (
            <button type="button" onClick={() => setPhase('review')} className="btn btn-ghost hidden sm:inline-flex">
              <ListChecks className="size-4" /> Review
            </button>
          )}

          {phase === 'review' ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || answeredCount < total}
              className="btn btn-aqua flex-1 py-4 text-base sm:flex-none sm:px-10"
            >
              {submitting ? <Spinner /> : <><Send className="size-4" /> Submit answers</>}
            </button>
          ) : (
            <motion.button
              type="button"
              onClick={next}
              disabled={!canContinue}
              animate={canContinue ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="btn btn-primary flex-1 py-4 text-base sm:flex-none sm:px-10"
            >
              {draft.index + 1 === total ? 'Review answers' : 'Continue'} <ArrowRight className="size-4" />
            </motion.button>
          )}
        </div>
      </footer>

      <AnimatePresence>
        {confirmExit && <ExitDialog onStay={() => setConfirmExit(false)} onLeave={() => navigate('/quizzes')} />}
      </AnimatePresence>
      <AnimatePresence>{submitting && <SubmittingOverlay />}</AnimatePresence>
    </div>
  );
}
