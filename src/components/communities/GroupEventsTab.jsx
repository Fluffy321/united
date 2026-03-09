import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Users, ChevronDown, ChevronUp, Loader2, X, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isPast } from 'date-fns';
import { toast } from 'sonner';

export default function GroupEventsTab({ group, currentUser, isMember }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [rsvps, setRsvps] = useState({}); // eventId -> { count, userRsvpId }
  const [savingRsvp, setSavingRsvp] = useState(null);
  const [markingAttendance, setMarkingAttendance] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', start_time: '', location: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, [group.id]);

  const load = async () => {
    setLoading(true);
    const evts = await base44.entities.CommunityEvent.filter({ community_id: group.id }, 'start_date', 50);
    setEvents(evts);
    // Load RSVP counts & user status
    const rsvpMap = {};
    await Promise.all(evts.map(async (e) => {
      const all = await base44.entities.RSVP.filter({ post_id: e.id });
      const mine = all.find(r => r.user_id === currentUser?.id);
      rsvpMap[e.id] = { count: all.length, userRsvpId: mine?.id || null, attendees: all };
    }));
    setRsvps(rsvpMap);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) return toast.error('Title and date are required');
    setCreating(true);
    const evt = await base44.entities.CommunityEvent.create({
      community_id: group.id,
      title: form.title.trim(),
      description: form.description.trim(),
      start_date: form.start_date,
      start_time: form.start_time,
      location: form.location.trim(),
      is_official: false,
    });
    setEvents(prev => [evt, ...prev].sort((a, b) => a.start_date?.localeCompare(b.start_date)));
    setRsvps(prev => ({ ...prev, [evt.id]: { count: 0, userRsvpId: null, attendees: [] } }));
    setForm({ title: '', description: '', start_date: '', start_time: '', location: '' });
    setShowCreate(false);
    setCreating(false);
    toast.success('Event created!');
  };

  const toggleRsvp = async (eventId) => {
    if (!currentUser) return;
    setSavingRsvp(eventId);
    const current = rsvps[eventId] || { count: 0, userRsvpId: null, attendees: [] };
    if (current.userRsvpId) {
      await base44.entities.RSVP.delete(current.userRsvpId);
      setRsvps(prev => ({
        ...prev,
        [eventId]: { ...current, count: Math.max(0, current.count - 1), userRsvpId: null, attendees: current.attendees.filter(a => a.id !== current.userRsvpId) }
      }));
      toast.success('RSVP removed');
    } else {
      const rsvp = await base44.entities.RSVP.create({ post_id: eventId, user_id: currentUser.id, user_name: currentUser.full_name, status: 'going' });
      setRsvps(prev => ({
        ...prev,
        [eventId]: { ...current, count: current.count + 1, userRsvpId: rsvp.id, attendees: [...current.attendees, rsvp] }
      }));
      toast.success("You're going! 🎉");
    }
    setSavingRsvp(null);
  };

  const markAttended = async (eventId, rsvpId) => {
    setMarkingAttendance(rsvpId);
    await base44.entities.RSVP.update(rsvpId, { attended: true });
    setRsvps(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        attendees: prev[eventId].attendees.map(a => a.id === rsvpId ? { ...a, attended: true } : a)
      }
    }));
    setMarkingAttendance(null);
    toast.success('Attendance marked');
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
    </div>
  );

  return (
    <div className="p-4 space-y-3">
      {/* Create button */}
      {isMember && !showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#2563EB] text-[#2563EB] text-[13px] font-semibold bg-blue-50/50 active:scale-[0.99] transition-transform"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-[15px] text-slate-900">New Event</p>
            <button onClick={() => setShowCreate(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required
              placeholder="Event title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400 resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Date *</label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full px-3 py-2.5 text-[13px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full px-3 py-2.5 text-[13px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>
            <input
              placeholder="Location (optional)"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-[14px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition-all"
              style={{ background: '#2563EB' }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[14px] font-semibold text-slate-700">No events yet</p>
          <p className="text-[12px] text-slate-400 mt-1">{isMember ? 'Create the first event!' : 'Join to create events'}</p>
        </div>
      ) : (
        events.map(evt => {
          const rsvpInfo = rsvps[evt.id] || { count: 0, userRsvpId: null, attendees: [] };
          const isExpanded = expandedId === evt.id;
          const isPastEvent = evt.start_date && isPast(new Date(evt.start_date + 'T23:59:59'));
          const isRsvped = !!rsvpInfo.userRsvpId;

          return (
            <div key={evt.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* Event header */}
              <div className="p-4">
                {/* Date badge + title */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center"
                    style={{ background: isPastEvent ? '#F1F5F9' : '#EFF6FF', border: `1px solid ${isPastEvent ? '#CBD5E1' : '#BFDBFE'}` }}>
                    {evt.start_date && (() => {
                      const d = parseISO(evt.start_date);
                      return (
                        <>
                          <span className="text-[10px] font-bold uppercase" style={{ color: isPastEvent ? '#94A3B8' : '#2563EB' }}>
                            {format(d, 'MMM')}
                          </span>
                          <span className="text-[18px] font-black leading-tight" style={{ color: isPastEvent ? '#64748B' : '#1E3A8A' }}>
                            {format(d, 'd')}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-slate-900 leading-tight">{evt.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {evt.start_time && (
                        <span className="flex items-center gap-1 text-[12px] text-slate-500">
                          <Clock className="w-3 h-3" />{evt.start_time}
                        </span>
                      )}
                      {evt.location && (
                        <span className="flex items-center gap-1 text-[12px] text-slate-500">
                          <MapPin className="w-3 h-3" />{evt.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[12px] text-slate-500">
                        <Users className="w-3 h-3" />{rsvpInfo.count} going
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 mt-3.5">
                  {!isPastEvent && (
                    <button
                      onClick={() => toggleRsvp(evt.id)}
                      disabled={savingRsvp === evt.id}
                      className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                        isRsvped
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'text-white'
                      }`}
                      style={!isRsvped ? { background: '#16A34A' } : {}}
                    >
                      {savingRsvp === evt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isRsvped ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      {savingRsvp === evt.id ? 'Saving…' : isRsvped ? "Going ✓" : 'RSVP'}
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 bg-slate-50"
                  >
                    Details {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
                  {evt.description && (
                    <p className="text-[13px] text-slate-600 leading-relaxed">{evt.description}</p>
                  )}

                  {/* Attendees list */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Attendees ({rsvpInfo.count})
                    </p>
                    {rsvpInfo.attendees.length === 0 ? (
                      <p className="text-[12px] text-slate-400">No RSVPs yet</p>
                    ) : (
                      <div className="space-y-1.5">
                        {rsvpInfo.attendees.map(a => (
                          <div key={a.id} className="flex items-center justify-between py-1.5 px-2.5 bg-white rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600">
                                {a.user_name?.[0] || '?'}
                              </div>
                              <span className="text-[13px] font-medium text-slate-800">{a.user_name}</span>
                            </div>
                            {a.attended ? (
                              <span className="text-[11px] font-bold text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Attended
                              </span>
                            ) : isPastEvent ? (
                              <button
                                onClick={() => markAttended(evt.id, a.id)}
                                disabled={markingAttendance === a.id}
                                className="text-[11px] font-bold text-slate-500 px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
                              >
                                {markingAttendance === a.id ? '…' : 'Mark Attended'}
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}