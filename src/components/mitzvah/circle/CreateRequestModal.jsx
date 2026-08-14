import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import { CATEGORIES } from './shared';

export default function CreateRequestModal({ open, onClose, onCreate, isLoading, initialValues = null, direction = 'need' }) {
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: 'Other',
    neighborhood: 'Five Towns',
    estimatedHours: 1,
    urgency: 'Today',
    postToMap: true,
  });

  React.useEffect(() => {
    if (!open) return;
    setForm({
      title: '',
      description: '',
      category: initialValues?.category || 'Other',
      neighborhood: 'Five Towns',
      estimatedHours: 1,
      urgency: initialValues?.urgency || 'Today',
      postToMap: true,
    });
  }, [open, initialValues]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    onCreate(form);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-2 motion-soft-in sm:p-3"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl motion-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[11px] font-black uppercase text-blue-600">
              {direction === 'offer' ? 'Public help offer' : 'New help request'}
            </p>
            <h2 className="text-lg font-black text-slate-950">
              {direction === 'offer' ? 'What can you help with?' : 'What is needed?'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="motion-stagger flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-bold text-slate-700">Title</span>
            <input
              autoFocus
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={direction === 'offer' ? 'Example: Available for grocery runs' : 'Example: Pick up groceries'}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-bold text-slate-700">Details</span>
            <textarea
              required
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={direction === 'offer' ? 'What can people ask you for?' : 'What should helpers know?'}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[12px] font-bold text-slate-700">Category</span>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-bold text-slate-700">Area</span>
              <input
                value={form.neighborhood}
                onChange={(e) => update('neighborhood', e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[12px] font-bold text-slate-700">Hours</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={(e) => update('estimatedHours', parseFloat(e.target.value))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </label>
            <div className="block">
              <span className="mb-1 block text-[12px] font-bold text-slate-700">When</span>
              <div className="grid h-10 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {[
                  ['Urgent', 'border-red-500 bg-red-600 text-white', 'border-red-200 bg-red-50 text-red-700'],
                  ['Today', 'border-orange-500 bg-orange-500 text-white', 'border-orange-200 bg-orange-50 text-orange-700'],
                  ['Flexible', 'border-slate-500 bg-slate-700 text-white', 'border-slate-200 bg-slate-100 text-slate-600'],
                ].map(([level, activeClass, idleClass]) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update('urgency', level)}
                    className={`motion-press rounded-lg border text-[11px] font-black transition ${
                      form.urgency === level ? activeClass : idleClass
                    }`}
                    aria-pressed={form.urgency === level}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-black text-slate-800">
              {form.urgency === 'Urgent'
                ? 'ASAP. Shows red.'
                : form.urgency === 'Today'
                  ? 'Needed today. Shows orange.'
                  : 'Flexible timing. Shows gray.'}
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.postToMap}
              onChange={(e) => update('postToMap', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="min-w-0">
              <span className="block text-[12px] font-black text-blue-900">Show on map</span>
              <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-blue-700">
                Nearby people can find it faster.
              </span>
            </span>
          </label>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-[12px] font-black text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="app-button-primary h-10 flex-1 text-[12px]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : direction === 'offer' ? 'Post offer' : 'Post need'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
