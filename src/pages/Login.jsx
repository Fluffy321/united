import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Compass, HeartHandshake, Lock, Mail, MapPin, MessageCircle, ShieldCheck, Sparkles, User, Users, Loader2 } from 'lucide-react';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { shouldUseSupabase, supabase, getAuthRedirectUrl } from '@/api/supabaseClient';

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
    <div className={`flex items-center gap-3 ${compact ? '' : 'mb-0'}`}>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const LOGIN_STYLES = `
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
`;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAppState, isAuthenticated, isLoadingAuth } = useAuth();

  // When a protected route redirects here with ?from_url, skip the welcome screen — the
  // user was already in the app and just needs to re-authenticate, not see the intro.
  const hasFromUrl = Boolean(searchParams.get('from_url'));

  // mode: 'welcome' | 'signin' | 'signup'
  const [mode, setMode] = useState(hasFromUrl ? 'signin' : 'welcome');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const target = useMemo(() => {
    const fromUrl = searchParams.get('from_url');
    if (!fromUrl) return DEFAULT_AUTH_DESTINATION;
    try {
      const parsed = new URL(fromUrl, window.location.origin);
      if (parsed.origin !== window.location.origin) return DEFAULT_AUTH_DESTINATION;
      return `${parsed.pathname}${parsed.search || ''}`;
    } catch {
      return DEFAULT_AUTH_DESTINATION;
    }
  }, [searchParams]);

  // Detect Supabase auth callback (email verification or OAuth PKCE return)
  const isAuthCallback = searchParams.get('type') === 'email' || Boolean(searchParams.get('code'));

  const signInWithGoogle = async () => {
    if (!supabase) return;
    setError('');
    setIsGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getAuthRedirectUrl() },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err?.message || 'Could not connect to Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

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

  // Loading screen while Supabase processes an auth callback
  if (isAuthCallback && (isLoadingAuth || isAuthenticated)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#F6F8FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Signing you in…</p>
      </div>
    );
  }

  // ─── Screen 1: Welcome ────────────────────────────────────────────────────
  if (mode === 'welcome') {
    return (
      <main
        className="login-page-root min-h-[100dvh] bg-[#F6F8FB] px-5 py-8 text-slate-950 sm:py-12"
        style={{ colorScheme: 'light' }}
      >
        <style>{LOGIN_STYLES}</style>
        <div className="mx-auto w-full max-w-sm">

          <BrandMark />

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Built for Jewish community life
          </div>

          <h1 className="mt-5 text-[32px] font-black leading-[1.05] text-slate-950 sm:text-[38px]">
            Your Jewish community, connected.
          </h1>

          <p className="mt-3 text-[15px] font-semibold leading-7 text-slate-600">
            Reconnect with your communities, messages, local updates, chesed requests, and nearby discovery.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {VALUE_CHIPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm"
                >
                  <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-2xl border ${item.className}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-[13px] font-black leading-5 text-slate-950">{item.label}</p>
                  <p className="mt-0.5 text-[12px] font-semibold leading-4 text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white shadow-xl shadow-slate-950/15">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
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

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="motion-press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-[15px] font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="motion-press h-11 w-full rounded-2xl border border-blue-100 bg-blue-50 text-center text-[14px] font-black text-[#0F5ED7] transition hover:bg-blue-100 active:scale-[0.98]"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Screen 2: Sign In / Sign Up ──────────────────────────────────────────
  return (
    <main
      className="login-page-root min-h-[100dvh] bg-[#F6F8FB] px-5 py-6 text-slate-950 sm:py-8"
      style={{ colorScheme: 'light' }}
    >
      <style>{LOGIN_STYLES}</style>
      <div className="login-screen mx-auto w-full max-w-sm">

        <button
          type="button"
          onClick={() => { setMode('welcome'); setError(''); setMessage(''); }}
          className="-ml-1 mb-6 flex items-center gap-1.5 text-[13px] font-bold text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <BrandMark compact />

        <div className="mt-6">
          <p className="text-[12px] font-black uppercase tracking-wide text-[#0F5ED7]">Secure access</p>
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

        {shouldUseSupabase && (
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isGoogleLoading || isSubmitting}
              className="motion-press mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-[14px] font-black text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isGoogleLoading
                ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                : <GoogleIcon />
              }
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[12px] font-semibold text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Display name</span>
              <span className="login-field flex h-12 items-center gap-2 px-3 transition">
                <User className="h-4 w-4 text-[#0F5ED7]" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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

        <div className="mt-4 mb-2 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
          <MessageCircle className="h-3.5 w-3.5" />
          Messages, communities, and chesed in one account.
        </div>
      </div>
    </main>
  );
}
