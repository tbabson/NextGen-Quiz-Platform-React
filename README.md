# PUNCH NextGen Quiz & Rewards: React client

The web client for the [NextGen Quiz Platform API](https://nextgen-quiz-platform-node.onrender.com). Students sign up, take quizzes, earn XP and badges, keep a daily streak and compete on a leaderboard.

## Design ideas borrowed

| Inspiration                            | What the client takes from it                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Duolingo** (progress and motivation) | XP levels, a daily streak with a 7-day strip, a winding learning path, chunky "pressable" buttons, a mascot ("Volt"), and badge-unlock moments |
| **Kahoot!** (competitive quizzes)      | A 3-2-1 countdown, four coloured answer tiles with shapes (so colour is never the only cue), one question at a time, and an animated podium    |
| **Codecademy** (structured learning)   | Course progress, a clear "up next" step, a review screen before submitting, and a question-by-question breakdown afterwards                    |

**Theme:** primary purple `#6246EA` (brand, navigation), aqua `#00BFA6` (learning progress), gold `#FFC857` (XP and rewards), coral `#FF6B6B` (streaks and challenges), on a soft `#F7F8FC` background with white cards. Dark text sits on gold and aqua surfaces. The font is Plus Jakarta Sans. All tokens live in [src/index.css](src/index.css).

## Stack

React 18 · Vite 6 · Tailwind CSS v4 · **Framer Motion** · React Router 6 · TanStack Query 5 · lucide-react · canvas-confetti

## Getting started

```bash
# 1. Start the API (see its README): http://localhost:4000
# 2. Then:
npm install
npm run dev        # http://localhost:5173
```

In development, Vite proxies `/api` to `http://localhost:4000` (override this with `VITE_PROXY_TARGET`). That keeps the refresh cookie first-party and the default `CORS_ORIGIN=http://localhost:5173` works without changes.

Use the seeded demo accounts (`ada@test.dev`, `grace@test.dev`, `alan@test.dev`, password `Password123!`). The login page has one-click buttons that fill them in. Set `VITE_SHOW_DEMO_ACCOUNTS=false` to hide those buttons.

### Production

```bash
VITE_API_URL=https://your-api.example.com npm run build   # outputs dist/
```

- **Same origin** (recommended, e.g. with the API's `deploy/nginx.conf`): leave `VITE_API_URL` empty.
- **Different sites** (e.g. two `*.onrender.com` hosts): set `VITE_API_URL`, add the client URL to the API's `CORS_ORIGIN`, and set `COOKIE_SAMESITE=none` on the API (this needs HTTPS).
- Configure SPA fallback so every route serves `index.html`.

## How the client uses the API

- **Session:** the access token is held **in memory only**. The refresh token is the API's httpOnly cookie. On load, the client calls `POST /auth/refresh` to restore the session. Refreshes are **single-flight** ([src/api/client.js](src/api/client.js)), because the API treats two concurrent refreshes as token theft. A 401 with `TOKEN_EXPIRED` triggers one refresh and a retry.
- **Submitting:** the client sends only option ids and never a score. It generates one `Idempotency-Key` (a UUID) per attempt and stores it with the draft answers in `sessionStorage`. A retry after a network error, a double click or a page reload therefore reuses the key, and XP can never be awarded twice.
- **409 `QUIZ_ALREADY_COMPLETED`:** the client opens the original attempt from `details[0].attempt_id`. Opening a completed quiz goes straight to its results.
- **After a submit:** the dashboard, quizzes, attempts and leaderboard queries are invalidated, so the XP, streak and rank pills update immediately.
- **Client-side only:** levels (every 50 XP) and the streak (consecutive days with a completed quiz) are worked out in the browser from data the API already returns. They are presentation only.

## Project structure

```
src/
  api/          client.js (fetch, auth, refresh), queries.js (TanStack Query hooks)
  auth/         AuthContext.jsx: session restore, login, register, logout
  components/   AppShell (sidebar, top bar, mobile tabs), ui.jsx (progress, rings, badges, mascot…)
  lib/          gamify.js (levels, streaks, badge catalog), motion.js (Framer Motion presets)
  pages/        Landing, Auth, Dashboard, Quizzes (learning path), PlayQuiz,
                Attempt (results), Leaderboard, History, NotFound
```

## Accessibility

- Answer tiles use shapes as well as colours.
- Keyboard play: press `1`–`4` to pick an answer, `Enter` to continue and `Esc` to exit.
- Focus rings are visible and form errors are announced through ARIA attributes.
- `prefers-reduced-motion` is respected: Framer Motion runs with `reducedMotion="user"` and confetti is disabled.
