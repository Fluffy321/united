import React from 'react';

export default function AppSplashScreen({ exiting = false }) {
  return (
    <div
      className={`fixed inset-0 z-[300] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#F7F9FC] px-6 transition-opacity duration-300 ease-out ${exiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      aria-label="Loading JUnited"
      role="status"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_18%_80%,rgba(212,175,55,0.15),transparent_32%),radial-gradient(circle_at_84%_78%,rgba(85,107,47,0.12),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#F7F9FC_54%,#EEF4FF_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/35 blur-3xl" />
      <div className="absolute inset-x-8 top-[18%] h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      <div className={`relative flex w-full max-w-[360px] flex-col items-center text-center ${exiting ? '' : 'animate-[splashMarkIn_620ms_cubic-bezier(0.22,1,0.36,1)_both]'}`}>
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-[36px] bg-blue-500/10 blur-2xl animate-[splashHalo_2.8s_ease-in-out_infinite]" />
          <div className="absolute inset-3 rounded-[32px] bg-white/55 shadow-[0_22px_70px_rgba(15,23,42,0.12)]" />
          <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-[30px] bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-[0_22px_44px_rgba(15,94,215,0.18)] ring-1 ring-white/90">
            <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.95),transparent_38%),linear-gradient(145deg,rgba(15,94,215,0.06),rgba(15,23,42,0.08))]" />
            <img src="/brand-mark.png" alt="" className="relative h-16 w-16 drop-shadow-sm" />
          </div>
        </div>

        <p className="text-[32px] font-black leading-none text-slate-950">
          JUnited
        </p>
        <p className="mt-3 text-[13px] font-bold text-slate-600">
          Community, chesed, connection.
        </p>
        <p className="mt-2 text-[12px] font-semibold text-slate-400">
          Preparing your community...
        </p>

        <div className="mt-7 w-full max-w-[210px]" aria-hidden="true">
          <div className="splash-progress-track">
            <span className="splash-progress-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
