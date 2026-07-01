import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, X, Check, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import JewishHubBackButton from './JewishHubBackButton';
import { toast } from 'sonner';
import { createYahrzeit, deleteYahrzeit, filterYahrzeit, updateYahrzeit } from '@/services/entityServices';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Display labels only — NOT safe to use as Hebcal hm index (leap-year hm=7 is Adar II, not Nisan)
const HEBREW_MONTHS = [
  'Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar II',
  'Nisan','Iyar','Sivan','Tammuz','Av','Elul',
];

const RELATIONSHIPS = [
  'Father','Mother','Grandfather','Grandmother','Spouse','Sibling',
  'Child','Uncle','Aunt','Friend','Teacher','Other',
];

function daysInMonth(month) {
  if (!month) return 31;
  const m = Number(month);
  if ([1,3,5,7,8,10,12].includes(m)) return 31;
  if ([4,6,9,11].includes(m)) return 30;
  return 29;
}

function formatAnniversary(month, day) {
  if (!month || !day) return null;
  return `${MONTHS[Number(month) - 1]} ${day}`;
}

const EMPTY_FORM = {
  name: '', hebrew_name: '', relationship: '',
  anniversary_month: '', anniversary_day: '',
  hebrew_date_text: '', notes: '',
};

export default function YahrzeitManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: yahrzeits = [], isLoading } = useQuery({
    queryKey: ['yahrzeits', user?.id],
    queryFn: () => filterYahrzeit({ user_id: user.id }, 'name', 200),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  const save = useMutation({
    mutationFn: async (data) => {
      if (editing) {
        return updateYahrzeit(editing.id, data);
      }
      return createYahrzeit({ ...data, user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yahrzeits'] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast.success(editing ? 'Yahrzeit updated' : 'Yahrzeit added');
    },
    onError: () => toast.error('Could not save'),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteYahrzeit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yahrzeits'] });
      toast.success('Removed');
    },
    onError: () => toast.error('Could not remove'),
  });

  const openEdit = (y) => {
    setEditing(y);
    setForm({
      name: y.name || '',
      hebrew_name: y.hebrew_name || '',
      relationship: y.relationship || '',
      anniversary_month: y.anniversary_month || '',
      anniversary_day: y.anniversary_day || '',
      hebrew_date_text: y.hebrew_date_text || '',
      notes: y.notes || '',
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    save.mutate({
      name: form.name.trim(),
      hebrew_name: form.hebrew_name.trim() || null,
      relationship: form.relationship || null,
      anniversary_month: form.anniversary_month ? Number(form.anniversary_month) : null,
      anniversary_day: form.anniversary_day ? Number(form.anniversary_day) : null,
      hebrew_date_text: form.hebrew_date_text.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  // Sort: upcoming anniversary first (year-wraparound safe)
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // Returns days until next anniversary (0–365), wrapping across year boundary
  const daysUntil = (month, day) => {
    if (!month || !day) return 999;
    const now = new Date(today.getFullYear(), todayMonth - 1, todayDay);
    let next = new Date(today.getFullYear(), month - 1, day);
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return Math.round((next - now) / 86400000);
  };

  const sorted = [...yahrzeits].sort((a, b) => {
    const da = daysUntil(a.anniversary_month || 0, a.anniversary_day || 0);
    const db = daysUntil(b.anniversary_month || 0, b.anniversary_day || 0);
    return da - db;
  });

  const isUpcoming = (y) => {
    if (!y.anniversary_month || !y.anniversary_day) return false;
    const d = daysUntil(y.anniversary_month, y.anniversary_day);
    return d >= 0 && d <= 30;
  };

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <JewishHubBackButton to="/JewishHub" ariaLabel="Back to Jewish Hub" />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Memory</p>
          <h1 className="mt-0.5 text-[26px] font-black leading-tight text-slate-950">Yahrzeits</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="motion-press flex h-10 items-center gap-2 rounded-[18px] bg-slate-950 px-4 text-[13px] font-black text-white"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-black text-slate-950">{editing ? 'Edit Yahrzeit' : 'Add Yahrzeit'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Name *</label>
              <input
                className="app-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Avraham ben Yitzchak"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Hebrew name</label>
              <input
                className="app-input"
                value={form.hebrew_name}
                onChange={(e) => setForm({ ...form, hebrew_name: e.target.value })}
                placeholder="אברהם בן יצחק"
                dir="rtl"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Relationship</label>
              <select className="app-input" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                <option value="">Select…</option>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Hebrew date</label>
              <input
                className="app-input"
                value={form.hebrew_date_text}
                onChange={(e) => setForm({ ...form, hebrew_date_text: e.target.value })}
                placeholder="e.g. 15 Tishrei"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Gregorian anniversary (for reminders)</label>
              <div className="flex gap-2">
                <select className="app-input flex-1" value={form.anniversary_month} onChange={(e) => setForm({ ...form, anniversary_month: e.target.value, anniversary_day: '' })}>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select className="app-input flex-1" value={form.anniversary_day} onChange={(e) => setForm({ ...form, anniversary_day: e.target.value })}>
                  <option value="">Day</option>
                  {Array.from({ length: daysInMonth(form.anniversary_month) }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Notes</label>
              <textarea
                className="app-input min-h-[64px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="A memory, a quote, a prayer…"
              />
            </div>
            <button
              type="submit"
              disabled={save.isPending || !form.name.trim()}
              className="motion-press flex h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-slate-950 text-[14px] font-black text-white disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add yahrzeit'}
            </button>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="py-10 text-center text-[13px] text-slate-400">Loading…</div>
      )}

      {!isLoading && yahrzeits.length === 0 && !showForm && (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
          <Star className="mx-auto mb-3 h-8 w-8 text-amber-300" />
          <p className="text-[15px] font-black text-slate-900">Keep their memory</p>
          <p className="mt-1 text-[13px] text-slate-500">Add a yahrzeit to remember loved ones each year.</p>
          <button type="button" onClick={openNew} className="motion-press mt-4 inline-flex h-10 items-center gap-2 rounded-[16px] bg-slate-950 px-5 text-[13px] font-black text-white">
            <Plus className="h-3.5 w-3.5" /> Add first yahrzeit
          </button>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((y) => {
            const upcoming = isUpcoming(y);
            return (
              <div
                key={y.id}
                className={`rounded-[20px] border bg-white p-4 shadow-sm ${upcoming ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-black text-slate-950">{y.name}</span>
                      {upcoming && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                          Coming up
                        </span>
                      )}
                    </div>
                    {y.hebrew_name && (
                      <p className="mt-0.5 text-[15px] font-semibold text-slate-600" dir="rtl">{y.hebrew_name}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {y.relationship && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">{y.relationship}</span>
                      )}
                      {y.hebrew_date_text && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">{y.hebrew_date_text}</span>
                      )}
                      {y.anniversary_month && y.anniversary_day && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                          {formatAnniversary(y.anniversary_month, y.anniversary_day)}
                        </span>
                      )}
                    </div>
                    {y.notes && (
                      <p className="mt-2 text-[12px] leading-5 text-slate-500 italic">{y.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(y)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(y.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
