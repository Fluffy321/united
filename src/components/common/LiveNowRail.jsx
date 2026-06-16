import React from 'react';
import { ArrowRight, Clock3, Flame, MapPin, MessageCircle, ShieldCheck, Users } from 'lucide-react';

const ICONS = {
  mitzvah: Flame,
  minyan: Users,
  event: Clock3,
  marketplace: ShieldCheck,
  community: MessageCircle,
  discussion: MessageCircle,
  map: MapPin,
};

const TONES = {
  now: 'border-red-200 bg-red-50 text-red-700',
  urgent: 'border-red-200 bg-red-50 text-red-700',
  soon: 'border-orange-200 bg-orange-50 text-orange-700',
  today: 'border-amber-200 bg-amber-50 text-amber-700',
  active: 'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default function LiveNowRail({ title = 'Live now', subtitle = 'What needs attention right now', items = [], onItemClick, className = '' }) {
  if (!items.length) return null;

  return (
    <section className={`rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-sm ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wide text-slate-950">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            {title}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-400">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-black text-slate-500">
          {items.length}
        </span>
      </div>

      <div className="mobile-scroll-x flex gap-2">
        {items.map((item) => {
          const Icon = ICONS[item.type] || Flame;
          const tone = TONES[item.urgency] || TONES.active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick?.(item)}
              className="motion-press min-w-[235px] max-w-[265px] shrink-0 rounded-[20px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${tone}`}>
                  <Icon className="h-3 w-3" />
                  {item.eyebrow}
                </span>
                <div className="flex -space-x-2">
                  {(item.avatars || []).slice(0, 4).map((avatar, index) => (
                    <span
                      key={`${item.id}-${avatar}-${index}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[9px] font-black text-white"
                    >
                      {avatar}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="mt-2 line-clamp-2 text-[14px] font-black leading-5 text-slate-950">{item.title}</h3>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                <span className="truncate">{item.meta}</span>
                <span className="shrink-0">{item.liveText}</span>
              </div>
              {Number.isFinite(item.progress) && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${item.progress}%` }} />
                </div>
              )}
              <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-black text-blue-700">
                {item.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
