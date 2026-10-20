import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, History, House, LogOut, Trophy } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAttempts, useDashboard } from '../api/queries.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { levelFor, streakFrom } from '../lib/gamify.js';
import { pageMotion } from '../lib/motion.js';
import { ActiveIndicator, Avatar, Logo, StatPill } from './ui.jsx';

const NAV = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/quizzes', label: 'Learn', icon: BookOpen },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/history', label: 'History', icon: History },
];

export default function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: dash } = useDashboard();
  const { data: attempts } = useAttempts();
  const [loggingOut, setLoggingOut] = useState(false);

  const xp = dash?.xp ?? user?.xp ?? 0;
  const { streak } = streakFrom(attempts);
  const lvl = levelFor(xp);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout().catch(() => {});
  };

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-2 border-line bg-white px-4 py-6 lg:flex">
        <div className="px-3">
          <Logo to="/dashboard" />
        </div>
        <nav className="mt-8 flex flex-col gap-1.5" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="relative">
              {({ isActive }) => (
                <span
                  className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold uppercase tracking-wide transition-colors ${
                    isActive ? 'text-primary' : 'text-slate hover:bg-surface hover:text-navy'
                  }`}
                >
                  <ActiveIndicator show={isActive}>
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-2xl border-2 border-primary/30 bg-lavender"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  </ActiveIndicator>
                  <Icon className="relative size-5" strokeWidth={2.5} />
                  <span className="relative">{label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-surface p-3">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} seed={user?.id} />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{user?.name}</p>
                <p className="text-xs font-semibold text-slate">
                  Level {lvl.level} · {lvl.title}
                </p>
              </div>
            </div>
          </div>
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="btn btn-ghost w-full">
            <LogOut className="size-4" /> {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b-2 border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="lg:hidden">
            <Logo to="/dashboard" />
          </div>
          <p className="hidden text-sm font-semibold text-slate lg:block">
            Welcome back, <span className="font-extrabold text-navy">{user?.name?.split(' ')[0]}</span>
          </p>
          <div className="flex items-center gap-2">
            <StatPill icon="Flame" tone="coral" value={streak} label="day streak" />
            <StatPill icon="Zap" tone="gold" value={xp} label="XP" />
            {dash && <span className="hidden sm:inline-flex"><StatPill icon="Trophy" tone="primary" value={`#${dash.rank}`} label="rank" /></span>}
            <button
              type="button"
              onClick={handleLogout}
              className="grid size-9 place-items-center rounded-xl text-slate hover:bg-surface lg:hidden"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...pageMotion}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="relative flex flex-col items-center gap-1 py-2.5">
              {({ isActive }) => (
                <>
                  <ActiveIndicator show={isActive}>
                    <motion.span layoutId="tab-active" className="absolute top-0 h-1 w-10 rounded-b-full bg-primary" />
                  </ActiveIndicator>
                  <motion.span
                    animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                    className={`grid size-9 place-items-center rounded-xl ${isActive ? 'bg-lavender text-primary' : 'text-slate'}`}
                  >
                    <Icon className="size-5" strokeWidth={2.5} />
                  </motion.span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wide ${isActive ? 'text-primary' : 'text-slate'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
