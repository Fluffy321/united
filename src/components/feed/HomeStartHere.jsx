import React from 'react';
import { HeartHandshake, MapPinned, Megaphone, UsersRound } from 'lucide-react';

const ACTIONS = [
  {
    id: 'share',
    label: 'Share an update',
    detail: 'Post something local',
    icon: Megaphone,
    tone: 'border-blue-200 bg-blue-50 text-blue-800',
    callback: 'onShare',
  },
  {
    id: 'help',
    label: 'Ask for help',
    detail: 'Start a private or public request',
    icon: HeartHandshake,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    callback: 'onHelp',
  },
  {
    id: 'communities',
    label: 'Find communities',
    detail: 'Join a useful local circle',
    icon: UsersRound,
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
    callback: 'onCommunities',
  },
  {
    id: 'directory',
    label: 'Browse directory',
    detail: 'Find nearby places and services',
    icon: MapPinned,
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
    callback: 'onDirectory',
  },
];

export default function HomeStartHere({
  onShare,
  onHelp,
  onCommunities,
  onDirectory,
}) {
  const callbacks = { onShare, onHelp, onCommunities, onDirectory };

  return (
    <section aria-labelledby="home-start-here-heading" className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="px-0.5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">No waiting required</p>
        <h3 id="home-start-here-heading" className="mt-1 text-[17px] font-black tracking-[-0.025em] text-slate-900">Start here</h3>
        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Use the parts of JUnited that are ready now.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ id, label, detail, icon: Icon, tone, callback }) => (
          <button
            key={id}
            type="button"
            onClick={callbacks[callback]}
            className={`motion-press min-h-[88px] rounded-2xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${tone}`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
            <strong className="mt-2 block text-[12px] font-black leading-tight text-slate-900">{label}</strong>
            <span className="mt-1 block text-[9.5px] font-bold leading-snug opacity-70">{detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
