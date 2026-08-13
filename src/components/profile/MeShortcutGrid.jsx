import React from 'react';
import { Bookmark, CalendarDays, HandHeart, Users } from 'lucide-react';

const shortcuts = [
  { key: 'communities', label: 'My communities', Icon: Users, tone: 'bg-blue-50 text-blue-600', detail: ({ communityCount }) => `${communityCount} joined` },
  { key: 'saved', label: 'Saved', Icon: Bookmark, tone: 'bg-violet-50 text-violet-600', detail: ({ savedCount }) => savedCount ? `${savedCount} saved` : 'Posts and places' },
  { key: 'help', label: 'Help activity', Icon: HandHeart, tone: 'bg-emerald-50 text-emerald-600', detail: ({ helpCount }) => helpCount ? `${helpCount} actions` : 'Requests and offers' },
  { key: 'plans', label: 'Plans', Icon: CalendarDays, tone: 'bg-orange-50 text-orange-600', detail: () => 'Events and reminders' },
];

export default function MeShortcutGrid({ communityCount = 0, savedCount = 0, helpCount = 0, onCommunities, onSaved, onHelp, onPlans }) {
  const handlers = { communities: onCommunities, saved: onSaved, help: onHelp, plans: onPlans };
  const counts = { communityCount, savedCount, helpCount };
  return (
    <section data-testid="me-shortcuts">
      <h2 className="mb-2 px-1 text-[15px] font-black text-slate-950">Your places</h2>
      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map(({ key, label, Icon, tone, detail }) => (
          <button key={key} type="button" onClick={handlers[key]} className="min-h-[88px] rounded-[18px] border border-slate-200 bg-white p-3 text-left shadow-sm transition active:scale-[0.98]">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
            <span className="mt-2 block text-[12px] font-black text-slate-900">{label}</span>
            <span className="mt-0.5 block text-[10px] text-slate-400">{detail(counts)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
