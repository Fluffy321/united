import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { X, Calendar, Clock, MapPin, AlignLeft } from 'lucide-react';

export default function CreateCommunityEventModal({ communityId, currentUser, onCreated, onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) {
      toast.error('Title and start date are required');
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.CommunityEvent.create({
        community_id: communityId,
        title: form.title.trim(),
        description: form.description.trim(),
        start_date: form.start_date,
        start_time: form.start_time,
        end_date: form.end_date || form.start_date,
        end_time: form.end_time,
        location: form.location.trim(),
        is_official: true,
        created_by: currentUser?.id,
        created_by_name: currentUser?.full_name || currentUser?.display_name,
      });
      toast.success('Event created!');
      onCreated(created);
    } catch {
      toast.error('Failed to create event');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[17px] font-bold text-slate-900">New Event</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Event Title *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Shabbos Dinner, Annual Gala"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> Description
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Tell members what to expect…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Start Date *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Start Time
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => set('start_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-600 mb-1 block">End Date</label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={e => set('end_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-600 mb-1 block">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => set('end_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location
            </label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. 123 Main St, Woodmere"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-[15px] font-bold disabled:opacity-60 hover:bg-blue-700 transition-colors active:scale-95"
          >
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}