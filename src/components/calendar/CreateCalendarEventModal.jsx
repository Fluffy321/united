import React, { useState, useEffect } from 'react';
import { Loader2, X, CalendarDays, Clock, MapPin, Users, Tag, Globe, Lock, ChevronDown } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createCommunityEvent } from '@/services/entityServices';

const EVENT_CATEGORIES = [
  { id: 'shiur',        label: 'Shiur / Class',      emoji: '📖' },
  { id: 'shul_event',   label: 'Shul Event',          emoji: '🕍' },
  { id: 'chesed',       label: 'Chesed',              emoji: '🤝' },
  { id: 'youth',        label: 'Youth / Kids',        emoji: '🎒' },
  { id: 'business',     label: 'Business / Network',  emoji: '💼' },
  { id: 'shabbos_meal', label: 'Shabbos Meal',        emoji: '🕯️' },
  { id: 'fundraiser',   label: 'Fundraiser',          emoji: '💛' },
  { id: 'memorial',     label: 'Memorial / Yahrzeit', emoji: '🕯️' },
  { id: 'general',      label: 'General',             emoji: '📅' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Public',    desc: 'Anyone on JUnited', Icon: Globe },
  { value: 'community', label: 'Community', desc: 'Members only',      Icon: Users },
  { value: 'private',   label: 'Private',   desc: 'Only you',          Icon: Lock  },
];

export default function CreateCalendarEventModal({ open, onOpenChange, initialDate, onCreated }) {
  const { user: currentUser } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [form, setForm] = useState({
    title: '',
    category: 'general',
    start_date: initialDate || '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    community_id: '',
    visibility: 'public',
  });
  const [saving, setSaving] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  // Reset form when opening with a new date
  useEffect(() => {
    if (open) {
      setForm(f => ({ ...f, start_date: initialDate || f.start_date }));
    }
  }, [open, initialDate]);

  // Load user's communities
  useEffect(() => {
    if (!open || !currentUser?.id || !supabase) return;
    supabase
      .from('community_memberships')
      .select('community_id, communities(id, name)')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .then(({ data }) => {
        if (data) setCommunities(data.map(m => m.communities).filter(Boolean));
      });
  }, [open, currentUser?.id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const selectedCat = EVENT_CATEGORIES.find(c => c.id === form.category) || EVENT_CATEGORIES[8];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.start_date)   return toast.error('Date is required');

    // community_id is required by DB; use user's first community or the selected one
    const communityId = form.community_id || communities[0]?.id;
    if (!communityId) {
      return toast.error('You must be a member of at least one community to create events');
    }

    setSaving(true);
    try {
      const event = await createCommunityEvent({
        title:        form.title.trim(),
        description:  form.description.trim() || null,
        start_date:   form.start_date,
        event_date:   form.start_date,
        start_time:   form.start_time || null,
        event_time:   form.start_time || null,
        end_time:     form.end_time || null,
        location:     form.location.trim() || null,
        location_text: form.location.trim() || null,
        category:     form.category,
        visibility:   form.visibility,
        community_id: communityId,
        created_by:   currentUser.id,
        created_by_name: currentUser.full_name || currentUser.email,
        status:       'published',
        is_official:  false,
      });
      toast.success('Event created! 🎉');
      onCreated?.(event);
      onOpenChange(false);
      // Reset
      setForm({ title: '', category: 'general', start_date: '', start_time: '', end_time: '', location: '', description: '', community_id: '', visibility: 'public' });
    } catch (err) {
      console.error(err);
      toast.error('Could not create event. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92dvh] overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-white px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-[18px] font-black text-slate-950">New Event</SheetTitle>
            <button onClick={() => onOpenChange(false)} className="rounded-full p-1.5 bg-slate-100 active:bg-slate-200">
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 pb-10">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Event Title *</label>
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Shiur with Rabbi Cohen"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Event Type</label>
            <button
              type="button"
              onClick={() => setShowCatPicker(p => !p)}
              className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 active:bg-slate-100"
            >
              <span className="flex items-center gap-2 text-[14px] font-bold text-slate-900">
                <span>{selectedCat.emoji}</span>
                <span>{selectedCat.label}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showCatPicker ? 'rotate-180' : ''}`} />
            </button>
            {showCatPicker && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {EVENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { set('category', cat.id); setShowCatPicker(false); }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-bold text-left transition-colors ${
                      form.category === cat.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700 active:bg-slate-100'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span className="leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">
                <CalendarDays className="inline h-3 w-3 mr-1" />Date *
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">
                <Clock className="inline h-3 w-3 mr-1" />Start Time
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => set('start_time', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* End time */}
          <div className="grid grid-cols-2 gap-3">
            <div />
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => set('end_time', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">
              <MapPin className="inline h-3 w-3 mr-1" />Location
            </label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Address or venue name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Details</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What should people know about this event?"
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Community */}
          {communities.length > 0 && (
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">
                <Users className="inline h-3 w-3 mr-1" />Post to Community
              </label>
              <select
                value={form.community_id}
                onChange={e => set('community_id', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-blue-400 transition-colors"
              >
                <option value="">{communities[0]?.name || 'Select community'}</option>
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">
              <Tag className="inline h-3 w-3 mr-1" />Visibility
            </label>
            <div className="flex gap-2">
              {VISIBILITY_OPTIONS.map(({ value, label, desc, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('visibility', value)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-2xl border py-3 px-1 transition-colors ${
                    form.visibility === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-bold">{label}</span>
                  <span className="text-[9px] text-center leading-tight opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-[15px] font-black text-white active:bg-slate-800 disabled:opacity-50 transition-colors mt-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
