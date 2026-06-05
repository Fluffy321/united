import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, Radio, Users } from 'lucide-react';

const toneClasses = {
  urgent: 'border-red-200 bg-red-50/70 text-red-700',
  today: 'border-orange-200 bg-orange-50/80 text-orange-700',
  completed: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  active: 'border-blue-100 bg-white text-blue-700',
  flexible: 'border-slate-200 bg-white text-slate-700',
};

const faceColors = ['#2563EB', '#7C3AED', '#059669'];

function fallbackFaces(item, title) {
  const label = item.meta || item.title || title || 'JUnited';
  return [{ name: label, initials: String(label).slice(0, 2).toUpperCase() }];
}

export default function LiveNowPanel({
  title = 'Live now',
  subtitle = 'Time-sensitive things worth checking right now.',
  items = [],
  className = '',
}) {
  const navigate = useNavigate();
  if (!items.length) return null;

  return (
    <section className={`rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">{title}</h2>
          </div>
          <p className="mt-1 text-[13px] font-bold leading-snug text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-full bg-slate-50 px-3 py-1 text-sm font-black text-slate-500">{items.length}</div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const faces = item.faces?.length ? item.faces : fallbackFaces(item, title);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.href && navigate(item.href)}
              className="group min-w-[252px] flex-1 rounded-[22px] border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md active:scale-[0.98]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${
                    toneClasses[item.tone] || toneClasses.active
                  }`}
                >
                  <Radio className="h-3 w-3" />
                  {item.eyebrow}
                </span>
                <div className="flex -space-x-1.5">
                  {faces.slice(0, 3).map((face, index) => (
                    <span
                      key={`${face.name || face.initials || index}-${index}`}
                      className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm"
                      style={{ background: faceColors[index % faceColors.length] }}
                      title={face.name}
                    >
                      {face.initials || String(face.name || 'J').slice(0, 2).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950">{item.title}</h3>
              {item.context && (
                <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-snug text-slate-500">{item.context}</p>
              )}
              <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                <span className="line-clamp-1">{item.meta}</span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <Users className="h-3 w-3" />
                  {item.people}
                </span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[13px] font-black text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                <MessageCircle className="h-3.5 w-3.5" />
                {item.action || 'Open'}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
