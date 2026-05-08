import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function SavedEventsSection({ userId }) {
  const { data: rsvps = [] } = useQuery({
    queryKey: ['user-rsvps', userId],
    queryFn: () => dataService.entities.RSVP.filter({ user_id: userId }, '-created_date', 20),
    enabled: !!userId,
    staleTime: 300000,
    retry: 1
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['event-posts-for-rsvps', rsvps.map(r => r.post_id).join(',')],
    queryFn: async () => {
      if (!rsvps.length) return [];
      const postIds = rsvps.map(r => r.post_id).filter(Boolean);
      const results = await Promise.allSettled(
        postIds.map(id => dataService.entities.UnifiedPost.filter({ id }))
      );
      return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    },
    enabled: rsvps.length > 0,
    staleTime: 300000,
    retry: 0
  });

  if (!rsvps.length) return null;

  const eventMap = {};
  allPosts.forEach(p => { eventMap[p.id] = p; });

  const upcomingRsvps = rsvps
    .map(r => ({ rsvp: r, post: eventMap[r.post_id] }))
    .filter(({ post }) => post && post.type === 'event')
    .slice(0, 5);

  if (!upcomingRsvps.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-500" />
        <h3 className="font-bold text-[15px] text-slate-900">Saved Events</h3>
        <span className="ml-auto text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{upcomingRsvps.length}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {upcomingRsvps.map(({ rsvp, post }) => (
          <div key={rsvp.id} className="px-4 py-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                {post.event_date ? format(parseISO(post.event_date), 'MMM') : '—'}
              </span>
              <span className="text-[16px] font-black text-blue-700 leading-none">
                {post.event_date ? format(parseISO(post.event_date), 'd') : '—'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-slate-900 line-clamp-1">{post.title || post.body?.slice(0, 60)}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {post.event_time && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />{post.event_time}
                  </span>
                )}
                {post.location_text && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3" />{post.location_text}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">Going</span>
          </div>
        ))}
      </div>
    </div>
  );
}