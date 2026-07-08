import { ChevronRight, Sparkles } from 'lucide-react';
import { isAnn } from './shared';

export default function RightNowBanner({ posts, events, activeNeeds, resources, typeConfig, lastVisitedAt, onTabChange }) {
  const since = lastVisitedAt ? new Date(lastVisitedAt) : null;
  const newAnn = since ? posts.filter((p) => isAnn(p) && new Date(p.created_at || p.created_date) > since).length : 0;
  const newPosts = since ? posts.filter((p) => !isAnn(p) && new Date(p.created_at || p.created_date) > since).length : 0;
  const newEvents = since ? events.filter((e) => new Date(e.created_at) > since).length : 0;
  const totalNew = newAnn + newPosts + newEvents;

  if (totalNew > 0) {
    const primaryCount = newAnn > 0 ? newAnn : newPosts > 0 ? newPosts : newEvents;
    const primaryLabel = newAnn > 0
      ? `${newAnn} new ${newAnn === 1 ? 'announcement' : 'announcements'}`
      : newPosts > 0
        ? `${newPosts} new ${newPosts === 1 ? 'post' : 'posts'}`
        : `${newEvents} new ${newEvents === 1 ? 'event' : 'events'}`;
    const action = () => onTabChange(newAnn > 0 ? 'announcements' : newPosts > 0 ? 'posts' : 'events');
    const extra = totalNew - primaryCount;
    return (
      <button
        type="button"
        onClick={action}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 text-left active:opacity-80 transition-opacity"
      >
        <Sparkles className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <span className="flex-1 text-[13px] font-bold text-slate-800">{primaryLabel}</span>
        {extra > 0 && (
          <span className="text-[11px] font-black text-blue-600 flex-shrink-0">+{extra} more</span>
        )}
        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </button>
    );
  }

  // Fall back to the single most important community item
  const typeKey = typeConfig?.key || 'general';
  const pinnedAnn = posts.find((p) => p.is_pinned && isAnn(p)) || posts.find(isAnn);
  const upcomingEvent = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date))[0];
  const urgentNeed = typeKey === 'chesed' ? activeNeeds[0] : null;
  const featuredResource = resources.find((r) => r.is_pinned) || resources[0];

  let item = null;
  if (urgentNeed) {
    item = { icon: '🙏', label: 'Open need', text: urgentNeed.title || 'Community chesed request', action: () => onTabChange('openNeeds'), colorClass: 'border-emerald-100 bg-emerald-50/80', labelClass: 'text-emerald-700' };
  } else if (pinnedAnn) {
    const raw = pinnedAnn.content || pinnedAnn.body || pinnedAnn.title || '';
    item = { icon: '📢', label: 'Latest update', text: raw.length > 80 ? `${raw.slice(0, 80)}…` : raw, action: () => onTabChange('announcements'), colorClass: 'border-amber-100 bg-amber-50/80', labelClass: 'text-amber-700' };
  } else if (upcomingEvent) {
    item = { icon: '📅', label: 'Coming up', text: upcomingEvent.title || upcomingEvent.name || '', action: () => onTabChange('events'), colorClass: 'border-blue-100 bg-blue-50/80', labelClass: 'text-blue-700' };
  } else if (featuredResource) {
    item = { icon: '📎', label: 'Resource', text: featuredResource.title || '', action: () => onTabChange('resources'), colorClass: 'border-violet-100 bg-violet-50/80', labelClass: 'text-violet-700' };
  }

  if (!item) return null;

  return (
    <button
      type="button"
      onClick={item.action}
      className={`w-full flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left active:opacity-80 transition-opacity ${item.colorClass}`}
    >
      <span className="text-sm leading-none flex-shrink-0">{item.icon}</span>
      <div className="min-w-0 flex-1">
        <span className={`block text-[10px] font-black uppercase tracking-wide ${item.labelClass}`}>{item.label}</span>
        <span className="block text-[13px] font-bold text-slate-900 leading-snug mt-0.5 line-clamp-1">{item.text}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
    </button>
  );
}
