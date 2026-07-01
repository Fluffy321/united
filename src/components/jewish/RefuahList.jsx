import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Check, Heart } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import JewishHubBackButton from './JewishHubBackButton';
import { toast } from 'sonner';
import { createRefuahRequest, filterRefuahRequest, updateRefuahRequest } from '@/services/entityServices';

const EMPTY_FORM = { name: '', hebrew_name: '', condition: '' };

export default function RefuahList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['refuah-requests'],
    queryFn: () => filterRefuahRequest({ is_active: true }, 'name', 300),
    staleTime: 60000,
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: (data) => createRefuahRequest({
      ...data,
      submitted_by: user?.id,
      is_active: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refuah-requests'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success('Added to the list — may they have a refuah sheleimah');
    },
    onError: () => toast.error('Could not add'),
  });

  const remove = useMutation({
    mutationFn: (id) => updateRefuahRequest(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refuah-requests'] });
      toast.success('Removed from list');
    },
    onError: () => toast.error('Could not remove'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    add.mutate({
      name: form.name.trim(),
      hebrew_name: form.hebrew_name.trim() || null,
      condition: form.condition.trim() || null,
    });
  };

  const myRequests = requests.filter((r) => r.submitted_by === user?.id);
  const othersRequests = requests.filter((r) => r.submitted_by !== user?.id);

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <JewishHubBackButton to="/JewishHub" ariaLabel="Back to Jewish Hub" />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Community</p>
          <h1 className="mt-0.5 text-[26px] font-black leading-tight text-slate-950">Refuah List</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {requests.length > 0 ? `${requests.length} people on the list` : 'Add names for refuah sheleimah'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="motion-press flex h-10 items-center gap-2 rounded-[18px] bg-rose-600 px-4 text-[13px] font-black text-white"
        >
          <Plus className="h-4 w-4" />
          Add name
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-[24px] border border-rose-100 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-black text-slate-950">Add to refuah list</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
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
                placeholder="e.g. Miriam bas Sara"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Hebrew name</label>
              <input
                className="app-input"
                value={form.hebrew_name}
                onChange={(e) => setForm({ ...form, hebrew_name: e.target.value })}
                placeholder="מרים בת שרה"
                dir="rtl"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500">Condition / context (optional)</label>
              <input
                className="app-input"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                placeholder="e.g. recovering from surgery"
              />
            </div>
            <button
              type="submit"
              disabled={add.isPending || !form.name.trim()}
              className="motion-press flex h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-rose-600 text-[14px] font-black text-white disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {add.isPending ? 'Adding…' : 'Add to list'}
            </button>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="py-10 text-center text-[13px] text-slate-400">Loading…</div>
      )}

      {!isLoading && requests.length === 0 && !showForm && (
        <div className="rounded-[24px] border border-dashed border-rose-100 bg-white px-6 py-10 text-center">
          <Heart className="mx-auto mb-3 h-8 w-8 text-rose-300" />
          <p className="text-[15px] font-black text-slate-900">No names yet</p>
          <p className="mt-1 text-[13px] text-slate-500">Add a name and the community will daven for them.</p>
          <button type="button" onClick={() => setShowForm(true)} className="motion-press mt-4 inline-flex h-10 items-center gap-2 rounded-[16px] bg-rose-600 px-5 text-[13px] font-black text-white">
            <Plus className="h-3.5 w-3.5" /> Add first name
          </button>
        </div>
      )}

      {myRequests.length > 0 && (
        <section className="mb-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Added by you</p>
          <div className="space-y-2">
            {myRequests.map((r) => (
              <RefuahCard key={r.id} req={r} canRemove onRemove={() => remove.mutate(r.id)} />
            ))}
          </div>
        </section>
      )}

      {othersRequests.length > 0 && (
        <section>
          {myRequests.length > 0 && (
            <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Community list</p>
          )}
          <div className="space-y-2">
            {othersRequests.map((r) => (
              <RefuahCard key={r.id} req={r} canRemove={false} />
            ))}
          </div>
        </section>
      )}

      {requests.length > 0 && (
        <p className="mt-6 text-center text-[12px] text-slate-400 leading-5">
          רְפָאֵנוּ ה' וְנֵרָפֵא — Heal us Hashem and we shall be healed
        </p>
      )}
    </main>
  );
}

function RefuahCard({ req, canRemove, onRemove }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] border border-rose-50 bg-white p-3.5 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50">
        <Heart className="h-4 w-4 text-rose-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-black text-slate-950">{req.name}</p>
        {req.hebrew_name && (
          <p className="text-[14px] font-semibold text-slate-600" dir="rtl">{req.hebrew_name}</p>
        )}
        {req.condition && (
          <p className="mt-0.5 text-[12px] text-slate-400">{req.condition}</p>
        )}
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
