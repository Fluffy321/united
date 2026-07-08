import { CheckCircle2, Clock3 } from 'lucide-react';

export default function CommunityRhythmStrip({ kit, onPrompt }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Clock3 className="h-4 w-4 text-slate-500" />
        <p className="text-[12px] font-black uppercase tracking-wide text-slate-500">Weekly rhythm</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {kit.rhythm.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPrompt(`${item}: `)}
            className="flex min-w-[150px] flex-shrink-0 items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left active:scale-[0.98] transition-all"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-[12px] font-black leading-tight text-slate-800">{item}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
