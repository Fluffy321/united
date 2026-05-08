import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, Users, X, CheckCircle2, Loader2 } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';
import { format, parseISO, isPast } from 'date-fns';

function EventDetailModal({ event, currentUser, onClose, onRSVPChange }) {
  const [rsvps, setRsvps] = useState([]);
  const [myRsvp, setMyRsvp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    dataService.entities.RSVP.filter({ post_id: event.id }).then(r => {
      setRsvps(r);
      setMyRsvp(r.find(x => x.user_id === currentUser?.id) || null);
      setLoading(false);
    });
  }, [event.id, currentUser?.id]);

  const handleRSVP = async () => {
    if (myRsvp) {
      await dataService.entities.RSVP.delete(myRsvp.id);
      setMyRsvp(null);
      setRsvps(r => r.filter(x => x.id !== myRsvp.id));
      onRSVPChange(event.id, -1);
      toast.success('RSVP removed');
    } else {
      const created = await dataService.entities.RSVP.create({
        post_id: event.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        status: 'going',
        attended: false,
      });
      setMyRsvp(created);
      setRsvps(r => [...r, created]);
      onRSVPChange(event.id, 1);
      toast.success("You're going! 🎉");
    }
  };

  const toggleAttended = async (rsvp) => {
    setMarking(rsvp.id);
    const updated = await dataService.entities.RSVP.update(rsvp.id, { attended: !rsvp.attended });
    setRsvps(r => r.map(x => x.id === rsvp.id ? updated : x));
    setMarking(null);
  };

  const eventPast = isPast(new Date(event.start_date + 'T23:59:59'));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-[18px] font-bold text-slate-900 flex-1 pr-3">{event.title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
             <div className="flex items-center gap-2 text-[13px] text-slate-600">
               <Calendar className="w-4 h-4 text-[#2563EB]" />
               <span>{format(parseISO(event.start_date), 'EEEE, MMMM d, yyyy')}</span>
             </div>
             {event.start_time && (
               <div className="flex items-center gap-2 text-[13px] text-slate-600">
                 <Clock className="w-4 h-4 text-[#2563EB]" />
                 <span>{event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}</span>
               </div>
             )}
            {event.location && (
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[13px] text-slate-600">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>{event.rsvp_count || 0} attending</span>
            </div>
          </div>

          {event.description && (
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">{event.description}</p>
          )}

          {currentUser && !eventPast && (
            <button
              onClick={handleRSVP}
              className={`w-full py-3 rounded-2xl font-bold text-[14px] mb-4 transition-all active:scale-95 ${
                myRsvp ? 'bg-slate-100 text-slate-700' : 'text-white'
              }`}
              style={!myRsvp ? { background: '#2563EB' } : {}}
            >
              {myRsvp ? '✓ Going — Cancel RSVP' : '+ RSVP — I\'m Going'}
            </button>
          )}

          {/* Attendance list — shown after event or for admin */}
          {rsvps.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                {eventPast ? 'Attendance' : 'Who\'s Going'}
              </p>
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : (
                <div className="space-y-2">
                  {rsvps.map(r => (
                    <div key={r.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-bold text-blue-600 flex-shrink-0">
                        {r.user_name?.[0] || '?'}
                      </div>
                      <span className="flex-1 text-[13px] font-medium text-slate-800">{r.user_name}</span>
                      {eventPast && (
                        <button
                          onClick={() => toggleAttended(r)}
                          disabled={marking === r.id}
                          className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            r.attended ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {marking === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {r.attended ? 'Attended' : 'Mark'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ groupId, currentUser, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', end_time: '', location: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    const event = await dataService.entities.CommunityEvent.create({
      community_id: groupId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      start_date: form.date,
      start_time: form.time || undefined,
      end_date: form.date,
      end_time: form.end_time || undefined,
      location: form.location.trim() || undefined,
      is_official: false,
    });
    setSaving(false);
    onCreated(event);
    toast.success('Event created!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-bold text-slate-900">Create Event</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Event Name *</label>
              <input
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Basketball Game" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Date *</label>
              <input
                type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Start Time</label>
                <input
                  type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">End Time</label>
                <input
                  type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Location</label>
              <input
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Main Hall, Room 204"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Description</label>
              <textarea
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="What's this event about?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] transition-colors resize-none"
              />
            </div>
            <button
              type="submit" disabled={saving || !form.title.trim() || !form.date}
              className="w-full py-3.5 rounded-2xl font-bold text-[14px] text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#2563EB' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function GroupEventsTab({ group, currentUser, isMember }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    dataService.entities.CommunityEvent.filter({ community_id: group.id }, 'start_date', 50).then(e => {
      setEvents(e);
      setLoading(false);
    });
  }, [group.id]);

  const handleCreated = (event) => {
    setEvents(prev => [event, ...prev].sort((a, b) => a.start_date.localeCompare(b.start_date)));
    setShowCreate(false);
  };

  const handleRSVPChange = (eventId, delta) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, rsvp_count: (e.rsvp_count || 0) + delta } : e));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(e => ({ ...e, rsvp_count: (e.rsvp_count || 0) + delta }));
    }
  };

  const upcoming = events.filter(e => !isPast(new Date(e.start_date + 'T23:59:59')));
  const past = events.filter(e => isPast(new Date(e.start_date + 'T23:59:59')));

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      {isMember && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-3 bg-white border border-dashed border-[#2563EB] rounded-2xl p-4 text-left transition-colors hover:bg-blue-50 active:scale-[0.99]"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#2563EB]">Create Event</p>
            <p className="text-[11px] text-slate-400">Add something for your community</p>
          </div>
        </button>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[14px] font-semibold text-slate-700">No events yet</p>
          <p className="text-[12px] text-slate-400 mt-1">{isMember ? 'Create the first event!' : 'Events will appear here'}</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">Upcoming</p>
              <div className="space-y-2.5">
                {upcoming.map(event => <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-2.5 mt-2">Past Events</p>
              <div className="space-y-2.5 opacity-60">
                {past.map(event => <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} past />)}
              </div>
            </section>
          )}
        </>
      )}

      {showCreate && (
        <CreateEventModal groupId={group.id} currentUser={currentUser} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} currentUser={currentUser} onClose={() => setSelectedEvent(null)} onRSVPChange={handleRSVPChange} />
      )}
    </div>
  );
}

function EventCard({ event, onClick, past }) {
  const dateStr = format(parseISO(event.start_date), 'EEE, MMM d');
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center border border-blue-100">
        <span className="text-[10px] font-bold text-blue-400 uppercase leading-none">{dateStr.split(',')[0]}</span>
        <span className="text-[18px] font-black text-[#2563EB] leading-tight">{parseISO(event.start_date).getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
         <p className="font-bold text-slate-900 text-[14px] truncate">{event.title}</p>
         <div className="flex items-center gap-3 mt-1 flex-wrap">
           {event.start_time && (
             <span className="flex items-center gap-1 text-[11px] text-slate-500">
               <Clock className="w-3 h-3" />{event.start_time}
             </span>
           )}
           {event.location && (
             <span className="flex items-center gap-1 text-[11px] text-slate-500">
               <MapPin className="w-3 h-3" />{event.location}
             </span>
           )}
         </div>
        <div className="flex items-center gap-1 mt-1.5">
           <Users className="w-3 h-3 text-slate-400" />
           <span className="text-[11px] text-slate-400 font-medium">View details</span>
         </div>
      </div>
    </div>
  );
}