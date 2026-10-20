import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Field, Logo, Mascot, PasswordInput, Spinner } from '../components/ui.jsx';
import { pageMotion } from '../lib/motion.js';

// Seeded, fictitious test accounts (see the API README). Hide with VITE_SHOW_DEMO_ACCOUNTS=false.
const DEMO_ACCOUNTS = [
  { name: 'Ada', email: 'ada@test.dev', note: 'Fresh account' },
  { name: 'Grace', email: 'grace@test.dev', note: '80 XP' },
  { name: 'Alan', email: 'alan@test.dev', note: '90 XP' },
];
const DEMO_PASSWORD = 'Password123!';
const SHOW_DEMO = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shake = useAnimationControls();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (isRegister && !form.name.trim()) next.name = 'Tell us your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (isRegister && form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (!isRegister && !form.password) next.password = 'Enter your password.';
    return next;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }

    setSubmitting(true);
    try {
      const payload = isRegister ? form : { email: form.email, password: form.password };
      await (isRegister ? register(payload) : login(payload));
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) {
        setFormError(
          error.code === 'INVALID_CREDENTIALS'
            ? "That email and password don't match. Give it another go."
            : error.code === 'EMAIL_TAKEN'
              ? 'An account with this email already exists. Try logging in instead.'
              : error.message,
        );
      }
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (email) => {
    setForm((f) => ({ ...f, email, password: DEMO_PASSWORD }));
    setErrors({});
    setFormError('');
  };

  return (
    <motion.div {...pageMotion} className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-aqua/25" />
        <Logo light />
        <div className="relative my-auto max-w-md">
          <Mascot size={140} mood={isRegister ? 'cheer' : 'happy'} />
          <h2 className="mt-6 text-4xl leading-tight text-white">
            {isRegister ? 'Your learning adventure starts here.' : 'Welcome back, champion!'}
          </h2>
          <p className="mt-4 text-lg text-white/80">
            {isRegister
              ? 'Earn XP for every correct answer, collect badges and climb the leaderboard.'
              : 'Your streak, XP and badges are right where you left them.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['+10 XP per correct answer', '+20 perfect-score bonus', 'Unlockable badges'].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="chip bg-white/15 text-sm text-white"
              >
                <Sparkles className="size-3.5 text-gold" /> {t}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-10">
          <h1 className="text-3xl sm:text-4xl">{isRegister ? 'Create your account' : 'Log in'}</h1>
          <p className="mt-2 text-slate">
            {isRegister ? 'Already have one?' : 'New here?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-extrabold text-primary hover:underline">
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>

          <motion.form animate={shake} onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
            <AnimatePresence>
              {formError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 rounded-2xl border-2 border-danger/20 bg-danger-soft p-3 text-sm font-semibold text-danger"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" /> {formError}
                </motion.div>
              )}
            </AnimatePresence>

            {isRegister && (
              <Field id="name" label="Name" error={errors.name}>
                <input
                  id="name"
                  className="input"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={form.name}
                  onChange={update('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
              </Field>
            )}
            <Field id="email" label="Email" error={errors.email}>
              <input
                id="email"
                type="email"
                className="input"
                autoComplete="email"
                placeholder="you@school.edu"
                value={form.email}
                onChange={update('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </Field>
            <Field id="password" label="Password" error={errors.password}>
              <PasswordInput
                id="password"
                error={errors.password}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
                value={form.password}
                onChange={update('password')}
              />
            </Field>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full py-4 text-base">
              {submitting ? <Spinner /> : <>{isRegister ? 'Create account' : 'Log in'} <ArrowRight className="size-5" /></>}
            </button>
          </motion.form>

          {SHOW_DEMO && !isRegister && (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-line p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate">Try a demo account</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <motion.button
                    key={acc.email}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => fillDemo(acc.email)}
                    className={`rounded-2xl border-2 p-2.5 text-left transition-colors ${
                      form.email === acc.email ? 'border-primary bg-lavender' : 'border-line bg-white hover:border-primary/40'
                    }`}
                  >
                    <p className="text-sm font-extrabold">{acc.name}</p>
                    <p className="text-[11px] font-semibold text-slate">{acc.note}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
