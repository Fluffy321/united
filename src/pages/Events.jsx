import React, { useState, useEffect } from 'react';
import { tabActive, tabInactive, btnPrimary, btnSecondary, badgeBlue, gradientStyle } from '@/lib/theme';
import { Calendar, MapPin, Clock, Plus, ChevronLeft, Users, Ticket } from 'lucide-react';
import PaymentModal from '@/components/payments/PaymentModal';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';

const FILTERS = [
  { id: 'upcoming', label: '📅 Upcoming' },
  { id: 'today', label: '⚡ Today' },
  { id: 'this_week', label: '🗓️ This Week' },
  { id: 'past', label: '✅ Past' },
];

const TYPE_COLORS = {
  event: 'bg-purple-100 text-purple-700',
  shul: 'bg-blue-100 text-blue-700',
  food: 'bg-orange-100 text-orange-700',
};

export default function Events() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentEvent, setPaymentEvent] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['all-events'],
    queryFn: () => base44.entities.UnifiedPost.filter({ type: 'event' }, '-created_date', 80),
    staleTime: 60000,
  });

  const { data: rsvps = [] } = useQuery({
    queryKey: ['my-rsvps', currentUser?.id],
    queryFn: () => base44.entities.RSVP.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 60000,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ event, isGoing }) => {
      if (isGoing) {
        const existing = rsvps.find(r => r.post_id === event.id);
        if (existing) await base44.entities.RSVP.delete(existing.id);
        await base44.entities.UnifiedPost.update(event.id, { likes_count: Math.max(0, (event.likes_count || 0) - 1) });
      } else {
        await base44.entities.RSVP.create({ post_id: event.id, user_id: currentUser.id, user_name: currentUser.display_name || currentUser.full_name });
        await base44.entities.UnifiedPost.update(event.id, { likes_count: (event.likes_count || 0) + 1 });
        toast.success('You\'re going! 🎉');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
    }
  });

  const rsvpSet = new Set(rsvps.map(r => r.post_id));
  const today = startOfToday();

  const filtered = events.filter(e => {
    const eventDate = e.event_date ? parseISO(e.event_date) : null;
    if (activeFilter === 'today') return eventDate && format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    if (activeFilter === 'this_week') {
      if (!eventDate) return false;
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
      return !isBefore(eventDate, today) && isBefore(eventDate, weekEnd);
    }
    if (activeFilter === 'past') return eventDate && isBefore(eventDate, today);
    if (activeFilter === 'upcoming') return !eventDate || !isBefore(eventDate, today);
    return true;
  }).sort((a, b) => {
    if (!a.event_date) return 1;
    if (!b.event_date) return -1;
    return a.event_date.localeCompare(b.event_date);
  });

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100" style={{ boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-[17px] font-bold text-slate-900">Events</h1>
          </div>
          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-[12px] font-bold shadow hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={activeFilter === f.id ? tabActive : tabInactive}
              style={activeFilter === f.id ? gradientStyle : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No events found</p>
            <p className="text-[13px] text-slate-400 mt-1">
              {currentUser ? 'Be the first to create one!' : 'Check back soon'}
            </p>
            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 text-white rounded-full px-5 py-2 text-[13px] font-bold"
              >
                Create Event
              </button>
            )}
          </div>
        ) : filtered.map(event => {
          const isGoing = rsvpSet.has(event.id);
          const attendeeCount = event.likes_count || 0;
          return (
            <div key={event.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {event.image_url && (
                <img src={event.image_url} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                {/* Date badge */}
                {event.event_date && (
                  <div className="flex items-center gap-1.5 text-blue-600 text-[12px] font-semibold mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(event.event_date), 'EEEE, MMMM d')}
                    {event.event_time && <><Clock className="w-3 h-3 ml-1" />{event.event_time}</>}
                  </div>
                )}

                <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-1">
                  {event.title || event.body?.slice(0, 80)}
                </h3>
                {event.title && event.body && (
                  <p className="text-[13px] text-slate-500 line-clamp-2 mb-2">{event.body}</p>
                )}

                <div className="flex items-center gap-3 text-[12px] text-slate-400 mb-3">
                  {event.location_text && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location_text}</span>
                  )}
                  {attendeeCount > 0 && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{attendeeCount} going</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-slate-400">by {event.user_name}</span>
                  <div className="flex items-center gap-2">
                    {event.ticket_price > 0 && currentUser && (
                      <button
                        onClick={() => setPaymentEvent(event)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all"
                      >
                        <Ticket className="w-3 h-3" /> ${event.ticket_price}
                      </button>
                    )}
                    {currentUser && (
                      <button
                        onClick={() => rsvpMutation.mutate({ event, isGoing })}
                        disabled={rsvpMutation.isPending}
                        className={isGoing ? badgeBlue + ' px-4 py-1.5 text-[12px]' : btnPrimary + ' text-[12px] py-1.5'}
                        style={isGoing ? {} : gradientStyle}
                      >
                        {isGoing ? '✓ Going' : 'RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {paymentEvent && (
        <PaymentModal
          open={!!paymentEvent}
          onOpenChange={(v) => { if (!v) setPaymentEvent(null); }}
          type="event_registration"
          fixedAmount={paymentEvent.ticket_price}
          description={`Ticket: ${paymentEvent.title || paymentEvent.body?.slice(0, 60)}`}
          relatedEntityId={paymentEvent.id}
          relatedEntityType="event"
        />
      )}

      {currentUser && (
        <UnifiedPostModal
          open={showCreateModal}
          onOpenChange={(v) => { setShowCreateModal(v); if (!v) queryClient.invalidateQueries({ queryKey: ['all-events'] }); }}
          currentUser={currentUser}
          postType="event"
        />
      )}
    </div>
  );
}