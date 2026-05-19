import React, { useMemo } from 'react';
import { CalendarDays, ChevronRight, HeartHandshake, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const eventDate = new Date(dateStr);
  if (Number.isNaN(eventDate.getTime())) return '';
  const now = new Date();
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysDiff = Math.round((eventDay - todayDay) / 86400000);
  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Tomorrow';
  if (daysDiff < 7) return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function chesedStatusLabel(status) {
  const map = {
    volunteer_offered: 'Offer pending',
    accepted: 'Accepted',
    in_progress: 'In progress',
  };
  return map[status] || 'Active';
}

export default function CommunityPersonalizationHub({
  communityId,
  currentUser,
  events = [],
  typeConfig,
  onTabChange,
  onOpenEvent,
}) {
  const isChesed = typeConfig?.key === 'chesed';

  // Fetch only the user's RSVP event IDs for this community — tiny payload.
  // Cross-reference with the events array already fetched by the parent.
  const { data: myRsvps = [] } = useQuery({
    queryKey: ['my-community-rsvps', communityId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_event_rsvps')
        .select('event_id, status')
        .eq('user_id', currentUser.id)
        .eq('community_id', communityId)
        .in('status', ['going', 'maybe']);
      return data || [];
    },
    enabled: Boolean(currentUser?.id && communityId && events.length > 0),
    staleTime: 60000,
  });

  // For chesed communities only: items where the current user is the assigned volunteer.
  const { data: myChesedItems = [] } = useQuery({
    queryKey: ['my-chesed-commitments', communityId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('mitzvah_requests')
        .select('id, title, status, category')
        .eq('community_id', communityId)
        .eq('claimed_by_user_id', currentUser.id)
        .in('status', ['volunteer_offered', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: Boolean(currentUser?.id && communityId && isChesed),
    staleTime: 60000,
  });

  const rsvpEventIds = useMemo(() => new Set(myRsvps.map((r) => r.event_id)), [myRsvps]);

  const upcomingMyEvents = useMemo(() => {
    if (!rsvpEventIds.size) return [];
    const now = new Date();
    return events
      .filter((e) => rsvpEventIds.has(e.id) && new Date(e.start_date || e.event_date) >= now)
      .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date))
      .slice(0, 3);
  }, [events, rsvpEventIds]);

  const hasRsvps = upcomingMyEvents.length > 0;
  const hasChesed = myChesedItems.length > 0;

  if (!hasRsvps && !hasChesed) return null;

  const title = hasRsvps && hasChesed
    ? 'For you'
    : hasRsvps
      ? 'Your upcoming events'
      : 'Your commitments';

  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-50 px-4 py-3">
        <User className="h-3.5 w-3.5 text-blue-600" />
        <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">{title}</p>
      </div>
      <div className="divide-y divide-slate-50">
        {upcomingMyEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onOpenEvent ? onOpenEvent(event) : onTabChange?.('events')}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900">{event.title || event.name}</p>
              <p className="text-[11px] font-semibold text-slate-500">{formatEventDate(event.start_date || event.event_date)}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        ))}
        {myChesedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange?.('openNeeds')}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <HeartHandshake className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900">{item.title}</p>
              <p className="text-[11px] font-semibold text-slate-500">{chesedStatusLabel(item.status)}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        ))}
      </div>
    </section>
  );
}
