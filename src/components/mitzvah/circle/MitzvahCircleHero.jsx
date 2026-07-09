import React from 'react';
import { AlertCircle, Award, BookOpen, Car, ChevronRight, Clock, HandHeart, Heart, Laptop, Search, ShoppingBag, Sparkles, Users, Utensils } from 'lucide-react';
import Metric from './Metric';
import { CATEGORY_GROUPS } from './shared';

export default function MitzvahCircleHero({
  activeView,
  hasMitzvahStats,
  totals,
  onPostRequest,
  onChangeView,
  activeCategory,
  onChangeBrowseCategory,
  query,
  onQueryChange,
}) {
  if (activeView === 'shuls') return null;

  const quickNeeds = [
    { label: 'Ride or carpool', icon: Car, tone: 'bg-amber-50 text-amber-700', onClick: () => onChangeView('rides') },
    { label: 'Errand', icon: ShoppingBag, tone: 'bg-sky-50 text-sky-700', onClick: () => onPostRequest({ category: 'Errands' }) },
    { label: 'Meals', icon: Utensils, tone: 'bg-orange-50 text-orange-700', onClick: () => onPostRequest({ category: 'Food / Meals' }) },
    { label: 'Childcare', icon: Users, tone: 'bg-rose-50 text-rose-700', onClick: () => onPostRequest({ category: 'Babysitting' }) },
    { label: 'Check-in', icon: Heart, tone: 'bg-pink-50 text-pink-700', onClick: () => onPostRequest({ category: 'Elderly Support' }) },
    { label: 'Tutoring', icon: BookOpen, tone: 'bg-violet-50 text-violet-700', onClick: () => onPostRequest({ category: 'Tutoring' }) },
    { label: 'Tech help', icon: Laptop, tone: 'bg-cyan-50 text-cyan-700', onClick: () => onPostRequest({ category: 'Tech Help' }) },
    { label: 'Shul or simcha', icon: Sparkles, tone: 'bg-indigo-50 text-indigo-700', onClick: () => onPostRequest({ category: 'Shul Help' }) },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[24px] bg-[#0B2E6D] p-4 text-white shadow-[0_16px_32px_rgba(16,72,166,0.2)]" style={{ backgroundImage: 'radial-gradient(circle at 92% 2%, rgba(110,205,255,.42), transparent 30%), linear-gradient(135deg, #073477, #1261DD)' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0"><div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-100"><Sparkles className="h-3 w-3" /> Community support</div><h2 className="text-[19px] font-black leading-tight tracking-tight">How can we help today?</h2></div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15"><HandHeart className="h-4 w-4" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => onPostRequest()} className="motion-press flex items-center gap-2.5 rounded-2xl bg-white px-3 py-3 text-left text-slate-950 shadow-lg"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><AlertCircle className="h-4 w-4" /></span><span><span className="block text-[13px] font-black">I need help</span><span className="block text-[10px] font-semibold text-slate-500">Post a request</span></span></button>
          <button onClick={() => { onChangeBrowseCategory('all'); onChangeView('browse'); }} className="motion-press flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-left backdrop-blur"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-300/20 text-emerald-100"><HandHeart className="h-4 w-4" /></span><span><span className="block text-[13px] font-black">I can help</span><span className="block text-[10px] font-semibold text-blue-100">Browse needs</span></span></button>
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between"><div><h2 className="text-[16px] font-black text-slate-950">What do you need?</h2><p className="text-[12px] font-semibold text-slate-500">Start with the kind of support you need.</p></div><button onClick={() => onPostRequest()} className="text-[12px] font-black text-blue-600">Something else</button></div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {quickNeeds.map(({ label, icon: Icon, tone, onClick }) => <button key={label} onClick={onClick} className="motion-press surface-tile flex min-h-[76px] items-center gap-3 rounded-[18px] p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span><span className="text-[12px] font-black leading-tight text-slate-800">{label}</span></button>)}
        </div>
        <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-[13px] font-black text-slate-950">Want to help someone?</p><p className="text-[11px] font-semibold text-slate-500">Choose a need to see open requests.</p></div></div>
          <div className="mobile-scroll-x flex gap-2 pb-2">
            {CATEGORY_GROUPS.map((group) => { const Icon = group.icon; const selected = activeCategory === group.id; return <button key={group.id} type="button" onClick={() => { onChangeBrowseCategory(group.id); onChangeView('browse'); }} className={`motion-press shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${selected ? group.tone : 'border-slate-200 bg-slate-50 text-slate-600'}`}><span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{group.shortLabel}</span></button>; })}
          </div>
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search open requests" className="app-input h-10 w-full pl-10 pr-3 text-sm" /></label>
        </div>
      </section>

      <button onClick={() => onPostRequest({ urgency: 'Urgent' })} className="flex w-full items-center gap-3 rounded-[20px] border border-rose-100 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><AlertCircle className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[13px] font-black text-rose-950">Need help urgently?</span><span className="block text-[11px] font-semibold text-rose-700">Post a time-sensitive request so your neighbors can respond quickly.</span></span><ChevronRight className="h-4 w-4 text-rose-500" /></button>

      {hasMitzvahStats && <div className="grid grid-cols-3 gap-2"><Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" /><Metric icon={Clock} label="In Progress" value={totals.offeredCount} tone="amber" /><Metric icon={Award} label="Completed" value={totals.completedCount} tone="emerald" /></div>}
    </div>
  );
}
