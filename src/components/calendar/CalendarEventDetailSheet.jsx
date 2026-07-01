import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Calendar, Loader2, ChevronLeft, Share2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { createCommunityEventRSVP, deleteCommunityEventRSVP, filterCommunityEventRSVP, updateCommunityEventRSVP } from '@/services/entityServices';

const EVENT_CATEGORY_META = {
  shiur:        { label: 'Shiur / Class',      emoji: '📖', color: 'bg-indigo-100 text-indigo-700' },
  shul_event:   { label: 'Shul Event',          emoji: '🕍', color: 'bg-blue-100 text-blue-700'   },
  chesed:       { label: 'Chesed',              emoji: '🤝', color: 'bg-rose-100 text-rose-700'    },
  youth:        { label: 'Youth / Kids',        emoji: '🎒', color: 'bg-amber-100 text-amber-700'  },
  business:     { label: 'Business / Network',  emoji: '💼', color: 'bg-slate-100 text-slate-700'  },
  shabbos_meal: { label: 'Shabbos Meal',        emoji: '🕯️', color: 'bg-yellow-100 text-yellow-700'},
  fundraiser:   { label: 'Fundraiser',          emoji: '💛', color: 'bg-orange-100 text-orange-700'},
  memorial:     { label: 'Memorial / Yahrzeit', emoji: '🕯️', color: 'bg-slate-100 text-slate-600'  },
  general:      { label: 'Event',               emoji: '📅', color: 'bg-slate-100 text-slate-700'  },
};

const RSVP_OPTS = [
  { value: 'going',         label: 'Going',    emoji: '✅', active: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'maybe',         label: 'Maybe',    emoji: '🤔', active: 'bg-amber-500 text-white border-amber-500'    },
  { value: 'not_attending', label: 'Not going', emoji: '❌', active: 'bg-slate-600 text-white border-slate-600'   },
];

