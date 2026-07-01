import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Phone, MapPin, X, Heart } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '📋' },
  { id: 'Medical Equipment', label: 'Medical', emoji: '🏥' },
  { id: 'Baby Items', label: 'Baby', emoji: '👶' },
  { id: 'Clothing & Linens', label: 'Clothing', emoji: '👗' },
  { id: 'Books & Sefarim', label: 'Sefarim', emoji: '📚' },
  { id: 'Food & Shabbos', label: 'Food', emoji: '🍽️' },
  { id: 'Wedding Items', label: 'Wedding', emoji: '💍' },
  { id: 'Interest-Free Loans', label: 'Free Loan', emoji: '🤝' },
  { id: 'Tools & Equipment', label: 'Tools', emoji: '🔧' },
  { id: 'Hospitality & Meals', label: 'Bikur Cholim', emoji: '❤️' },
  { id: 'Other', label: 'Other', emoji: '📦' },
];

const AREAS = ['All areas', 'Cedarhurst', 'Lawrence', 'Woodmere', 'Hewlett', 'North Woodmere', 'Far Rockaway', 'Other'];

const EMPTY_FORM = {
  name: '', category: 'Medical Equipment', description: '', contact_name: '',
  phone: '', email: '', area: 'Cedarhurst', address: '', hours: '',
};

async function fetchGemachs() {
  const { data, error } = await supabase
    .from('gemachs')
    .select('*')
    .eq('is_approved', true)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data || [];
}

export default function GemachDirectory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [area, setArea] = useState('All areas');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: gemachs = [], isLoading } = useQuery({
    queryKey: ['gemachs'],
    queryFn: fetchGemachs,
    staleTime: 5 * 60 * 1000,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('gemachs').insert({
        ...data,
        submitted_by: user?.id,
        is_approved: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Gemach submitted — thank you! It will appear after review.');
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Could not submit. Please try again.'),
  });

  const filtered = gemachs.filter(g => {
    if (category !== 'all' && g.category !== category) return false;
    if (area !== 'All areas' && g.area !== area) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-[26px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <p className="text-[10px] font-black uppercase tracking-wide text-rose-600">Five Towns</p>
              </div>
              <h2 className="text-[20px] font-black text-slate-950">Gemach Directory</h2>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
                {gemachs.length} gemachs · borrow, lend, and share
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="motion-press flex shrink-0 items-center gap-1.5 rounded-2xl bg-slate-950 px-3 py-2.5 text-[12px] font-black text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            )}
          </div>

          {/* Search */}
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400"
              placeholder="Search gemachs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category pills */}
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`motion-press inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-black transition ${
                  category === cat.id
                    ? 'border-transparent bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="rounded-[24px] bg-white py-8 text-center text-[13px] text-slate-400 shadow-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] bg-white px-5 py-8 text-center shadow-sm">
          <p className="text-[15px] font-black text-slate-700">No gemachs found</p>
          <p className="mt-1 text-[13px] text-slate-400">Try a different category or search term.</p>
          {user && (
            <button onClick={() => setShowForm(true)} className="mt-3 rounded-2xl bg-slate-950 px-4 py-2.5 text-[13px] font-black text-white">
              Add one
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filtered.map(g => {
              const cat = CATEGORIES.find(c => c.id === g.category);
              return (
                <div key={g.id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[16px]">
                      {cat?.emoji || '📦'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-black text-slate-950 leading-tight">{g.name}</p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                          {g.category}
                        </span>
                      </div>
                      {g.description && (
                        <p className="mt-0.5 text-[12px] font-semibold leading-snug text-slate-500">{g.description}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {g.area && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="h-3 w-3" />{g.area}
                          </span>
                        )}
                        {g.phone && (
                          <a href={`tel:${g.phone}`} className="flex items-center gap-1 text-[11px] font-black text-blue-600">
                            <Phone className="h-3 w-3" />{g.phone}
                          </a>
                        )}
                        {g.hours && (
                          <span className="text-[11px] text-slate-400">{g.hours}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit form overlay */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/40" onClick={() => setShowForm(false)}>
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-t-[28px] bg-white pb-safe"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <p className="text-[16px] font-black text-slate-950">Add a Gemach</p>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[12px] font-semibold text-slate-500">Your submission will appear after a quick review. Thank you for helping the community!</p>

              {[
                { key: 'name', label: 'Gemach name *', placeholder: 'e.g. Woodmere Baby Gemach' },
                { key: 'contact_name', label: 'Contact name', placeholder: 'Who to call or email' },
                { key: 'phone', label: 'Phone', placeholder: '516-555-0000' },
                { key: 'email', label: 'Email', placeholder: 'optional' },
                { key: 'address', label: 'Address', placeholder: 'Street address or general area' },
                { key: 'hours', label: 'Hours / availability', placeholder: 'e.g. By appointment, Mon–Thu 9am–5pm' },
                { key: 'description', label: 'Description', placeholder: 'What does this gemach offer?' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-[12px] font-black text-slate-700">{label}</label>
                  {key === 'description' ? (
                    <textarea
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 resize-none"
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400"
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="mb-1 block text-[12px] font-black text-slate-700">Category *</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 bg-white"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-black text-slate-700">Area *</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 bg-white"
                  value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                >
                  {AREAS.filter(a => a !== 'All areas').map(a => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!form.name.trim()) { toast.error('Please enter a gemach name'); return; }
                  submitMutation.mutate(form);
                }}
                disabled={submitMutation.isPending}
                className="motion-press flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 text-[14px] font-black text-white disabled:opacity-60"
              >
                <Heart className="h-4 w-4" />
                {submitMutation.isPending ? 'Submitting…' : 'Submit Gemach'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
