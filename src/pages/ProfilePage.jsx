import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { AlertCircle, Award, BookOpen, CalendarDays, CheckCircle2, KeyRound, Mail, PenLine, Trophy, Zap } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/client.js';
import { useDashboard, useProfile } from '../api/queries.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Avatar, BadgeIcon, ErrorState, Field, PasswordInput, Skeleton, Spinner, StatTile } from '../components/ui.jsx';
import { BADGE_CATALOG, formatDate, levelFor } from '../lib/gamify.js';
import { rise, stagger } from '../lib/motion.js';

const SHAKE = { x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } };

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

/** Form-level message: an error alert or a success confirmation. */
function FormMessage({ tone, children }) {
  const isError = tone === 'error';
  return (
    <AnimatePresence>
      {children && (
        <motion.div
          role={isError ? 'alert' : 'status'}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-start gap-2 rounded-2xl border-2 p-3 text-sm font-semibold ${
            isError ? 'border-danger/20 bg-danger-soft text-danger' : 'border-success/20 bg-success-soft text-success'
          }`}
        >
          {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NameForm({ currentName }) {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const shake = useAnimationControls();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const unchanged = trimmed === currentName;

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaved(false);
    const clientError = !trimmed ? 'Your name can’t be empty.' : trimmed.length > 100 ? 'Use 100 characters or fewer.' : '';
    if (clientError) {
      setError(clientError);
      shake.start(SHAKE);
      return;
    }

    setSaving(true);
    try {
      const profile = await api.updateProfile({ name: trimmed });
      queryClient.setQueryData(['profile'], profile);
      updateUser({ name: profile.name });
      // The name also appears on the dashboard and the leaderboard.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setName(profile.name);
      setSaved(true);
    } catch (err) {
      const fieldError = err.fieldErrors?.name;
      if (fieldError) setError(fieldError);
      else setFormError(err.message);
      shake.start(SHAKE);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form animate={shake} onSubmit={onSubmit} noValidate className="space-y-4">
      <FormMessage tone="error">{formError}</FormMessage>
      <FormMessage tone="success">{saved && 'Your name has been updated.'}</FormMessage>
      <Field id="profile-name" label="Display name" error={error} hint="Shown on your dashboard and the leaderboard.">
        <input
          id="profile-name"
          className="input"
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
            setSaved(false);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? 'profile-name-error' : undefined}
        />
      </Field>
      <button type="submit" disabled={saving || unchanged} className="btn btn-primary w-full sm:w-auto">
        {saving ? <Spinner /> : 'Save name'}
      </button>
    </motion.form>
  );
}

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' };

function PasswordForm() {
  const { applySession } = useAuth();
  const shake = useAnimationControls();
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
    setDone(false);
  };

  const validate = () => {
    const next = {};
    if (!form.current) next.current = 'Enter your current password.';
    if (form.next.length < 8) next.next = 'Use at least 8 characters.';
    else if (form.next === form.current) next.next = 'Choose a password you haven’t used here.';
    if (form.confirm !== form.next) next.confirm = 'Passwords don’t match.';
    return next;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setDone(false);
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      shake.start(SHAKE);
      return;
    }

    setSaving(true);
    try {
      // The API revokes every session and returns a new one for this device; adopt it so we stay signed in.
      applySession(await api.changePassword({ current_password: form.current, new_password: form.next }));
      setForm(EMPTY_PASSWORDS);
      setDone(true);
    } catch (err) {
      const fields = err.fieldErrors ?? {};
      const mapped = { current: fields.current_password, next: fields.new_password };
      if (mapped.current || mapped.next) setErrors(mapped);
      else setFormError(err.message);
      shake.start(SHAKE);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form animate={shake} onSubmit={onSubmit} noValidate className="space-y-4">
      <FormMessage tone="error">{formError}</FormMessage>
      <FormMessage tone="success">{done && 'Password changed. You’ve been signed out on your other devices.'}</FormMessage>
      <Field id="current-password" label="Current password" error={errors.current}>
        <PasswordInput
          id="current-password"
          error={errors.current}
          autoComplete="current-password"
          value={form.current}
          onChange={update('current')}
        />
      </Field>
      <Field id="new-password" label="New password" error={errors.next} hint="At least 8 characters.">
        <PasswordInput id="new-password" error={errors.next} autoComplete="new-password" value={form.next} onChange={update('next')} />
      </Field>
      <Field id="confirm-password" label="Confirm new password" error={errors.confirm}>
        <PasswordInput
          id="confirm-password"
          error={errors.confirm}
          autoComplete="new-password"
          value={form.confirm}
          onChange={update('confirm')}
        />
      </Field>
      <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
        {saving ? <Spinner /> : 'Change password'}
      </button>
    </motion.form>
  );
}

export default function ProfilePage() {
  const profile = useProfile();
  const dash = useDashboard();

  if (profile.isPending || dash.isPending) return <ProfileSkeleton />;
  if (profile.isError || dash.isError) {
    const retry = () => {
      profile.refetch();
      dash.refetch();
    };
    return <ErrorState error={profile.error ?? dash.error} onRetry={retry} />;
  }

  const p = profile.data;
  const d = dash.data;
  const lvl = levelFor(d.xp);
  const earnedByCode = new Map(d.badges.map((b) => [b.code, b]));
  const allBadges = [...d.badges, ...BADGE_CATALOG.filter((b) => !earnedByCode.has(b.code))];
  const badgeTotal = Math.max(BADGE_CATALOG.length, d.badges.length);

  return (
    <motion.div variants={stagger(0.07)} initial="initial" animate="animate" className="space-y-6">
      {/* Identity */}
      <motion.section variants={rise} className="card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar name={p.name} seed={p.id} size="size-20" className="text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl sm:text-4xl">{p.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-semibold text-slate">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Mail className="size-4 shrink-0" /> <span className="truncate">{p.email}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" /> Joined {formatDate(p.created_at)}
            </span>
          </div>
        </div>
        <span className="chip bg-gold text-sm text-navy">
          <Zap className="size-4 fill-navy" /> Level {lvl.level} · {lvl.title}
        </span>
      </motion.section>

      {/* Stats */}
      <motion.div variants={stagger(0.06)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Zap} tone="gold" label="Total XP" value={d.xp} />
        <StatTile icon={Trophy} tone="primary" label="Rank" value={`#${d.rank}`} suffix={` / ${d.total_players}`} />
        <StatTile icon={BookOpen} tone="aqua" label="Quizzes done" value={d.quizzes_completed} suffix={` / ${d.total_quizzes}`} />
        <StatTile icon={Award} tone="coral" label="Badges" value={d.badges.length} suffix={` / ${badgeTotal}`} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Badges */}
        <motion.section variants={rise} className="card p-6">
          <h2 className="text-xl">Badges</h2>
          <p className="text-xs font-semibold text-slate">
            {d.badges.length} of {badgeTotal} unlocked
          </p>
          <ul className="mt-4 space-y-3">
            {allBadges.map((b) => {
              const earned = earnedByCode.get(b.code);
              return (
                <li key={b.code} className={`flex items-center gap-3 ${earned ? '' : 'opacity-80'}`}>
                  <BadgeIcon code={b.code} locked={!earned} size="size-12" iconSize="size-6" />
                  <div className="min-w-0 flex-1">
                    <p className={`font-extrabold ${earned ? '' : 'text-slate'}`}>{b.name}</p>
                    <p className="text-xs text-slate">{b.description}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${earned ? 'text-success' : 'text-slate'}`}>
                    {earned ? formatDate(earned.awarded_at) : 'Locked'}
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.section>

        {/* Account settings */}
        <div className="space-y-6">
          <motion.section variants={rise} className="card p-6">
            <h2 className="flex items-center gap-2 text-xl">
              <PenLine className="size-5 text-primary" /> Your name
            </h2>
            <div className="mt-4">
              <NameForm currentName={p.name} />
            </div>
          </motion.section>

          <motion.section variants={rise} className="card p-6">
            <h2 className="flex items-center gap-2 text-xl">
              <KeyRound className="size-5 text-primary" /> Change password
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate">For your security, this signs you out on your other devices.</p>
            <div className="mt-4">
              <PasswordForm />
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
