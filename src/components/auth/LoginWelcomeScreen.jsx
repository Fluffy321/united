import React from 'react';
import { ArrowRight, HandHeart, MapPinned, Radio, Sparkles } from 'lucide-react';
import CommunitySignalGraphic from './CommunitySignalGraphic';

const USE_CASES = [
  { label: 'Local updates', icon: Radio },
  { label: 'Community needs', icon: HandHeart },
  { label: 'Places & plans', icon: MapPinned },
];

export default function LoginWelcomeScreen({ onGetStarted, onSignIn }) {
  return (
    <main
      className="login-page-root min-h-[100dvh] px-4 py-5 text-[#050B1E] sm:px-5 sm:py-8"
      style={{
        colorScheme: 'light',
        background:
          'radial-gradient(circle at 85% 12%, rgba(176,205,242,.07), transparent 31%), linear-gradient(180deg, #FCFBF8 0%, #F3F2EE 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-[430px]">
        <header className="flex items-center gap-3">
          <div className="h-[51px] w-[51px] shrink-0 rounded-[17px] bg-[#07101E] p-1 shadow-[0_9px_22px_rgba(9,20,39,0.2)]">
            <img
              src="/brand-mark.png"
              alt="JUnited"
              className="h-full w-full rounded-[13px] object-cover"
            />
          </div>
          <div>
            <p className="m-0 text-[23px] font-black leading-none tracking-[-0.045em]">JUnited</p>
            <p className="mt-1 text-[12px] font-bold text-[#738096]">
              Local Jewish life, in one place.
            </p>
          </div>
        </header>

        <div className="mt-[23px] inline-flex items-center gap-1.5 rounded-full border border-[#D0E0FF] bg-[#EFF6FF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.07em] text-[#2364DD]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Built for real community
        </div>

        <h1 className="mb-0 mt-4 max-w-[410px] text-[36px] font-black leading-[1.01] tracking-[-0.055em] sm:text-[38px]">
          Stay close to what matters.
        </h1>

        <p className="mb-0 mt-2 text-[14px] font-semibold leading-[1.55] text-[#5A687D]">
          One place for local updates, mitzvah needs, shuls, events, businesses, and neighbors.
        </p>

        <CommunitySignalGraphic />

        <section aria-label="Ways to use JUnited" className="mt-3 grid grid-cols-3 gap-2">
          {USE_CASES.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="min-h-[68px] rounded-[16px] border border-[#DDE6F1] bg-white/90 px-2.5 py-2.5 shadow-[0_5px_16px_rgba(24,39,75,0.04)]"
            >
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#EDF4FF] text-[#2563EB]">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <p className="mb-0 mt-1.5 text-[11px] font-black leading-[1.2] text-[#07101E]">
                {label}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-[18px] grid gap-2.5">
          <button
            type="button"
            onClick={onGetStarted}
            className="app-button-ink motion-press w-full"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onSignIn}
            className="motion-press min-h-11 w-full rounded-[16px] border border-[#CFE0FF] bg-[#EDF5FF]/90 px-4 text-[14px] font-black text-[#2563EB] transition hover:bg-[#E3EEFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 active:scale-[0.99]"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </main>
  );
}
