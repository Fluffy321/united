import React from 'react';

function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
  });
}

function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

export default function ShabbosScreen({ havdalah, minutesUntilHavdalah, onDismiss }) {
  const hours = minutesUntilHavdalah != null ? Math.floor(minutesUntilHavdalah / 60) : null;
  const mins = minutesUntilHavdalah != null ? minutesUntilHavdalah % 60 : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white"
      style={{
        background: 'linear-gradient(160deg, #0d1b4e 0%, #1a1040 40%, #2d0a3e 100%)',
      }}
    >
      {/* Stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() > 0.8 ? 2 : 1,
              height: Math.random() > 0.8 ? 2 : 1,
              top: `${Math.random() * 60}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.5,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center px-8 text-center">
        {/* Menorah glyph */}
        <div className="mb-6 text-[64px]" style={{ filter: 'drop-shadow(0 0 24px rgba(255,200,50,0.6))' }}>
          🕍
        </div>

        <p
          className="mb-2 text-[42px] font-black leading-none tracking-tight"
          style={{
            fontFamily: "'Heebo', 'Arial Hebrew', sans-serif",
            background: 'linear-gradient(135deg, #f6d860 0%, #e8b84b 50%, #c9943a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          שבת שלום
        </p>

        <p className="mb-1 text-[28px] font-black text-white/90">Shabbat Shalom</p>

        <p className="mt-2 text-[14px] font-semibold text-white/50">Five Towns · JUnited</p>

        {minutesUntilHavdalah != null && hours != null && (
          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/8 px-6 py-4 backdrop-blur-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-2">Havdalah in</p>
            <p className="text-[36px] font-black text-white tabular-nums">
              {pad(hours)}:{pad(mins)}
            </p>
            {havdalah && (
              <p className="mt-1 text-[12px] font-semibold text-white/40">{formatTime(havdalah)}</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-10 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-[13px] font-black text-white/70 backdrop-blur-sm"
        >
          Dismiss for now
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 0.8 } }
      `}</style>
    </div>
  );
}
