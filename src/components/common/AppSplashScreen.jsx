import React from 'react';

export default function AppSplashScreen({ exiting = false }) {
  return (
    <div
      className={`fixed inset-0 z-[300] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#F6F8FB] px-6 transition-opacity duration-300 ease-out ${exiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      aria-label="Loading JUnited"
      role="status"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(37,99,235,0.13),transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F6F8FB_58%,#EEF4FF_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100/70 bg-white/30 blur-3xl" />

      <div className={`relative flex flex-col items-center text-center ${exiting ? '' : 'animate-[splashMarkIn_620ms_cubic-bezier(0.22,1,0.36,1)_both]'}`}>
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-[30px] bg-blue-500/20 blur-xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-blue-600 via-[#0F5ED7] to-slate-950 shadow-2xl shadow-blue-950/20 ring-1 ring-white/70">
            <img src="/brand-mark.svg" alt="" className="h-16 w-16 drop-shadow-sm" />
          </div>
        </div>

        <p className="text-[30px] font-black leading-none text-slate-950">
          JUnited
        </p>
        <p className="mt-3 text-[13px] font-bold text-slate-500">
          Community, chesed, connection.
        </p>

        <div className="mt-7 flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className="h-1.5 w-1.5 rounded-full bg-blue-500/70 animate-[splashPulse_1.15s_ease-in-out_infinite]"
              style={{ animationDelay: `${item * 140}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
