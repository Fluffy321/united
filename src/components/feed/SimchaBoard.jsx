import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Sparkles } from 'lucide-react';
import { createSimchaAnnouncement, filterSimchaAnnouncement } from '@/services/entityServices';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const SIMCHA_TYPES = [
  { id: 'birth',        emoji: '👶', label: 'New Baby',      color: 'from-pink-500 to-rose-500' },
  { id: 'engagement',   emoji: '💍', label: 'Engagement',    color: 'from-violet-500 to-purple-600' },
  { id: 'wedding',      emoji: '🕌', label: 'Wedding',       color: 'from-blue-500 to-indigo-600' },
  { id: 'bar_mitzvah',  emoji: '📜', label: 'Bar Mitzvah',   color: 'from-amber-500 to-orange-500' },
  { id: 'bat_mitzvah',  emoji: '✨', label: 'Bat Mitzvah',   color: 'from-teal-500 to-emerald-500' },
  { id: 'aufruf',       emoji: '🎊', label: 'Aufruf',        color: 'from-indigo-500 to-blue-600' },
  { id: 'sheva_brachos',emoji: '🥂', label: 'Sheva Brachos', color: 'from-emerald-500 to-teal-600' },
  { id: 'anniversary',  emoji: '❤️', label: 'Anniversary',   color: 'from-rose-500 to-pink-600' },
  { id: 'graduation',   emoji: '🎓', label: 'Graduation',    color: 'from-slate-600 to-slate-800' },
  { id: 'other',        emoji: '🎉', label: 'Simcha',        color: 'from-orange-500 to-amber-500' },
];

const TYPE_MAP = Object.fromEntries(SIMCHA_TYPES.map(t => [t.id, t]));

const EMPTY_FORM = {
  type: 'birth', title: '', message: '', family_name: '', date_of_event: '', location: '',
};

async function fetchSimchas() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  // Newest 20 public simchas, then drop anything older than 30 days — same
  // result set as a gte() filter since rows are sorted by created_at desc.
  const rows = await filterSimchaAnnouncement({ is_public: true }, '-created_at', 20);
  return rows.filter((r) => r.created_at >= thirtyDaysAgo);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function SimchaBoard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState(false);

  const { data: simchas = [], isLoading } = useQuery({
    queryKey: ['simcha-board'],
    queryFn: fetchSimchas,
    staleTime: 5 * 60 * 1000,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await createSimchaAnnouncement({
        ...data,
        user_id: user.id,
        is_public: true,
        date_of_event: data.date_of_event || null,
      });
    },
    onSuccess: () => {
      toast.success('Mazel Tov! 🎉 Your simcha has been shared.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ['simcha-board'] });
    },
    onError: () => toast.error('Could not post. Please try again.'),
  });

  const visible = expanded ? simchas : simchas.slice(0, 3);
  const selectedType = TYPE_MAP[form.type] || SIMCHA_TYPES[0];

  return (
    <>
      <section className="mb-3 overflow-hidden rounded-[26px] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/60">Community</p>
              </div>
              <h2 className="mt-0.5 text-[22px] font-black text-white leading-tight">🎉 Simcha Board</h2>
              <p className="mt-0.5 text-[12px] font-semibold text-white/60">
                {simchas.length > 0 ? `${simchas.length} recent simchas` : 'Share your good news with the Five Towns'}
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="motion-press mt-1 flex shrink-0 items-center gap-1.5 rounded-2xl bg-white/15 border border-white/20 px-3 py-2 text-[12px] font-black text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Share
              </button>
            )}
          </div>
        </div>

        {/* Simcha cards */}
        {isLoading ? (
          <div className="bg-white py-8 text-center text-[13px] text-slate-400">Loading simchos…</div>
        ) : simchas.length === 0 ? (
          <div className="bg-white px-4 py-8 text-center">
            <p className="text-[32px]">🎊</p>
            <p className="mt-2 text-[15px] font-black text-slate-700">No simchos yet this month</p>
            <p className="mt-1 text-[13px] text-slate-400">Be the first to share good news!</p>
            {user && (
              <button onClick={() => setShowForm(true)} className="mt-3 rounded-2xl bg-violet-600 px-4 py-2.5 text-[13px] font-black text-white">
                Share a simcha
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white">
            {visible.map(s => {
              const type = TYPE_MAP[s.type] || SIMCHA_TYPES[SIMCHA_TYPES.length - 1];
              return (
                <div key={s.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${type.color} text-[20px]`}>
                    {type.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{type.label}</span>
                        <p className="mt-1 text-[14px] font-black text-slate-950 leading-tight">{s.title}</p>
                      </div>
                      <p className="shrink-0 text-[11px] text-slate-400">{timeAgo(s.created_at)}</p>
                    </div>
                    {s.message && (
                      <p className="mt-0.5 text-[12px] font-semibold leading-snug text-slate-500">{s.message}</p>
                    )}
                    {(s.family_name || s.location) && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {[s.family_name, s.location].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {simchas.length > 3 && (
              <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full py-3 text-[13px] font-black text-violet-600 bg-violet-50 hover:bg-violet-100 transition"
              >
                {expanded ? 'Show less' : `See all ${simchas.length} simchos`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Post form overlay */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-[28px] bg-white pb-safe" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <p className="text-[16px] font-black">Share a Simcha 🎉</p>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              {/* Type picker */}
              <div>
                <label className="mb-2 block text-[12px] font-black text-slate-700">What's the occasion?</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {SIMCHA_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t.id }))}
                      className={`rounded-2xl border py-2.5 text-center transition ${
                        form.type === t.id
                          ? 'border-transparent bg-violet-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <p className="text-[20px]">{t.emoji}</p>
                      <p className="mt-0.5 text-[10px] font-black leading-tight">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {[
                { key: 'title', label: `Headline *`, placeholder: `e.g. Mazel tov to the Goldberg family on their new baby boy!` },
                { key: 'family_name', label: 'Family / couple name', placeholder: 'e.g. Cohen family, Leah and Dovid' },
                { key: 'date_of_event', label: 'Date of simcha', placeholder: '', type: 'date' },
                { key: 'location', label: 'Location', placeholder: 'e.g. Woodmere, Five Towns' },
                { key: 'message', label: 'Message (optional)', placeholder: 'Add a personal note or details…' },
              ].map(({ key, label, placeholder, type: inputType }) => (
                <div key={key}>
                  <label className="mb-1 block text-[12px] font-black text-slate-700">{label}</label>
                  {key === 'message' ? (
                    <textarea
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-violet-400 resize-none"
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      type={inputType || 'text'}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-violet-400"
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  if (!form.title.trim()) { toast.error('Please add a headline'); return; }
                  submitMutation.mutate(form);
                }}
                disabled={submitMutation.isPending}
                className="motion-press flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-[14px] font-black text-white disabled:opacity-60"
              >
                {submitMutation.isPending ? 'Posting…' : '🎉 Share the simcha!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
