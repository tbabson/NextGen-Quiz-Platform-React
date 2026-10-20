import { motion } from 'framer-motion';
import { ArrowRight, Check, Flame, Footprints, Gamepad2, Route, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo, Mascot } from '../components/ui.jsx';
import { pageMotion, rise, stagger } from '../lib/motion.js';

const PILLARS = [
  {
    icon: Flame,
    tone: 'bg-coral-soft text-coral-dark',
    title: 'Progress that keeps you going',
    body: 'Earn XP for every correct answer, level up, keep your daily streak alive and unlock badges as you grow.',
  },
  {
    icon: Gamepad2,
    tone: 'bg-lavender text-primary',
    title: 'Quizzes that feel like a game',
    body: 'Bold, colourful answer tiles, one question at a time, and a live leaderboard to see how you stack up.',
  },
  {
    icon: Route,
    tone: 'bg-aqua-soft text-aqua-dark',
    title: 'Structured skill paths',
    body: 'Work through focused quizzes on a clear learning path, then review a question-by-question breakdown.',
  },
];

const HERO_TILES = [
  { text: 'HTTP', tone: 'bg-coral text-white' },
  { text: 'FTP', tone: 'bg-primary text-white' },
  { text: 'HTTPS', tone: 'bg-aqua text-navy' },
  { text: 'SMTP', tone: 'bg-gold text-navy' },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.2 }}
        className="card relative z-10 p-5 shadow-pop"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-aqua"
              initial={{ width: '15%' }}
              animate={{ width: '62%' }}
              transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="chip bg-gold-soft text-[#8a5a00]">
            <Zap className="size-3.5 fill-gold text-gold-dark" /> +10
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate">Question 5 of 12</p>
        <p className="mt-1 text-lg font-extrabold leading-snug">Which protocol encrypts traffic between your browser and a website?</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {HERO_TILES.map(({ text: label, tone }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: i === 2 ? [1, 1.06, 1] : 1 }}
              transition={{ delay: 0.5 + i * 0.08, scale: { delay: 2.2, duration: 0.5 } }}
              className={`relative flex h-14 items-center justify-center rounded-2xl text-sm font-extrabold ${tone}`}
            >
              {label}
              {i === 2 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2.3, type: 'spring', stiffness: 400 }}
                  className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-success text-white ring-2 ring-white"
                >
                  <Check className="size-3.5" strokeWidth={3.5} />
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating reward chips */}
      <motion.div
        className="absolute -top-6 -left-4 z-20 sm:-left-10"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ delay: 0.9, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <div className="card flex items-center gap-2 px-3 py-2">
          <span className="grid size-8 place-items-center rounded-xl bg-coral text-white"><Flame className="size-4 fill-white" /></span>
          <div>
            <p className="text-sm font-extrabold leading-none">7 day streak</p>
            <p className="text-[11px] font-semibold text-slate">Keep it up!</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="absolute -right-2 -bottom-8 z-20 sm:-right-8"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: [0, 8, 0] }}
        transition={{ delay: 1.1, y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <div className="card flex items-center gap-2 px-3 py-2">
          <span className="grid size-8 place-items-center rounded-xl bg-gold text-navy"><Trophy className="size-4" /></span>
          <div>
            <p className="text-sm font-extrabold leading-none">Badge unlocked</p>
            <p className="text-[11px] font-semibold text-slate">Perfect Score</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="absolute -top-24 right-6 z-0 hidden sm:block"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Mascot size={96} mood="cheer" />
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <motion.div {...pageMotion} className="min-h-dvh overflow-x-clip">
      {/* Decorative backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_60%_at_80%_10%,rgba(98,70,234,0.16),transparent),radial-gradient(40%_50%_at_10%_30%,rgba(0,191,166,0.12),transparent)]" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn btn-ghost px-4 py-2.5">Log in</Link>
          <Link to="/register" className="btn btn-primary hidden px-4 py-2.5 sm:inline-flex">Get started</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-10 pb-24 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <motion.div variants={stagger(0.08)} initial="initial" animate="animate">
          <motion.span variants={rise} className="chip bg-lavender text-primary">
            <Sparkles className="size-3.5" /> Learn by playing
          </motion.span>
          <motion.h1 variants={rise} className="mt-5 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
            Level up your skills,{' '}
            <span className="relative inline-block text-primary">
              one quiz
              <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 w-full" aria-hidden="true">
                <motion.path
                  d="M2 9 Q 100 -2 198 8"
                  stroke="var(--color-gold)"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              </svg>
            </span>{' '}
            at a time.
          </motion.h1>
          <motion.p variants={rise} className="mt-6 max-w-lg text-lg font-medium text-slate">
            Answer bite-sized questions, earn XP and badges, build a streak, and race your classmates to the top of
            the leaderboard.
          </motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn btn-primary px-7 py-4 text-base">
              Start learning free <ArrowRight className="size-5" />
            </Link>
            <Link to="/login" className="btn btn-ghost px-7 py-4 text-base">I have an account</Link>
          </motion.div>
          <motion.ul variants={rise} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate">
            {[
              [Zap, 'XP & levels'],
              [Target, 'Server-graded'],
              [Footprints, 'Badges'],
            ].map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-4 text-aqua" strokeWidth={2.6} /> {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <HeroVisual />
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl">Everything that makes learning stick</h2>
            <p className="mt-3 text-slate">Motivation, competition and structure, built into one platform.</p>
          </div>
          <motion.div
            className="mt-12 grid gap-5 md:grid-cols-3"
            variants={stagger(0.1)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
          >
            {PILLARS.map(({ icon: Icon, tone, title, body }) => (
              <motion.article
                key={title}
                variants={rise}
                whileHover={{ y: -6 }}
                className="card p-7"
              >
                <span className={`grid size-14 place-items-center rounded-2xl ${tone}`}>
                  <Icon className="size-7" strokeWidth={2.4} />
                </span>
                <h3 className="mt-5 text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 overflow-hidden rounded-4xl bg-primary px-6 py-14 text-center text-white sm:px-12"
        >
          <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-aqua/25" />
          <Mascot size={96} mood="cheer" />
          <h2 className="relative text-3xl text-white sm:text-4xl">Ready to earn your first badge?</h2>
          <p className="relative max-w-md text-white/80">It takes under a minute to sign up. Your first quiz is waiting.</p>
          <Link to="/register" className="btn btn-gold relative px-8 py-4 text-base">
            Create my account <ArrowRight className="size-5" />
          </Link>
        </motion.div>
      </section>

      <footer className="pb-10 text-center text-xs font-semibold text-slate">
        PUNCH NextGen Quiz &amp; Rewards · Built for learners
      </footer>
    </motion.div>
  );
}
