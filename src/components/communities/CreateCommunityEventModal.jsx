import React, { useState } from 'react';
import { dataService } from '@/services';
import { toast } from 'sonner';
import { X, Calendar, Clock, MapPin, AlignLeft, Sparkles, Loader2, Tag, ChevronDown, Ticket, DollarSign, Users } from 'lucide-react';
import {
  FREE_COMMUNITY_LIMITS,
  canCreateCommunityEvent,
  isUpcomingPublishedCommunityEvent,
} from '@/lib/communityPlans';

const EVENT_CATEGORIES = [
  { value: 'shabbos', label: '🕯️ Shabbos & Holidays', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'learning', label: '📚 Torah & Learning', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'social', label: '🎉 Social & Networking', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'volunteer', label: '🤝 Chessed & Volunteering', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'youth', label: '🧒 Youth & Teens', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'fundraiser', label: '💛 Fundraiser', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'memorial', label: '🕍 Memorial & Tribute', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'general', label: '📌 General', color: 'bg-blue-50 text-blue-700 border-blue-200' },
];

const SUGGESTED_TIMES = [
  { label: 'Sunday Morning', start_time: '10:00', end_time: '12:00', note: 'High family attendance' },
  { label: 'Tuesday Evening', start_time: '19:30', end_time: '21:00', note: 'Weeknight sweet spot' },
  { label: 'Thursday Night', start_time: '20:00', end_time: '22:00', note: 'Popular for social events' },
  { label: 'Friday Afternoon', start_time: '14:00', end_time: '16:00', note: 'Pre-Shabbos energy' },
];

