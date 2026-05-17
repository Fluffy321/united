import React, { useMemo, useState } from 'react';
import { CalendarDays, Car, CheckCircle2, Clock, MapPin, MessageCircle, Plus, Route, ShieldCheck, Users } from 'lucide-react';

const CARPOOL_STEPS = [
  'Confirm driver and rider names',
  'Set pickup window',
  'Share exact address privately',
  'Confirm seats, car seats, and bags',
  'Send done / arrived update'
];

const isRideOffer = (ride) => {
  const text = `${ride.title || ''} ${ride.description || ''}`.toLowerCase();
  return ride.direction === 'offering' || /offer|available|seat|seats|driving|can take/.test(text);
};

export default function CarpoolBoard({ rideRequests = [], signupsByRequest = {}, onCreateRide, onSelectRide, onClaimRide, isClaiming }) {
  const [checkedSteps, setCheckedSteps] = useState(() => new Set(['Confirm driver and rider names']));
  const [planner, setPlanner] = useState({
    from: 'Cedarhurst',
    to: 'School / shul',
    pickup: '8:00 AM',
    seats: '2'
  });

  const rides = rideRequests;
  const offeredCount = useMemo(() => rides.filter(isRideOffer).length, [rides]);
  const neededCount = rides.length - offeredCount;

  const toggleStep = (step) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const plannerSummary = `${planner.from || 'Pickup'} to ${planner.to || 'destination'} at ${planner.pickup || 'time TBD'} · ${planner.seats || 1} seat${planner.seats === '1' ? '' : 's'}`;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[24px] border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-white shadow-sm">
        <div className="relative p-4">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-100/60 blur-2xl" />
          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                  <Car className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-black text-slate-950">Carpool chesed</p>
                  <p className="text-[12px] font-semibold leading-5 text-slate-500">Offer rides, request pickups, and coordinate the handoff.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                <p className="text-[16px] font-black text-slate-950">{rides.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">rides</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onCreateRide('need')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 py-3 text-[13px] font-black text-white active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Need a ride
              </button>
              <button
                onClick={() => onCreateRide('offer')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3 text-[13px] font-black text-sky-700 active:scale-[0.98]"
              >
                <Users className="h-4 w-4" />
                Offer seats
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[15px] font-black text-slate-950">{offeredCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">offering</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[15px] font-black text-slate-950">{neededCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">needed</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3">
                <p className="text-[15px] font-black text-emerald-700">{checkedSteps.size}/{CARPOOL_STEPS.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">planned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-black text-slate-950">Open rides</h2>
            <p className="text-[12px] font-medium text-slate-500">Real ride requests from Mitzvah Circle.</p>
          </div>
          <Route className="h-5 w-5 text-sky-600" />
        </div>

        {rides.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Car className="h-5 w-5" />
            </div>
            <p className="text-[14px] font-black text-slate-950">No open rides right now</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">
              Post a ride need or offer seats, and it will appear here for coordination.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => onCreateRide('need')}
                className="rounded-2xl bg-slate-950 px-3 py-2.5 text-[12px] font-black text-white active:scale-[0.98]"
              >
                Need a ride
              </button>
              <button
                onClick={() => onCreateRide('offer')}
                className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-[12px] font-black text-sky-700 active:scale-[0.98]"
              >
                Offer seats
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-2.5">
          {rides.map((ride) => {
            const helpers = signupsByRequest[ride.id] || [];
            const offering = isRideOffer(ride);

            return (
              <div
                key={ride.id}
                className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm active:scale-[0.99]"
                onClick={() => onSelectRide(ride)}
              >
                <div className="mb-2 flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${offering ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-black text-slate-950">{ride.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${offering ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                        {offering ? 'Offering' : 'Needed'}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-5 text-slate-500">{ride.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
                  <span className="flex min-w-0 items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{ride.locationLabel || 'Five Towns'}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{ride.pickup_window || 'Coordinate time'}</span>
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-slate-400">
                    {helpers.length > 0 ? `${helpers.length} helping coordinate` : 'Share exact address only in chat'}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onClaimRide(e, ride); }}
                    disabled={isClaiming}
                    className="rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white active:scale-95 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Coordinate
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-black text-slate-950">Pickup planner</h2>
            <p className="text-[12px] font-medium text-slate-500">Draft the route before you post or message.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-slate-500" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            ['from', 'From'],
            ['to', 'To'],
            ['pickup', 'Pickup'],
            ['seats', 'Seats']
          ].map(([key, label]) => (
            <label key={key} className="rounded-2xl bg-slate-50 px-3 py-2">
              <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</span>
              <input
                value={planner[key]}
                onChange={(e) => setPlanner(prev => ({ ...prev, [key]: e.target.value }))}
                className="mt-1 w-full bg-transparent text-[13px] font-bold text-slate-900 outline-none"
              />
            </label>
          ))}
        </div>

        <div className="mt-3 rounded-2xl bg-sky-50 px-3 py-2">
          <p className="text-[12px] font-bold text-sky-800">{plannerSummary}</p>
        </div>
      </div>

      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <h2 className="text-[15px] font-black text-slate-950">Ride coordination checklist</h2>
        </div>
        <div className="space-y-2">
          {CARPOOL_STEPS.map(step => {
            const checked = checkedSteps.has(step);
            return (
              <button
                key={step}
                onClick={() => toggleStep(step)}
                className="flex w-full items-center gap-2 rounded-2xl bg-white px-3 py-2 text-left active:scale-[0.99]"
              >
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${checked ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={`text-[12px] font-bold ${checked ? 'text-slate-900' : 'text-slate-500'}`}>{step}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
