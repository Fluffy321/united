import React, { useState } from 'react';
import { Calendar, MapPin, Clock, ChevronRight, Sparkles, Ticket, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfToday, addDays, isBefore, isToday, isTomorrow } from 'date-fns';
import EventRSVPSection from '@/components/events/EventRSVPSection';

export default function ThisWeekEvents({ currentUser }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: ['this-week-events'],
    queryFn: async () => {
      const all = await base44.entities.UnifiedPost.filter({ type: 'event' }, 'event_date', 60);
      const today = startOfToday();
      const weekEnd = addDays(today, 7);
      return all.filter(e => {
        if (!e.event_date) return false;
        const d = parseISO(e.event_date);
        return !isBefore(d, today) && isBefore(d, weekEnd);
      }).sort((a, b) => a.event_date.localeCompare(b.event_date));
    },
    staleTime: 120000,
    retry: 0,
  });

  if (!events.length) return null;

  return (
    <>
      <div className="mb-4 bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {/* Section header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-slate-900">This Week's Events</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              {events.length}
            </span>
          </div>
          <a
            href="/Events"
            className="flex items-center gap-0.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
          >
            See all <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Horizontal scroll strip */}
        <div className="flex gap-3 overflow-x-auto pb-3.5 px-4 scrollbar-hide">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              currentUser={currentUser}
              onJoin={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventDetailSheet
          event={selectedEvent}
          currentUser={currentUser}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}

function getDateLabel(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d)) return { label: 'Today', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (isTomorrow(d)) return { label: 'Tomorrow', color: 'text-orange-600', bg: 'bg-orange-50' };
  return { label: format(d, 'EEE, MMM d'), color: 'text-blue-600', bg: 'bg-blue-50' };
}

const GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-emerald-500 to-emerald-700',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-rose-600',
];

function EventCard({ event, currentUser, onJoin }) {
  const dateInfo = event.event_date ? getDateLabel(event.event_date) : null;
  const gradient = GRADIENTS[(event.id?.charCodeAt(0) || 0) % GRADIENTS.length];

  return (
    <div
      className="flex-shrink-0 w-56 rounded-2xl overflow-hidden bg-white border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}
      onClick={onJoin}
    >
      {event.image_url ? (
        <img src={event.image_url} alt="" className="w-full h-28 object-cover" />
      ) : (
        <div className={`w-full h-28 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Calendar className="w-10 h-10 text-white/70" />
        </div>
      )}

      <div className="p-3">
        {dateInfo && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${dateInfo.bg} ${dateInfo.color} mb-1.5`}>
            <Calendar className="w-2.5 h-2.5" />
            {dateInfo.label}
            {event.event_time && ` · ${event.event_time}`}
          </span>
        )}

        <p className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
          {event.title || event.body?.slice(0, 60)}
        </p>

        {event.location_text && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2.5 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.location_text}</span>
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); onJoin(); }}
          className="w-full py-1.5 rounded-xl text-white text-[12px] font-bold transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          Join Event
        </button>
      </div>
    </div>
  );
}

function EventDetailSheet({ event, currentUser, onClose }) {
  const [paying, setPaying] = useState(false);
  const dateInfo = event.event_date ? getDateLabel(event.event_date) : null;
  const fullDate = event.event_date ? format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy') : null;

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const res = await base44.functions.invoke('create-checkout', {
        amount: event.ticket_price,
        type: 'event_registration',
        description: event.title || event.body?.slice(0, 80) || 'Event Ticket',
        relatedEntityId: event.id,
        relatedEntityType: 'event',
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error('Could not start checkout');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {event.image_url ? (
          <img src={event.image_url} alt="" className="w-full h-44 object-cover" />
        ) : (
          <div className="mx-4 h-32 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Calendar className="w-12 h-12 text-white/80" />
          </div>
        )}

        <div className="px-4 py-4 space-y-3">
          {dateInfo && (
            <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full ${dateInfo.bg} ${dateInfo.color}`}>
              <Calendar className="w-3.5 h-3.5" />
              {fullDate}
              {event.event_time && (
                <><Clock className="w-3.5 h-3.5 ml-1" />{event.event_time}</>
              )}
            </span>
          )}

          <h2 className="text-[19px] font-bold text-slate-900 leading-snug">
            {event.title || event.body?.slice(0, 80)}
          </h2>

          {event.title && event.body && (
            <p className="text-[14px] text-slate-600 leading-relaxed">{event.body}</p>
          )}

          {event.location_text && (
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {event.location_text}
            </div>
          )}

          <p className="text-[12px] text-slate-400">Posted by {event.user_name}</p>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <EventRSVPSection
              postId={event.id}
              currentUser={currentUser}
              eventDate={event.event_date}
            />
          </div>

          {event.ticket_price > 0 && (
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="w-full py-3 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {paying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Ticket className="w-4 h-4" />
              )}
              {paying ? 'Processing...' : `Pay Now · $${event.ticket_price}`}
            </button>
          )}
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}