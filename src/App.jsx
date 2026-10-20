import { AnimatePresence, useIsPresent } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import { FullScreenLoader } from './components/ui.jsx';
import AttemptPage from './pages/AttemptPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PlayQuizPage from './pages/PlayQuizPage.jsx';
import QuizzesPage from './pages/QuizzesPage.jsx';

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

// AnimatePresence keeps the previous route tree mounted while it animates out. Two traps on sign-in/out:
//  - A <Navigate> in that exiting tree re-fires on every render (its `state` object is new each time),
//    navigating in an endless loop.
//  - Rendering null there instead unmounts the motion element that must finish the exit animation,
//    so AnimatePresence (mode="wait") never mounts the next page: a blank screen.
// So only the live tree redirects; the exiting tree keeps its old content while it fades out.

function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  const isPresent = useIsPresent();
  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'anonymous' && isPresent) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function GuestOnly({ children }) {
  const { status } = useAuth();
  const isPresent = useIsPresent();
  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'authenticated' && isPresent) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  // Transition between route groups here; AppShell animates its own pages so the nav stays mounted.
  const path = location.pathname;
  const groupKey = path.startsWith('/play/') ? 'play' : PUBLIC_PATHS.has(path) ? path : 'app';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={groupKey}>
        <Route path="/" element={<GuestOnly><LandingPage /></GuestOnly>} />
        <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />

        {/* Full-screen, distraction-free quiz player (no nav) */}
        <Route path="/play/:id" element={<RequireAuth><PlayQuizPage /></RequireAuth>} />

        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/attempts/:id" element={<AttemptPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}
