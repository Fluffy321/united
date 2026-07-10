import React from 'react';
import { AlertCircle, Award, BookOpen, Car, ChevronRight, Clock, HandHeart, Heart, Laptop, PartyPopper, ShoppingBag, Sparkles, Users, Utensils } from 'lucide-react';
import Metric from './Metric';

export default function MitzvahCircleHero({
  activeView,
  hasMitzvahStats,
  totals,
  onPostRequest,
  onChangeView,
  onChangeBrowseCategory,
}) {
  if (activeView === 'shuls') return null;

  // One tile per request category (see CATEGORIES in shared.js) so every kind
  // of need starts here with one tap. iPhone-first: 2-up grid, no side-scroll.
  const quickNeeds = [
    { label: 'Ride or carpool', sub: 'Get where you need', icon: Car, tone: 'bg-amber-50 text-amber-700', onClick: () => onChangeView('rides') },
    { label: 'Errand', sub: 'Pickup or dropoff', icon: ShoppingBag, tone: 'bg-sky-50 text-sky-700', onClick: () => onPostRequest({ category: 'Errands' }) },
    { label: 'Meals', sub: 'Food when it counts', icon: Utensils, tone: 'bg-orange-50 text-orange-700', onClick: () => onPostRequest({ category: 'Food / Meals' }) },
    { label: 'Childcare', sub: 'Babysitting help', icon: Users, tone: 'bg-rose-50 text-rose-700', onClick: () => onPostRequest({ category: 'Babysitting' }) },
    { label: 'Elderly care', sub: 'Visits and check-ins', icon: Heart, tone: 'bg-pink-50 text-pink-700', onClick: () => onPostRequest({ category: 'Elderly Support' }) },
    { label: 'Tutoring', sub: 'Learning help', icon: BookOpen, tone: 'bg-violet-50 text-violet-700', onClick: () => onPostRequest({ category: 'Tutoring' }) },
    { label: 'Tech help', sub: 'Devices and setup', icon: Laptop, tone: 'bg-cyan-50 text-cyan-700', onClick: () => onPostRequest({ category: 'Tech Help' }) },
    { label: 'Shul help', sub: 'Minyan and setup', icon: Sparkles, tone: 'bg-indigo-50 text-indigo-700', onClick: () => onPostRequest({ category: 'Shul Help' }) },
    { label: 'Simcha help', sub: 'Event hands', icon: PartyPopper, tone: 'bg-emerald-50 text-emerald-700', onClick: () => onPostRequest({ category: 'Simcha Help' }) },
    { label: 'Something else', sub: 'Anything at all', icon: HandHeart, tone: 'bg-slate-100 text-slate-700', onClick: () => onPostRequest({ category: 'Other' }) },
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
        <div className="mb-2.5"><h2 className="text-[17px] font-black text-slate-950">What do you need?</h2><p className="text-[12px] font-semibold text-slate-500">Tap a need — we&rsquo;ll start the request for you.</p></div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {quickNeeds.map(({ label, sub, icon: Icon, tone, onClick }) => (
            <button key={label} onClick={onClick} className="motion-press surface-tile flex min-h-[64px] items-center gap-3 rounded-[18px] p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block text-[13px] font-black leading-tight text-slate-900">{label}</span><span className="block truncate text-[10px] font-semibold text-slate-400">{sub}</span></span>
            </button>
          ))}
        </div>
      </section>

      <button onClick={() => onPostRequest({ urgency: 'Urgent' })} className="flex w-full items-center gap-3 rounded-[20px] border border-rose-100 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><AlertCircle className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[13px] font-black text-rose-950">Need help urgently?</span><span className="block text-[11px] font-semibold text-rose-700">Post a time-sensitive request so your neighbors can respond quickly.</span></span><ChevronRight className="h-4 w-4 text-rose-500" /></button>

      {hasMitzvahStats && <div className="grid grid-cols-3 gap-2"><Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" /><Metric icon={Clock} label="In Progress" value={totals.offeredCount} tone="amber" /><Metric icon={Award} label="Completed" value={totals.completedCount} tone="emerald" /></div>}
    </div>
  );
}
