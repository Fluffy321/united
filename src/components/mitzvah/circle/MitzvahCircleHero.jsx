import React from 'react';
import { AlertCircle, ArrowRight, Award, BookOpen, Car, ChevronRight, Clock, HandHeart, ShoppingBag, Sparkles } from 'lucide-react';
import Metric from './Metric';

export default function MitzvahCircleHero({
  activeView,
  hasMitzvahStats,
  totals,
  onPostRequest,
  onChangeView,
  onGoToMarketplace,
}) {
  if (activeView === 'shuls') return null;

  const quickNeeds = [
    { label: 'A ride', icon: Car, tone: 'bg-amber-50 text-amber-700', onClick: () => onChangeView('rides') },
    { label: 'An errand', icon: ShoppingBag, tone: 'bg-sky-50 text-sky-700', onClick: () => onPostRequest({ category: 'Errands' }) },
    { label: 'Tutoring', icon: BookOpen, tone: 'bg-violet-50 text-violet-700', onClick: () => onPostRequest({ category: 'Tutoring' }) },
    { label: 'Shul help', icon: Sparkles, tone: 'bg-rose-50 text-rose-700', onClick: () => onPostRequest({ category: 'Shul Help' }) },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[30px] bg-[#0B2E6D] p-5 text-white shadow-[0_20px_45px_rgba(16,72,166,0.24)]" style={{ backgroundImage: 'radial-gradient(circle at 92% 2%, rgba(110,205,255,.42), transparent 30%), linear-gradient(135deg, #073477, #1261DD)' }}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-blue-100"><Sparkles className="h-3.5 w-3.5" /> Community support</div>
            <h2 className="max-w-[330px] text-[26px] font-black leading-[1.08] tracking-tight">Whatever today brings, start here.</h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-blue-100">Ask for practical help, find a ride, or step in for a neighbor who needs a hand.</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15"><HandHeart className="h-5 w-5" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onPostRequest()} className="motion-press group rounded-[20px] bg-white p-4 text-left text-slate-950 shadow-lg">
            <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><AlertCircle className="h-4 w-4" /></span>
            <span className="block text-[14px] font-black">I need help</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">Make a clear, private request</span>
            <ArrowRight className="mt-3 h-4 w-4 text-blue-600 transition group-hover:translate-x-1" />
          </button>
          <button onClick={() => onChangeView('browse')} className="motion-press group rounded-[20px] border border-white/20 bg-white/10 p-4 text-left backdrop-blur">
            <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-300/20 text-emerald-100"><HandHeart className="h-4 w-4" /></span>
            <span className="block text-[14px] font-black">I can help</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-blue-100">See who could use a hand</span>
            <ArrowRight className="mt-3 h-4 w-4 text-white transition group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between"><div><h2 className="text-[16px] font-black text-slate-950">What do you need?</h2><p className="text-[12px] font-semibold text-slate-500">Start with the kind of support you need.</p></div><button onClick={() => onPostRequest()} className="text-[12px] font-black text-blue-600">Something else</button></div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {quickNeeds.map(({ label, icon: Icon, tone, onClick }) => <button key={label} onClick={onClick} className="motion-press surface-tile flex min-h-[88px] flex-col items-start justify-between rounded-[20px] p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span><span className="text-[12px] font-black text-slate-800">{label}</span></button>)}
        </div>
      </section>

      <button onClick={() => onPostRequest({ urgency: 'Urgent' })} className="flex w-full items-center gap-3 rounded-[20px] border border-rose-100 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><AlertCircle className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[13px] font-black text-rose-950">Need help urgently?</span><span className="block text-[11px] font-semibold text-rose-700">Post a time-sensitive request so your neighbors can respond quickly.</span></span><ChevronRight className="h-4 w-4 text-rose-500" /></button>

      {hasMitzvahStats && <div className="grid grid-cols-3 gap-2"><Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" /><Metric icon={Clock} label="In Progress" value={totals.offeredCount} tone="amber" /><Metric icon={Award} label="Completed" value={totals.completedCount} tone="emerald" /></div>}
    </div>
  );
}
