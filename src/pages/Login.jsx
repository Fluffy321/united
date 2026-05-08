import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Loader2, HeartHandshake, MessageCircle, Users } from 'lucide-react';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAppState } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const target = useMemo(() => {
    const fromUrl = searchParams.get('from_url');
    if (!fromUrl) return '/';

    try {
      const parsed = new URL(fromUrl, window.location.origin);
      return `${parsed.pathname}${parsed.search || ''}`;
    } catch {
      return '/';
    }
  }, [searchParams]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        await dataService.auth.signUp({ email, password, displayName });
        setMessage('Check your email to confirm your account, then come back and sign in.');
      } else {
        const signIn = dataService.auth.signInWithPassword || dataService.auth.signin || dataService.auth.signIn || dataService.auth.login;
        if (typeof signIn !== 'function') {
          throw new Error('Sign in is not connected yet. Please refresh the page and try again.');
        }
        await signIn.call(dataService.auth, { email, password });
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
      className="login-page-root px-4 py-6 sm:px-6"
      style={{ backgroundColor: '#F6F8FB', color: '#0F172A', minHeight: '100vh', colorScheme: 'light' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .login-screen, .login-screen input, .login-screen button {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
        .login-page-root {
          min-height: 100vh;
          width: 100%;
          background: #F6F8FB !important;
          color: #0F172A !important;
          color-scheme: light;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .login-page-root * {
          box-sizing: border-box;
          letter-spacing: 0 !important;
        }
        .login-panel {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08) !important;
        }
        .login-feature-strip {
          background: #F8FAFC !important;
        }
        .login-mini-card {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          color: #0F172A !important;
        }
        .login-field {
          background: #F8FAFC !important;
          border: 1px solid #CBD5E1 !important;
          border-radius: 8px !important;
        }
        .login-field:focus-within {
          background: #FFFFFF !important;
          border-color: #0F5ED7 !important;
          box-shadow: 0 0 0 2px #DBEAFE !important;
        }
        .login-page-root input {
          color: #0F172A !important;
        }
      `}</style>
      <section className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-5xl items-center gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div
          className="login-screen login-panel overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}
        >
          <div className="bg-[#0F5ED7] px-6 py-7 text-white sm:px-8 sm:py-9" style={{ backgroundColor: '#0F5ED7', color: '#FFFFFF' }}>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-white/15 ring-1 ring-white/25">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[13px] font-black leading-none">JUnited</p>
                <p className="mt-1 text-[12px] font-semibold text-blue-50">Community starts here</p>
              </div>
            </div>

            <h1 className="max-w-lg text-[34px] font-black leading-[1.05] sm:text-[44px]">
              {mode === 'signin' ? 'Welcome back to your community.' : 'Join your community on JUnited.'}
            </h1>
            <p className="mt-4 max-w-md text-[15px] font-medium leading-6 text-blue-50">
              {mode === 'signin'
                ? 'Sign in to keep up with posts, messages, local groups, and ways to help.'
                : 'Create an account, confirm your email, and start connecting with the people around you.'}
            </p>
          </div>

          <div className="login-feature-strip grid gap-3 p-4 sm:grid-cols-3 sm:p-5" style={{ backgroundColor: '#F8FAFC' }}>
            {[
              { icon: Users, label: 'Communities', text: 'Find local groups' },
              { icon: MessageCircle, label: 'Messages', text: 'Stay connected' },
              { icon: HeartHandshake, label: 'Mitzvah', text: 'Offer help' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="login-mini-card p-4"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, color: '#0F172A' }}
                >
                  <Icon className="h-5 w-5 text-[#0F5ED7]" />
                  <p className="mt-3 text-[14px] font-black text-slate-900">{item.label}</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="login-screen login-panel p-5 sm:p-6"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.08)', color: '#0F172A' }}
        >
          <div className="mb-5">
            <p className="text-[12px] font-black uppercase text-[#0F5ED7]">Secure access</p>
            <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
            <p className="mt-2 text-[14px] font-medium leading-6 text-slate-500">
              {mode === 'signin'
                ? 'Use the email and password for your JUnited account.'
                : 'Supabase will send a confirmation email after you create your account.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Display name</span>
                <span className="login-field flex h-12 items-center gap-2 px-3 transition" style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8 }}>
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
              <span className="login-field flex h-12 items-center gap-2 px-3 transition" style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8 }}>
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
              <span className="login-field flex h-12 items-center gap-2 px-3 transition" style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8 }}>
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
              className="flex h-12 w-full items-center justify-center rounded-[8px] bg-[#0F5ED7] text-[15px] font-black text-white shadow-sm transition hover:bg-[#0D4EB8] active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'signin' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setMessage('');
            }}
            className="mt-5 h-11 w-full rounded-[8px] border border-[#CBD5E1] bg-slate-50 text-center text-[14px] font-black text-[#0F5ED7] transition hover:bg-blue-50 active:scale-[0.99]"
          >
            {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>

          <p className="mt-5 text-center text-[12px] font-medium leading-5 text-slate-400">
            By continuing, you agree to use JUnited with respect for your local community.
          </p>
        </div>
      </section>
    </main>
  );
}
