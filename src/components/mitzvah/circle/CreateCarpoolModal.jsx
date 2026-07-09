import React from 'react';
import { createPortal } from 'react-dom';
import { Car, Loader2, X } from 'lucide-react';

export default function CreateCarpoolModal({ mode, onClose, onCreate, isLoading }) {
	  const [form, setForm] = React.useState({
	    from: 'Cedarhurst',
	    to: 'Woodmere',
	    pickup: '8:00 AM',
	    seats: mode === 'offer' ? 2 : 1,
	    notes: '',
	    postToMap: true,
	  });

  React.useEffect(() => {
    setForm({
      from: 'Cedarhurst',
      to: 'Woodmere',
	      pickup: '8:00 AM',
	      seats: mode === 'offer' ? 2 : 1,
	      notes: '',
	      postToMap: true,
	    });
	  }, [mode]);

  if (!mode || typeof document === 'undefined') return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const isOffer = mode === 'offer';
  const title = isOffer ? 'Offer carpool seats' : 'Request a ride';

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/45 p-3 motion-soft-in sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(form, mode);
        }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl motion-page-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase text-sky-700">Carpool</p>
              <h2 className="text-xl font-black text-slate-950">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {[
            ['from', 'Pickup from'],
            ['to', 'Destination'],
            ['pickup', 'Pickup time'],
            ['seats', isOffer ? 'Seats available' : 'Seats needed'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">{label}</span>
              <input
                required
                type={key === 'seats' ? 'number' : 'text'}
                min={key === 'seats' ? '1' : undefined}
                value={form[key]}
                onChange={(event) => update(key, key === 'seats' ? Number(event.target.value || 1) : event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          ))}

	          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Car seats, luggage, flexibility, exact timing, or anything the rider should know"
	            />
	          </label>
	          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3 sm:col-span-2">
	            <input
	              type="checkbox"
	              checked={form.postToMap}
	              onChange={(event) => update('postToMap', event.target.checked)}
	              className="mt-0.5 h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
	            />
	            <span className="min-w-0">
	              <span className="block text-[13px] font-black text-sky-900">Add this ride to the map</span>
	              <span className="mt-0.5 block text-[12px] font-semibold leading-5 text-sky-700">
	                People nearby can discover the pickup area on the map and offer a ride faster.
	              </span>
	            </span>
	          </label>
	        </div>

        <div className="flex gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="app-button-primary h-11 flex-1 text-[13px]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isOffer ? 'Post Offer' : 'Post Ride Need')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
