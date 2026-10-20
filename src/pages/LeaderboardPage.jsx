import { motion } from 'framer-motion';
import { Crown, Medal, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard, useLeaderboard } from '../api/queries.js';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../components/ui.jsx';
import { rise, stagger } from '../lib/motion.js';

const PODIUM = {
  1: { height: 'h-36 sm:h-44', bg: 'bg-gold', edge: 'var(--color-gold-dark)', text: 'text-navy', ring: 'ring-gold', delay: 0.35 },
  2: { height: 'h-28 sm:h-32', bg: 'bg-primary', edge: 'var(--color-primary-deep)', text: 'text-white', ring: 'ring-primary', delay: 0.15 },
  3: { height: 'h-20 sm:h-24', bg: 'bg-aqua', edge: 'var(--color-aqua-dark)', text: 'text-navy', ring: 'ring-aqua', delay: 0.5 },
};

function PodiumSpot({ entry, place }) {
  const p = PODIUM[place];
  if (!entry) return <div className="flex-1" />;
  return (
    <div className="flex flex-1 flex-col items-center justify-end">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.6 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: p.delay + 0.35, type: 'spring', stiffness: 260, damping: 16 }}
        className="relative mb-3 flex flex-col items-center"
      >
        {place === 1 && (
          <motion.span
            className="absolute -top-7"
            animate={{ y: [0, -4, 0], rotate: [-6, 6, -6] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <Crown className="size-8 fill-gold text-gold-dark" />
          </motion.span>
        )}
        <Avatar
          name={entry.name}
          seed={entry.user_id}
          size={place === 1 ? 'size-16 sm:size-20 text-xl' : 'size-14 sm:size-16 text-lg'}
          className={`ring-4 ring-offset-2 ${p.ring}`}
        />
        <p className="mt-2 max-w-24 truncate text-center text-sm font-extrabold sm:max-w-32">
          {entry.is_current_user ? 'You' : entry.name.split(' ')[0]}
        </p>
        <p className="flex items-center gap-1 text-xs font-extrabold text-[#8a5a00]">
          <Zap className="size-3.5 fill-gold text-gold-dark" /> {entry.xp} XP
        </p>
      </motion.div>
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: p.delay, type: 'spring', stiffness: 120, damping: 18 }}
        style={{ originY: 1, boxShadow: `inset 0 -6px 0 0 ${p.edge}` }}
        className={`grid w-full place-items-start justify-center rounded-t-3xl pt-3 ${p.height} ${p.bg} ${p.text}`}
      >
        <span className="text-3xl font-extrabold sm:text-4xl">{entry.rank}</span>
      </motion.div>
    </div>
  );
}

export default function LeaderboardPage() {
  const board = useLeaderboard(20);
  const dash = useDashboard();

  if (board.isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (board.isError) return <ErrorState error={board.error} onRetry={board.refetch} />;

  const { leaderboard, current_user: me } = board.data;
  if (!leaderboard.length) {
    return (
      <EmptyState title="The board is empty" action={<Link to="/quizzes" className="btn btn-primary mt-2">Take a quiz</Link>}>
        Be the first to earn XP and claim the top spot.
      </EmptyState>
    );
  }

  const byRank = (place) => leaderboard[place - 1];
  const rest = leaderboard.slice(3);
  const meInList = leaderboard.some((e) => e.is_current_user);

  return (
    <motion.div variants={stagger(0.08)} initial="initial" animate="animate" className="space-y-6">
      <motion.header variants={rise} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary">Global ranking</p>
          <h1 className="mt-1 text-3xl">Leaderboard</h1>
          <p className="mt-1 text-sm text-slate">Ranked by XP. Ties go to whoever reached the score first.</p>
        </div>
        {me && (
          <div className="flex items-center gap-3 rounded-2xl bg-lavender px-4 py-2.5">
            <Medal className="size-5 text-primary" />
            <p className="text-sm font-extrabold text-primary">
              You're #{me.rank} of {me.total_players}
            </p>
          </div>
        )}
      </motion.header>

      {/* Podium */}
      <motion.section variants={rise} className="card overflow-hidden px-4 pt-12 sm:px-10">
        <div className="mx-auto flex max-w-xl items-end gap-3 sm:gap-5">
          <PodiumSpot entry={byRank(2)} place={2} />
          <PodiumSpot entry={byRank(1)} place={1} />
          <PodiumSpot entry={byRank(3)} place={3} />
        </div>
      </motion.section>

      {/* The rest */}
      {(rest.length > 0 || !meInList) && (
        <motion.section variants={rise} className="card overflow-hidden">
          <ol className="divide-y-2 divide-line">
            {rest.map((e, i) => (
              <motion.li
                key={e.user_id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.04 }}
                className={`flex items-center gap-4 px-5 py-3.5 ${e.is_current_user ? 'bg-lavender' : ''}`}
              >
                <span className="w-8 text-center text-lg font-extrabold text-slate">{e.rank}</span>
                <Avatar name={e.name} seed={e.user_id} />
                <p className={`min-w-0 flex-1 truncate font-extrabold ${e.is_current_user ? 'text-primary' : ''}`}>
                  {e.name} {e.is_current_user && <span className="chip ml-1 bg-primary text-white">You</span>}
                </p>
                <span className="flex items-center gap-1 font-extrabold tabular-nums text-[#8a5a00]">
                  <Zap className="size-4 fill-gold text-gold-dark" /> {e.xp}
                </span>
              </motion.li>
            ))}
            {!meInList && me && (
              <li className="flex items-center gap-4 border-t-4 border-dashed border-line bg-lavender px-5 py-3.5">
                <span className="w-8 text-center text-lg font-extrabold text-primary">{me.rank}</span>
                <Avatar name={dash.data?.name ?? 'You'} seed={dash.data?.id} />
                <p className="min-w-0 flex-1 truncate font-extrabold text-primary">
                  {dash.data?.name ?? 'You'} <span className="chip ml-1 bg-primary text-white">You</span>
                </p>
                <span className="flex items-center gap-1 font-extrabold tabular-nums text-[#8a5a00]">
                  <Zap className="size-4 fill-gold text-gold-dark" /> {dash.data?.xp ?? 0}
                </span>
              </li>
            )}
          </ol>
        </motion.section>
      )}
    </motion.div>
  );
}
