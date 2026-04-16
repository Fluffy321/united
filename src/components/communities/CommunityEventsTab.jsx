import React, { useState, useEffect } from 'react';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { MapPin, Clock, Users, ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CreateCommunityEventModal from './CreateCommunityEventModal';

const RSVP_OPTIONS = [
  { value: 'going', label: '✅ Going', activeClass: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'maybe', label: '🤔 Maybe', activeClass: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'not_attending', label: '❌ Can\'t go', activeClass: 'bg-red-100 text-red-600 border-red-200' },
];

function EventCard({ event, past, currentUser }) {
  const [rsvp, setRsvp] = useState(null); // 'going' | 'maybe' | 'not_attending' | null
  const [rsvpRecord, setRsvpRecord] = useState(null);
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, maybe: 0 });
  const [attendees, setAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [loading, setLoading] = useState(false);

  const dateStr = event.start_date || event.event_date;
  const gradient = past ? 'from-slate-400 to-slate-500' : 'from-green-500 to-teal-600';

  useEffect(() => {
    loadRsvpData();
  }, [event.id, currentUser?.id]);

  const loadRsvpData = async () => {
    const [allRsvps, userRsvp] = await Promise.all([
      base44.entities.CommunityEventRSVP.filter({ event_id: event.id }),
      currentUser
        ? base44.entities.CommunityEventRSVP.filter({ event_id: event.id, user_id: currentUser.id })
        : Promise.resolve([]),
    ]);
    const going = allRsvps.filter(r => r.status === 'going');
    const maybe = allRsvps.filter(r => r.status === 'maybe');
    setRsvpCounts({ going: going.length, maybe: maybe.length });
    setAttendees(going);
    if (userRsvp[0]) {
      setRsvp(userRsvp[0].status);
      setRsvpRecord(userRsvp[0]);
    }
  };

  const handleRsvp = async (status) => {
    if (!currentUser) { toast.error('Sign in to RSVP'); return; }
    if (past) return;
    setLoading(true);
    try {
      if (rsvpRecord) {
        if (rsvp === status) {
          // Toggle off
          await base44.entities.CommunityEventRSVP.delete(rsvpRecord.id);
          setRsvp(null);
          setRsvpRecord(null);
        } else {
          await base44.entities.CommunityEventRSVP.update(rsvpRecord.id, { status });
          setRsvp(status);
          setRsvpRecord(r => ({ ...r, status }));
        }
      } else {
        const created = await base44.entities.CommunityEventRSVP.create({
          event_id: event.id,
          community_id: event.community_id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name || 'Member',
          status,
        });
        setRsvp(status);
        setRsvpRecord(created);
      }
      await loadRsvpData();
      toast.success(status === 'going' ? "You're going! 🎉" : status === 'maybe' ? "Marked as maybe" : "RSVP updated");
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${past ? 'border-slate-100 opacity-75' : 'border-slate-100'}`}>
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-4 flex gap-4">
        {/* Date badge */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white shadow-sm`}>
          {dateStr ? (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">{format(parseISO(dateStr), 'MMM')}</span>
              <span className="text-[22px] font-black leading-none">{format(parseISO(dateStr), 'd')}</span>
            </>
          ) : (
            <span className="text-[11px] font-bold">TBD</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-bold leading-snug ${past ? 'text-slate-500' : 'text-slate-900'}`}>
            {event.title || event.name}
          </p>
          {dateStr && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />{format(parseISO(dateStr), 'EEEE, MMMM d')}
              {event.start_time && ` · ${event.start_time}`}
            </p>
          )}
          {(event.location_text || event.location) && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3" />{event.location_text || event.location}
            </p>
          )}
          {event.description && (
            <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-2">{event.description}</p>
          )}

          {!past && (
            <div className="mt-3 space-y-2">
              {/* RSVP buttons */}
              <div className="flex gap-2 flex-wrap">
                {RSVP_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleRsvp(opt.value)}
                    disabled={loading}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold border transition-all active:scale-95 disabled:opacity-60 ${
                      rsvp === opt.value
                        ? opt.activeClass
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {loading && rsvp === opt.value ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Counts + attendee toggle */}
              {(rsvpCounts.going > 0 || rsvpCounts.maybe > 0) && (
                <button
                  onClick={() => setShowAttendees(v => !v)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  {rsvpCounts.going > 0 && <span className="text-green-600 font-semibold">{rsvpCounts.going} going</span>}
                  {rsvpCounts.going > 0 && rsvpCounts.maybe > 0 && <span>·</span>}
                  {rsvpCounts.maybe > 0 && <span className="text-amber-600 font-semibold">{rsvpCounts.maybe} maybe</span>}
                  {showAttendees ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {/* Attendee list */}
              {showAttendees && attendees.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Going</p>
                  {attendees.map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
                        {(a.user_name || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-[12px] text-slate-700">{a.user_name || 'Member'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {past && (
            <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Past event</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunityEventsTab({ events: initialEvents, currentUser, communityId, isAdmin }) {
  const [events, setEvents] = useState(initialEvents || []);
  const [showCreate, setShowCreate] = useState(false);

  // Keep in sync if parent re-fetches
  useEffect(() => { setEvents(initialEvents || []); }, [initialEvents]);

  const upcoming = events.filter(e => {
    const d = e.start_date || e.event_date;
    return !d || isFuture(parseISO(d));
  });
  const past = events.filter(e => {
    const d = e.start_date || e.event_date;
    return d && isPast(parseISO(d));
  });

  const handleCreated = (newEvent) => {
    setEvents(prev => [newEvent, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Admin: create button */}
      {isAdmin && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-2xl py-3 text-[14px] font-bold hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      )}

      {events.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[15px] font-bold text-slate-900">No events yet</p>
          <p className="text-[13px] text-slate-500 mt-1">
            {isAdmin ? 'Create your first event above.' : 'Upcoming events will appear here.'}
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-[13px] font-bold text-slate-700 mb-2">Upcoming</p>
              <div className="space-y-3">
                {upcoming.map(e => <EventCard key={e.id} event={e} currentUser={currentUser} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-[13px] font-bold text-slate-400 mb-2">Past Events</p>
              <div className="space-y-3">
                {past.map(e => <EventCard key={e.id} event={e} past currentUser={currentUser} />)}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateCommunityEventModal
          communityId={communityId}
          currentUser={currentUser}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}