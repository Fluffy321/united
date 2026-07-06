import { Activity, ChevronRight, MessageCircle, Users, Vote } from 'lucide-react';

export default function CommunityMomentumPanel({
  kit,
  posts,
  activeNeeds,
  events,
  memberCount,
  onPrompt,
  onTabChange,
  visibleTabs = [],
}) {
  const upcomingEvents = events.filter((event) => {
    const value = event.start_date || event.event_date;
    return !value || new Date(value) >= new Date();
  });
  const boardCards = [
    {
      icon: Activity,
      label: 'Live now',
      value: activeNeeds.length ? `${activeNeeds.length} open needs` : upcomingEvents.length ? `${upcomingEvents.length} plans` : 'Ready',
      helper: activeNeeds.length ? 'People can act now' : upcomingEvents.length ? 'Open the next plan' : kit.missionTitle,
      tone: 'bg-rose-50 text-rose-700 border-rose-100',
      tab: activeNeeds.length ? 'openNeeds' : upcomingEvents.length ? 'events' : 'posts',
    },
    {
      icon: MessageCircle,
      label: 'Room feed',
      value: `${posts.length} thread${posts.length === 1 ? '' : 's'}`,
      helper: posts.length ? 'Keep it moving' : kit.feedEmptyTitle,
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
      tab: 'posts',
    },
    {
      icon: Users,
      label: 'People',
      value: `${memberCount || 0} here`,
      helper: memberCount > 1 ? 'Invite them into action' : 'Bring in the first few',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      tab: 'members',
    },
  ];
  const openTab = (tab) => onTabChange(visibleTabs.includes(tab) ? tab : 'posts');

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-rose-500">Active today</p>
          <h3 className="text-[17px] font-black leading-tight text-slate-950">{kit.boardTitle}</h3>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{kit.boardBody}</p>
        </div>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">
          {posts.length + activeNeeds.length + upcomingEvents.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {boardCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => openTab(card.tab)}
              className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${card.tone}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/75">
                  <Icon className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wide opacity-70">{card.label}</p>
              <p className="mt-0.5 text-[15px] font-black leading-tight">{card.value}</p>
              <p className="mt-1 text-[11px] font-bold leading-snug opacity-75">{card.helper}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Vote className="h-4 w-4 text-blue-600" />
          <p className="text-[12px] font-black text-slate-900">{kit.pollQuestion}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {kit.pollOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPrompt(`Vote: ${option}. I think we should organize this next.`)}
              className="flex-shrink-0 rounded-full border border-white bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm active:scale-95 transition-all"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
