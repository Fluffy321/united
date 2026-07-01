import React, { useState, useEffect } from 'react';
import { Ticket, Users, ChevronDown, ChevronUp, Loader2, ShoppingCart, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import PaymentTrustBenefits from '@/components/payments/PaymentTrustBenefits';
import { createCommunityEventRSVP, deleteCommunityEventRSVP, filterCommunityEventRSVP, updateCommunityEvent, updateCommunityEventRSVP } from '@/services/entityServices';

const RSVP_OPTIONS = [
  { value: 'going', label: 'Going', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'maybe', label: 'Maybe', activeClass: 'bg-amber-500 text-white border-amber-500' },
  { value: 'not_attending', label: 'Not going', activeClass: 'bg-slate-700 text-white border-slate-700' },
];

export default function EventTicketSection({ event, currentUser, past }) {
  const [rsvp, setRsvp] = useState(null);
  const [rsvpRecord, setRsvpRecord] = useState(null);
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, maybe: 0, not_attending: 0 });
  const [attendees, setAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const isPaidEvent = event.has_tickets && !event.is_free && event.ticket_price > 0;
  const isFreeTicketEvent = event.has_tickets && event.is_free;
  const ticketsSoldOut = event.ticket_quantity && (event.tickets_sold || 0) >= event.ticket_quantity;
  const ticketsLeft = event.ticket_quantity ? event.ticket_quantity - (event.tickets_sold || 0) : null;

  useEffect(() => {
    loadRsvpData();
  }, [event.id, currentUser?.id]);

  const loadRsvpData = async () => {
    const [allRsvps, userRsvps] = await Promise.all([
      filterCommunityEventRSVP({ event_id: event.id }),
      currentUser
        ? filterCommunityEventRSVP({ event_id: event.id, user_id: currentUser.id })
        : Promise.resolve([]),
    ]);
    setRsvpCounts({
      going: allRsvps.filter(r => r.status === 'going').length,
      maybe: allRsvps.filter(r => r.status === 'maybe').length,
      not_attending: allRsvps.filter(r => r.status === 'not_attending' || r.status === 'not_going').length,
    });
    setAttendees(allRsvps.filter(r => r.status === 'going'));
    if (userRsvps[0]) {
      setRsvp(userRsvps[0].status);
      setRsvpRecord(userRsvps[0]);
      if (isPaidEvent) setHasPurchased(userRsvps[0].ticket_purchased === true);
    }
  };

  const handleFreeRsvp = async (status) => {
    if (!currentUser) { toast.error('Sign in to RSVP'); return; }
    if (past) return;
    setLoading(true);
    try {
      if (rsvpRecord) {
        if (rsvp === status) {
          await deleteCommunityEventRSVP(rsvpRecord.id);
          setRsvp(null); setRsvpRecord(null);
        } else {
          await updateCommunityEventRSVP(rsvpRecord.id, { status });
          setRsvp(status); setRsvpRecord(r => ({ ...r, status }));
        }
      } else {
        const created = await createCommunityEventRSVP({
          event_id: event.id,
          community_id: event.community_id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name || 'Member',
          status,
        });
        setRsvp(status); setRsvpRecord(created);
      }
      await loadRsvpData();
      toast.success(
        status === 'going' ? "You're going! 🎉" :
        status === 'maybe' ? "Marked as maybe" :
        "RSVP updated"
      );
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTickets = async () => {
    if (!currentUser) { toast.error('Sign in to purchase tickets'); return; }
    if (ticketsSoldOut) { toast.error('Sorry, this event is sold out!'); return; }
    if (hasPurchased) { toast('You already have tickets for this event!'); return; }

    toast.info('Paid ticket checkout is coming soon. No money was processed.');
  };

  const handleFreeTicketRsvp = async () => {
    if (!currentUser) { toast.error('Sign in to register'); return; }
    if (ticketsSoldOut) { toast.error('Sorry, this event is full!'); return; }
    setLoading(true);
    try {
      if (!rsvpRecord) {
        const created = await createCommunityEventRSVP({
          event_id: event.id,
          community_id: event.community_id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name || 'Member',
          status: 'going',
          ticket_purchased: true,
          ticket_quantity: quantity,
        });
        setRsvp('going'); setRsvpRecord(created);
        await updateCommunityEvent(event.id, { tickets_sold: (event.tickets_sold || 0) + quantity });
        toast.success("You're registered! 🎉");
      } else {
        toast('You are already registered for this event.');
      }
      await loadRsvpData();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // --- Render: Paid ticket event ---
  if (isPaidEvent && !past) {
    return (
      <div className="mt-3 space-y-2">
        {/* Ticket info */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-[12px] font-bold text-amber-800">{event.ticket_name || 'General Admission'}</p>
              <p className="text-[11px] text-amber-600">${event.ticket_price.toFixed(2)} per ticket</p>
            </div>
          </div>
          {ticketsLeft !== null && (
            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
              ticketsLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
            }`}>
              {ticketsLeft <= 0 ? 'Sold Out' : `${ticketsLeft} left`}
            </span>
          )}
        </div>

        {hasPurchased ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-[13px] font-semibold text-green-700">You have a ticket! 🎉</p>
          </div>
        ) : ticketsSoldOut ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[13px] font-semibold text-red-600">Sold Out</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {/* Quantity selector */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-50 font-bold text-lg"
                >−</button>
                <span className="px-3 text-[14px] font-bold text-slate-800 min-w-[28px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => ticketsLeft ? Math.min(q + 1, ticketsLeft, 10) : Math.min(q + 1, 10))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-50 font-bold text-lg"
                >+</button>
              </div>
              <button
                onClick={handleBuyTickets}
                disabled
                className="flex-1 flex items-center justify-center gap-2 bg-slate-300 text-white rounded-xl py-2.5 text-[13px] font-bold cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                Paid Tickets Coming Soon
              </button>
            </div>
            <PaymentTrustBenefits showAdminRecord className="mt-2" />
          </>
        )}

        {/* Attendee count */}
        {rsvpCounts.going > 0 && (
          <button
            onClick={() => setShowAttendees(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="text-green-600 font-semibold">{rsvpCounts.going} attending</span>
            {showAttendees ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        {showAttendees && <AttendeeList attendees={attendees} />}
      </div>
    );
  }

  // --- Render: Free ticket / capacity-limited event ---
  if (isFreeTicketEvent && !past) {
    const isRegistered = rsvp === 'going';
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-600" />
            <p className="text-[12px] font-bold text-blue-800">Free · Registration Required</p>
          </div>
          {ticketsLeft !== null && (
            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
              ticketsLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
            }`}>
              {ticketsLeft <= 0 ? 'Full' : `${ticketsLeft} spots left`}
            </span>
          )}
        </div>

        {isRegistered ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-[13px] font-semibold text-green-700">You're registered! 🎉</p>
          </div>
        ) : ticketsSoldOut ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[13px] font-semibold text-red-600">Event is full</p>
          </div>
        ) : (
          <button
            onClick={handleFreeTicketRsvp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-[13px] font-bold transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
            {loading ? 'Registering…' : 'Register (Free)'}
          </button>
        )}

        {rsvpCounts.going > 0 && (
          <button
            onClick={() => setShowAttendees(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="text-green-600 font-semibold">{rsvpCounts.going} registered</span>
            {showAttendees ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        {showAttendees && <AttendeeList attendees={attendees} />}
      </div>
    );
  }

  // --- Render: Standard RSVP (no tickets) ---
  if (!past) {
    return (
      <div className="mt-3 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-black text-slate-800">Your RSVP</p>
            <p className="text-[11px] font-semibold text-slate-500">
              {rsvp === 'going' ? "You're going" : rsvp === 'maybe' ? 'You marked maybe' : rsvp ? 'You are not going' : 'Let the community know if you can make it.'}
            </p>
          </div>
          {(rsvpCounts.going > 0 || rsvpCounts.maybe > 0) && (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">{rsvpCounts.going} Going</span>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">{rsvpCounts.maybe} Maybe</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {RSVP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleFreeRsvp(opt.value)}
              disabled={loading}
              className={`flex h-9 items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-black border transition-all active:scale-95 disabled:opacity-60 ${
                rsvp === opt.value
                  ? opt.activeClass
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {loading && rsvp === opt.value ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {opt.label}
            </button>
          ))}
        </div>

        {(rsvpCounts.going > 0 || rsvpCounts.maybe > 0) && (
          <button
            onClick={() => setShowAttendees(v => !v)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            {rsvpCounts.going > 0 && <span className="text-green-600 font-semibold">{rsvpCounts.going} going</span>}
            {rsvpCounts.going > 0 && rsvpCounts.maybe > 0 && <span>·</span>}
            {rsvpCounts.maybe > 0 && <span className="text-amber-600 font-semibold">{rsvpCounts.maybe} maybe</span>}
            {showAttendees ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        {showAttendees && <AttendeeList attendees={attendees} />}
      </div>
    );
  }

  return null;
}

function AttendeeList({ attendees }) {
  if (!attendees.length) return null;
  return (
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
  );
}