export default function CreateCommunityEventModal({
  communityId,
  community,
  currentUser,
  upcomingPublishedEventCount = 0,
  onCreated,
  onClose,
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    has_tickets: false,
    is_free: true,
    ticket_price: '',
    ticket_quantity: '',
    ticket_name: '',
  });
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [categorizingAI, setCategorizingAI] = useState(false);
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // AI Feature 1: Generate description from title
  const generateDescription = async () => {
    if (!form.title.trim()) {
      toast.error('Enter an event title first');
      return;
    }
    setGeneratingDesc(true);
    try {
      const result = await dataService.integrations.Core.InvokeLLM({
        prompt: `You are helping a Jewish community in the Five Towns, NY area create an event description.

Event title: "${form.title}"
${form.category ? `Category: ${form.category}` : ''}
${form.location ? `Location: ${form.location}` : ''}

Write a warm, engaging 2-3 sentence event description for this community event. 
Be welcoming and community-focused. Keep it concise and friendly. 
Do not make up specific times or dates. Do not use placeholder text.`,
      });
      set('description', result);
      // Also auto-categorize after generating
      if (!form.category) autoCategorize(form.title, result);
    } catch {
      toast.error('Could not generate description');
    }
    setGeneratingDesc(false);
  };

  // AI Feature 2: Auto-categorize based on title + description
  const autoCategorize = async (title, description) => {
    const text = title || form.title;
    if (!text.trim()) return;
    setCategorizingAI(true);
    try {
      const result = await dataService.integrations.Core.InvokeLLM({
        prompt: `Categorize the following community event into exactly one of these categories:
shabbos, learning, social, volunteer, youth, fundraiser, memorial, general

Event title: "${text}"
${description || form.description ? `Description: "${description || form.description}"` : ''}

Reply with ONLY the category value (one word, lowercase, from the list above).`,
      });
      const cat = result?.trim().toLowerCase().replace(/[^a-z]/g, '');
      const valid = EVENT_CATEGORIES.find(c => c.value === cat);
      if (valid) set('category', valid.value);
    } catch {}
    setCategorizingAI(false);
  };

  // AI Feature 3: Suggest optimal times based on event type
  const getAITimeSuggestions = async () => {
    if (!form.title.trim()) {
      toast.error('Enter an event title first');
      return;
    }
    setLoadingAISuggestions(true);
    setShowTimeSuggestions(true);
    try {
      const result = await dataService.integrations.Core.InvokeLLM({
        prompt: `You are helping schedule a Jewish community event in the Five Towns, NY area.

Event: "${form.title}"
${form.category ? `Category: ${form.category}` : ''}
${form.description ? `Description: "${form.description}"` : ''}

Suggest 3 optimal time slots for this event based on Jewish community patterns (avoid Shabbos/Yom Tov, consider typical community schedules, minyan times, school hours, etc.).

Return a JSON object with a "suggestions" array of exactly 3 items, each with:
- "label": short name (e.g. "Sunday Morning")
- "day_of_week": full day name
- "start_time": HH:MM (24h)  
- "end_time": HH:MM (24h)
- "reason": one sentence why this time works for this event type`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  day_of_week: { type: 'string' },
                  start_time: { type: 'string' },
                  end_time: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
      });
      setAiSuggestions(result?.suggestions || SUGGESTED_TIMES);
    } catch {
      setAiSuggestions(SUGGESTED_TIMES);
    }
    setLoadingAISuggestions(false);
  };

  const applyTimeSuggestion = (s) => {
    set('start_time', s.start_time);
    set('end_time', s.end_time);
    setShowTimeSuggestions(false);
    toast.success(`Applied: ${s.label}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) {
      toast.error('Title and start date are required');
      return;
    }
    const wouldCountTowardFreeLimit = isUpcomingPublishedCommunityEvent({
      status: 'published',
      start_date: form.start_date,
      start_time: form.start_time,
    });
    if (wouldCountTowardFreeLimit && !canCreateCommunityEvent(community, upcomingPublishedEventCount)) {
      toast.error(`Free communities can have up to ${FREE_COMMUNITY_LIMITS.upcomingPublishedEvents} upcoming events. Upgrade to Premium for unlimited events.`);
      return;
    }
    setSaving(true);
    try {
      const created = await dataService.entities.CommunityEvent.create({
        community_id: communityId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || 'general',
        start_date: form.start_date,
        start_time: form.start_time,
        end_date: form.end_date || form.start_date,
        end_time: form.end_time,
        location: form.location.trim(),
        is_official: true,
        created_by: currentUser?.id,
        created_by_name: currentUser?.full_name || currentUser?.display_name,
        has_tickets: form.has_tickets,
        is_free: form.is_free,
        ticket_price: form.has_tickets && !form.is_free ? parseFloat(form.ticket_price) || 0 : 0,
        ticket_quantity: form.has_tickets && form.ticket_quantity ? parseInt(form.ticket_quantity) : null,
        ticket_name: form.has_tickets ? (form.ticket_name.trim() || 'General Admission') : '',
        tickets_sold: 0,
      });
      toast.success('Event created!');
      onCreated(created);
    } catch {
      toast.error('Failed to create event');
    }
    setSaving(false);
  };

  const selectedCategory = EVENT_CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[17px] font-bold text-slate-900">New Event</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Title */}
          <div>
            <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Event Title *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              onBlur={() => { if (form.title.trim() && !form.category) autoCategorize(form.title, form.description); }}
              placeholder="e.g. Shabbos Dinner, Annual Gala"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Description with AI generate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5" /> Description
              </label>
              <button
                type="button"
                onClick={generateDescription}
                disabled
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                AI Coming Soon
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Tell members what to expect…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Category with AI auto-detect */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Category
              </label>
              {categorizingAI && (
                <span className="flex items-center gap-1 text-[11px] text-violet-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Auto-detecting…
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryPicker(v => !v)}
              className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all ${
                selectedCategory
                  ? `${selectedCategory.color} border font-medium`
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <span>{selectedCategory ? selectedCategory.label : 'Select category…'}</span>
              <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
            {showCategoryPicker && (
              <div className="mt-1.5 rounded-2xl border border-slate-100 bg-white shadow-lg overflow-hidden">
                {EVENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => { set('category', cat.value); setShowCategoryPicker(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] font-medium hover:bg-slate-50 transition-colors ${
                      form.category === cat.value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time row with AI suggest */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Date & Time
              </label>
              <button
                type="button"
                onClick={getAITimeSuggestions}
                disabled
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                AI Times Coming Soon
              </button>
            </div>
            <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
              AI event-writing tools are not connected yet.
            </p>

            {/* AI Time Suggestions Panel */}
            {showTimeSuggestions && (
              <div className="mb-3 rounded-2xl bg-blue-50 border border-blue-100 p-3">
                <p className="text-[11px] font-bold text-blue-700 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Optimal time suggestions for your community
                </p>
                {loadingAISuggestions ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-[12px] text-blue-600">Analyzing community patterns…</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(aiSuggestions || []).map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyTimeSuggestion(s)}
                        className="w-full text-left bg-white rounded-xl px-3 py-2.5 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all active:scale-98"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-slate-800">{s.label || s.day_of_week}</span>
                          <span className="text-[11px] font-semibold text-blue-600">
                            {s.start_time} – {s.end_time}
                          </span>
                        </div>
                        {s.reason && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{s.reason || s.note}</p>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTimeSuggestions(false)}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 pt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Start Date *</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => set('start_date', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Start Time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => set('start_time', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={e => set('end_date', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">End Time</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => set('end_time', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-blue-400"
                />
              </div>
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

          {/* Ticketing */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => set('has_tickets', !form.has_tickets)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-slate-600" />
                <span className="text-[13px] font-semibold text-slate-700">Ticketing / Registration</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${form.has_tickets ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.has_tickets ? 'left-5' : 'left-0.5'}`} />
              </div>
            </button>

            {form.has_tickets && (
              <div className="p-4 space-y-3">
                {/* Free vs Paid toggle */}
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  <button
                    type="button"
                    onClick={() => set('is_free', true)}
                    className={`flex-1 py-2 text-[12px] font-bold transition-colors ${form.is_free ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}
                  >
                    Free Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => set('is_free', false)}
                    className={`flex-1 py-2 text-[12px] font-bold transition-colors ${!form.is_free ? 'bg-amber-500 text-white' : 'bg-white text-slate-500'}`}
                  >
                    Paid Tickets
                  </button>
                </div>

                {/* Ticket name */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Ticket Name</label>
                  <input
                    value={form.ticket_name}
                    onChange={e => set('ticket_name', e.target.value)}
                    placeholder="General Admission"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400"
                  />
                </div>

                {/* Price (only for paid) */}
                {!form.is_free && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Price per ticket (USD)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.ticket_price}
                      onChange={e => set('ticket_price', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400"
                    />
                  </div>
                )}

                {/* Capacity */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Max Capacity (leave blank for unlimited)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.ticket_quantity}
                    onChange={e => set('ticket_quantity', e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}
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
