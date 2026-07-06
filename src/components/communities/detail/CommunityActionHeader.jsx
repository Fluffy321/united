import MemberAvatarStack from './MemberAvatarStack';
import { formatRelativeActivity, isAnn } from './shared';

export default function CommunityActionHeader({ community, typeConfig, posts, activeNeeds, events, resources, members, onTabChange }) {
  const latestPost = posts[0];
  const latestPostAge = formatRelativeActivity(latestPost?.created_at || latestPost?.created_date);
  const upcomingEvents = events.filter((event) => {
    const value = event.start_date || event.event_date;
    return !value || new Date(value) >= new Date();
  });
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const hasAnyActivity = posts.length > 0 || activeNeeds.length > 0 || upcomingEvents.length > 0 || resources.length > 0;
  const Icon = typeConfig.icon;

  const focus = activeNeeds.length
    ? { label: `${activeNeeds.length} open ${activeNeeds.length === 1 ? 'need' : 'needs'}`, tab: 'openNeeds', tone: 'text-rose-700 bg-rose-50 border-rose-100' }
    : upcomingEvents.length
      ? { label: `${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? 'event' : 'events'}`, tab: 'events', tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
      : latestPost
        ? { label: `Updated ${latestPostAge || 'recently'}`, tab: isAnn(latestPost) ? 'announcements' : 'posts', tone: 'text-blue-700 bg-blue-50 border-blue-100' }
        : { label: 'Ready to launch', tab: 'posts', tone: 'text-slate-700 bg-slate-50 border-slate-100' };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm">
      <div className={`relative bg-gradient-to-br ${typeConfig.accent} px-5 py-5 text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_38%)]" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white/75">Community home</p>
            <h2 className="mt-1 text-[22px] font-black leading-tight">
              {hasAnyActivity ? 'What needs attention now?' : 'Make this space useful from day one'}
            </h2>
            <p className="mt-2 text-[13px] font-semibold leading-5 text-white/82">
              {hasAnyActivity
                ? 'The home page now points members toward live updates, open needs, events, and the next action.'
                : 'Invite a few people, post the first update, and give this community a clear reason to come back.'}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-white">
        <button type="button" onClick={() => onTabChange(focus.tab)} className="px-3 py-3 text-left active:bg-slate-50">
          <span className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[10px] font-black ${focus.tone}`}>
            <span className="truncate">{focus.label}</span>
          </span>
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Right now</p>
        </button>
        <button type="button" onClick={() => onTabChange('members')} className="px-3 py-3 text-left active:bg-slate-50">
          <MemberAvatarStack members={members} typeConfig={typeConfig} />
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">{memberCount} members</p>
        </button>
        <button type="button" onClick={() => onTabChange('posts')} className="px-3 py-3 text-left active:bg-slate-50">
          <p className="text-[18px] font-black text-slate-950">{posts.length}</p>
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Posts</p>
        </button>
      </div>
    </section>
  );
}