export default function CalendarEventDetailSheet({ event, open, onOpenChange, onBack }) {
  const { user: currentUser } = useAuth();
  const [rsvp, setRsvp]       = useState(null);   // 'going' | 'maybe' | 'not_attending'
  const [rsvpId, setRsvpId]   = useState(null);
  const [counts, setCounts]   = useState({ going: 0, maybe: 0 });
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    setLoading(true);
    Promise.all([
      filterCommunityEventRSVP({ event_id: event.id }),
      currentUser?.id
        ? filterCommunityEventRSVP({ event_id: event.id, user_id: currentUser.id })
        : Promise.resolve([]),
    ]).then(([all, mine]) => {
      setCounts({
        going: all.filter(r => r.status === 'going').length,
        maybe: all.filter(r => r.status === 'maybe').length,
      });
      setAttendees(all.filter(r => r.status === 'going').slice(0, 10));
      if (mine[0]) {
        setRsvp(mine[0].status === 'not_going' ? 'not_attending' : mine[0].status);
        setRsvpId(mine[0].id);
      } else {
        setRsvp(null);
        setRsvpId(null);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open, event?.id, currentUser?.id]);

  const handleRsvp = async (status) => {
    if (!currentUser) return toast.error('Sign in to RSVP');
    setSaving(true);
    try {
      if (rsvpId) {
        if (rsvp === status) {
          // Toggle off
          await deleteCommunityEventRSVP(rsvpId);
          setRsvp(null); setRsvpId(null);
          if (status === 'going') setCounts(c => ({ ...c, going: Math.max(0, c.going - 1) }));
          if (status === 'maybe') setCounts(c => ({ ...c, maybe: Math.max(0, c.maybe - 1) }));
          toast.success('RSVP removed');
        } else {
          await updateCommunityEventRSVP(rsvpId, { status });
          const prev = rsvp;
          setRsvp(status);
          setCounts(c => ({
            going: c.going + (status === 'going' ? 1 : 0) - (prev === 'going' ? 1 : 0),
            maybe: c.maybe + (status === 'maybe' ? 1 : 0) - (prev === 'maybe' ? 1 : 0),
          }));
          toast.success(status === 'going' ? "You're going! 🎉" : 'Updated');
        }
      } else {
        const record = await createCommunityEventRSVP({
          event_id:   event.id,
          user_id:    currentUser.id,
          user_name:  currentUser.full_name || currentUser.email,
          status,
          community_id: event.community_id,
        });
        setRsvp(status);
        setRsvpId(record.id);
        if (status === 'going') {
          setCounts(c => ({ ...c, going: c.going + 1 }));
          setAttendees(prev => [...prev, { id: record.id, user_name: currentUser.full_name || 'You', status: 'going' }]);
          toast.success("You're going! 🎉");
        } else if (status === 'maybe') {
          setCounts(c => ({ ...c, maybe: c.maybe + 1 }));
          toast.success("Marked as maybe");
        } else {
          toast.success("Got it");
        }
      }
    } catch { toast.error('Could not update RSVP'); }
    finally { setSaving(false); }
  };

  if (!event) return null;

  const dateStr  = event.start_date || event.event_date;
  const timeStr  = event.start_time || event.event_time;
  const endTime  = event.end_time;
  const location = event.location_text || event.location;
  const meta     = EVENT_CATEGORY_META[event.category] || EVENT_CATEGORY_META.general;

  const dateFormatted = dateStr
    ? format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')
    : null;

  const timeFormatted = timeStr
    ? (endTime ? `${timeStr} – ${endTime}` : timeStr)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { onOpenChange(false); onBack?.(); }}
              className="flex items-center gap-1 text-[13px] font-semibold text-blue-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Calendar
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: event.title, text: `${event.title} — ${dateFormatted}`, url: window.location.href });
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success('Link copied');
                  }
                }}
                className="rounded-full p-1.5 bg-slate-100 active:bg-slate-200"
              >
                <Share2 className="h-4 w-4 text-slate-600" />
              </button>
              <button onClick={() => onOpenChange(false)} className="rounded-full p-1.5 bg-slate-100 active:bg-slate-200">
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5 pb-12">
          {/* Category badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${meta.color}`}>
            <span>{meta.emoji}</span>
            {meta.label}
          </span>

          {/* Title */}
          <h2 className="text-[22px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
            {event.title}
          </h2>

          {/* Date / Time / Location */}
          <div className="space-y-2">
            {dateFormatted && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-[14px] font-semibold text-slate-800">{dateFormatted}</span>
              </div>
            )}
            {timeFormatted && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <Clock className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-[14px] font-semibold text-slate-800">{timeFormatted}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <MapPin className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-[14px] font-semibold text-slate-800">{location}</span>
              </div>
            )}
          </div>

          {/* RSVP */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">
              {counts.going > 0 ? `${counts.going} going${counts.maybe > 0 ? ` · ${counts.maybe} maybe` : ''}` : 'Will you join?'}
            </p>
            <div className="flex gap-2">
              {RSVP_OPTS.map(opt => (
                <button
                  key={opt.value}
                  disabled={saving || loading}
                  onClick={() => handleRsvp(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-2xl border py-3 text-[12px] font-bold transition-all active:scale-[0.97] ${
                    rsvp === opt.value ? opt.active : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {saving && rsvp !== opt.value && opt.value === 'going' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-base">{opt.emoji}</span>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Attendee avatars */}
            {attendees.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {attendees.slice(0, 5).map((a, i) => (
                    <div key={a.id || i} className="h-6 w-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{(a.user_name || '?')[0].toUpperCase()}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-slate-500">
                  {attendees.slice(0, 3).map(a => a.user_name?.split(' ')[0]).filter(Boolean).join(', ')}
                  {attendees.length > 3 ? ` +${attendees.length - 3} more` : ''} going
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-2">About</p>
              <p className="text-[14px] leading-relaxed text-slate-700">{event.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
