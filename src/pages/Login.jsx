import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Compass, HeartHandshake, Lock, Mail, MapPin, MessageCircle, ShieldCheck, Sparkles, User, Users, Loader2 } from 'lucide-react';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { shouldUseSupabase } from '@/api/supabaseClient';

const DEFAULT_AUTH_DESTINATION = '/Feed';
const AUTH_SUBMIT_TIMEOUT_MS = 15000;

const withTimeout = (promise, timeoutMs, message) => new Promise((resolve, reject) => {
  const timeoutId = window.setTimeout(() => {
    reject(new Error(message));
  }, timeoutMs);

  promise
    .then(resolve)
    .catch(reject)
    .finally(() => window.clearTimeout(timeoutId));
});

const VALUE_CHIPS = [
  {
    icon: Users,
    label: 'Communities & groups',
    text: 'Find the circles that fit your life.',
    className: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    icon: HeartHandshake,
    label: 'Chesed requests',
    text: 'Ask for help or show up for someone nearby.',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    icon: ShieldCheck,
    label: 'Trusted sharing',
    text: 'Post and message with more confidence.',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    icon: MapPin,
    label: 'Local discovery',
    text: 'See what is happening around your community.',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
];

function BrandMark({ compact = false }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'mb-8'}`}>
      <div className={`${compact ? 'h-12 w-12 rounded-[18px]' : 'h-14 w-14 rounded-[20px]'} flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 via-[#0F5ED7] to-slate-950 shadow-xl shadow-blue-950/20 ring-1 ring-white/70`}>
        <img src="/brand-mark.svg" alt="JUnited" className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      </div>
      <div>
        <p className={`${compact ? 'text-[18px]' : 'text-[21px]'} font-black leading-none text-slate-950`}>JUnited</p>
        <p className="mt-1 text-[12px] font-bold text-slate-500">Community, chesed, connection.</p>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAppState, isAuthenticated, isLoadingAuth } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const target = useMemo(() => {
    const fromUrl = searchParams.get('from_url');
    if (!fromUrl) return DEFAULT_AUTH_DESTINATION;

    try {
      const parsed = new URL(fromUrl, window.location.origin);
      if (parsed.pathname === '/InviteJoin' || parsed.pathname === '/join') {
        return `${parsed.pathname}${parsed.search || ''}`;
      }
      return DEFAULT_AUTH_DESTINATION;
    } catch {
      return DEFAULT_AUTH_DESTINATION;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate, target]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        await dataService.auth.signUp({ email, password, displayName });
        if (shouldUseSupabase) {
          setMessage('Check your email to confirm your account, then come back and sign in.');
        } else {
          setMessage('Local preview account created. Taking you into the app...');
          await checkAppState();
          navigate(target, { replace: true });
        }
      } else {
        const signIn = dataService.auth.signInWithPassword || dataService.auth.signin || dataService.auth.signIn || dataService.auth.login;
        if (typeof signIn !== 'function') {
          throw new Error('Sign in is not connected yet. Please refresh the page and try again.');
        }
        await withTimeout(
          signIn.call(dataService.auth, { email, password }),
          AUTH_SUBMIT_TIMEOUT_MS,
          'Sign in is taking longer than expected. Please refresh and try again.'
        );
        await checkAppState();
        navigate(target, { replace: true });
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="login-page-root min-h-[100dvh] px-4 py-4 text-slate-950 sm:px-6 sm:py-6"
      style={{ backgroundColor: '#F6F8FB', colorScheme: 'light' }}
    >
      <style>{`
        .login-screen, .login-screen input, .login-screen button {
          letter-spacing: 0;
        }
        .login-screen input:-webkit-autofill,
        .login-screen input:-webkit-autofill:hover,
        .login-screen input:-webkit-autofill:focus {
          -webkit-text-fill-color: #0f172a;
          -webkit-box-shadow: 0 0 0 1000px #f8fafc inset;
          box-shadow: 0 0 0 1000px #f8fafc inset;
          caret-color: #0f172a;
          transition: background-color 9999s ease-in-out 0s;
        }
        .login-page-root * {
          box-sizing: border-box;
          letter-spacing: 0 !important;
        }
        .login-field {
          background: #F8FAFC;
          border: 1px solid #D8E2EF;
          border-radius: 16px;
        }
        .login-field:focus-within {
          background: #FFFFFF;
          border-color: #2563EB;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }
        .login-page-root input {
          color: #0F172A !important;
        }
      `}</style>
      <section className="mx-auto grid min-h-[calc(100dvh-32px)] w-full max-w-6xl items-center gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <div className="login-screen relative overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_86%_26%,rgba(212,175,55,0.16),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F7FAFF_56%,#EEF5FF_100%)]" />
          <div className="relative p-5 sm:p-7 lg:p-8">
            <BrandMark />

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Built for Jewish community life
            </div>

            <h1 className="font-display mt-5 max-w-xl text-[34px] font-black leading-[1.02] text-slate-950 sm:text-[46px]">
              {mode === 'signin' ? 'Your Jewish community, connected.' : 'Join the Jewish community app made for real life.'}
            </h1>
            <p className="mt-4 max-w-lg text-[15px] font-semibold leading-7 text-slate-600">
              {mode === 'signin'
                ? 'Reconnect with your communities, messages, local updates, chesed requests, and nearby discovery.'
                : 'Create your account to find groups, share with trusted friends, discover what is nearby, and help when help is needed.'}
            </p>

            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {VALUE_CHIPS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-[20px] border border-slate-200 bg-white/85 p-3.5 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${item.className}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-black leading-5 text-slate-950">{item.label}</p>
                        <p className="mt-0.5 text-[12px] font-semibold leading-5 text-slate-500">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white shadow-xl shadow-slate-950/15">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] font-black">Start close to home</p>
                  <p className="mt-0.5 text-[12px] font-semibold leading-5 text-slate-300">
                    Communities, chesed, map discovery, and messages all come together in one calm place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-screen rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase text-[#0F5ED7]">Secure access</p>
              <h2 className="mt-1 text-[30px] font-black leading-tight text-slate-950">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              </h2>
              <p className="mt-2 text-[14px] font-semibold leading-6 text-slate-500">
                {mode === 'signin'
                  ? 'Sign in to reconnect with your communities, messages, and requests.'
                  : shouldUseSupabase
                    ? 'Create your account, confirm your email, and come back to start connecting.'
                    : 'Local preview mode creates a demo account immediately without sending email.'}
              </p>
            </div>
            <div className="hidden sm:block">
              <BrandMark compact />
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Display name</span>
                <span className="login-field flex h-12 items-center gap-2 px-3 transition">
                  <User className="h-4 w-4 text-[#0F5ED7]" />
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Your name"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email</span>
              <span className="login-field flex h-12 items-center gap-2 px-3 transition">
                <Mail className="h-4 w-4 text-[#0F5ED7]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="you@example.com"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</span>
              <span className="login-field flex h-12 items-center gap-2 px-3 transition">
                <Lock className="h-4 w-4 text-[#0F5ED7]" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </span>
            </label>

            {error && (
              <p className="rounded-[8px] border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-700">{error}</p>
            )}
            {message && (
              <p className="rounded-[8px] border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="motion-press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-[15px] font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setMessage('');
            }}
            className="motion-press mt-5 h-11 w-full rounded-2xl border border-blue-100 bg-blue-50 text-center text-[14px] font-black text-[#0F5ED7] transition hover:bg-blue-100"
          >
            {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>

          <p className="mt-5 text-center text-[12px] font-semibold leading-5 text-slate-400">
            By continuing, you agree to use JUnited with care for your local community.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
            <MessageCircle className="h-3.5 w-3.5" />
            Messages, communities, and chesed in one account.
          </div>
        </div>
      </section>
    </main>
  );
}
