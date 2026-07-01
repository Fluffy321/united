import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, CheckCircle2, Flame, Heart, Plus, Sparkles } from 'lucide-react';
import { format, isToday, parseISO, subDays } from 'date-fns';
import { toast } from 'sonner';
import { createMitzvahLog, createMitzvahPoints, createUserStreak, filterMitzvahLog, filterMitzvahPoints, filterUserStreak, updateMitzvahPoints, updateUserStreak } from '@/services/entityServices';

const DAILY_GOAL = 2;

const CATEGORIES = [
  'Chesed',
  'Tzedakah',
  'Torah / Learning',
  'Prayer',
  'Shabbat Prep',
  'Honoring Parents',
  'Kindness',
  'Community',
  'Other',
];

const REFLECTION_PROMPTS = [
  'How did this mitzvah make you feel?',
  'How did this affect you or someone else?',
  'What did you notice about yourself after doing it?',
  'What feeling do you want to carry from this mitzvah?',
];

function dateKey(date = new Date()) {
  return format(date, 'yyyy-MM-dd');
}

function badgeFor(streak) {
  if (streak >= 30) return 'elite';
  if (streak >= 14) return 'gold';
  if (streak >= 7) return 'silver';
  if (streak >= 2) return 'basic';
  return 'starter';
}

async function upsertStreak({ currentUser, completedToday }) {
  if (!completedToday) return null;
  const today = dateKey();
  const yesterday = dateKey(subDays(new Date(), 1));
  const existing = await filterUserStreak({ user_id: currentUser.id });
  const current = existing[0];

  if (current?.last_activity_date === today) return current;

  const nextCurrent = current?.last_activity_date === yesterday
    ? (current.current_streak || 0) + 1
    : 1;

  const patch = {
    user_id: currentUser.id,
    current_streak: nextCurrent,
    best_streak: Math.max(current?.best_streak || 0, nextCurrent),
    last_activity_date: today,
    badge_level: badgeFor(nextCurrent),
  };

  if (current?.id) return updateUserStreak(current.id, patch);
  return createUserStreak(patch);
}

async function addMitzvahPoints(currentUser, pointsToAdd) {
  const existing = await filterMitzvahPoints({ user_id: currentUser.id });
  const current = existing[0];
  const patch = {
    user_id: currentUser.id,
    user_name: currentUser.display_name || currentUser.full_name || 'Community member',
    total_points: (current?.total_points || 0) + pointsToAdd,
  };
  if (current?.id) return updateMitzvahPoints(current.id, patch);
  return createMitzvahPoints(patch);
}

export default function DailyMitzvahTracker({ currentUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chesed');
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const prompt = REFLECTION_PROMPTS[new Date().getDate() % REFLECTION_PROMPTS.length];

  const { data: logs = [] } = useQuery({
    queryKey: ['daily-mitzvah-tracker-logs', currentUser?.id],
    queryFn: () => filterMitzvahLog({ user_id: currentUser.id }, '-date', 100),
    enabled: Boolean(currentUser?.id),
    staleTime: 60000,
  });

  const { data: streak = null } = useQuery({
    queryKey: ['daily-mitzvah-tracker-streak', currentUser?.id],
    queryFn: async () => {
      const rows = await filterUserStreak({ user_id: currentUser.id });
      return rows[0] || null;
    },
    enabled: Boolean(currentUser?.id),
    staleTime: 60000,
  });

  const todayLogs = useMemo(() => (
    logs.filter((log) => {
      const value = log.date || log.created_date || log.created_at;
      if (!value) return false;
      return value.length === 10 ? value === dateKey() : isToday(parseISO(value));
    })
  ), [logs]);

  const todayCount = todayLogs.length;
  const progress = Math.min(100, (todayCount / DAILY_GOAL) * 100);
  const complete = todayCount >= DAILY_GOAL;
  const remaining = Math.max(0, DAILY_GOAL - todayCount);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !currentUser?.id) return;
    setSaving(true);
    try {
      const beforeCount = todayCount;
      await createMitzvahLog({
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name || 'Community member',
        date: dateKey(),
        category,
        description: title.trim(),
        reflection: reflection.trim(),
        hours_completed: 0,
      });

      const reachedGoal = beforeCount < DAILY_GOAL && beforeCount + 1 >= DAILY_GOAL;
      await Promise.all([
        upsertStreak({ currentUser, completedToday: reachedGoal }),
        addMitzvahPoints(currentUser, reachedGoal ? 20 : 10),
      ]);

      queryClient.invalidateQueries({ queryKey: ['daily-mitzvah-tracker-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-mitzvah-tracker-streak'] });
      queryClient.invalidateQueries({ queryKey: ['mitzvah-logs'] });
      queryClient.invalidateQueries({ queryKey: ['user-streak'] });
      queryClient.invalidateQueries({ queryKey: ['mitzvah-points'] });

      toast.success(reachedGoal ? 'Daily goal complete. Your streak is alive.' : 'Mitzvah logged.');
      setTitle('');
      setReflection('');
      setCategory('Chesed');
      setShowForm(false);
    } catch {
      toast.error('Could not log mitzvah yet.');
    }
    setSaving(false);
  };

  return (
    <section className="app-card overflow-hidden">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-amber-800 p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Daily mitzvah tracker
            </p>
            <h2 className="mt-1 text-xl font-black">Do 2 mitzvot today</h2>
            <p className="mt-1 max-w-lg text-[13px] font-medium leading-5 text-white/75">
              Log what you did, reflect on how it felt, and build a streak that makes doing good feel visible.
            </p>
          </div>
          <div className="rounded-2xl bg-white/12 px-3 py-2 text-center backdrop-blur">
            <p className="text-2xl font-black">{Math.min(todayCount, DAILY_GOAL)}/{DAILY_GOAL}</p>
            <p className="text-[9px] font-black uppercase tracking-wide text-white/60">today</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-[12px] font-bold text-white/80">
            {complete ? 'You hit today’s goal. Beautiful work.' : `${remaining} more mitzvah${remaining === 1 ? '' : 's'} to keep today on track.`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-100 p-3 sm:grid-cols-3">
        <MiniStat icon={Flame} label="Current streak" value={`${streak?.current_streak || 0} days`} tone="orange" />
        <MiniStat icon={Award} label="Best streak" value={`${streak?.best_streak || 0} days`} tone="blue" />
        <MiniStat icon={Heart} label="Logged today" value={todayCount} tone="emerald" />
      </div>

      <div className="p-3">
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What mitzvah did you do?"
              className="app-input h-11 px-3 text-sm"
              autoFocus
            />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="app-input h-11 px-3 text-sm font-bold">
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Reflection</p>
              <p className="mt-1 text-[13px] font-black leading-5 text-slate-900">{prompt}</p>
              <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">
                A sentence is enough. The goal is to notice the impact, not write an essay.
              </p>
            </div>
            <textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="Example: It made me feel useful, and it reminded me that small things can really lift someone."
              rows={3}
              className="app-input min-h-[92px] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="h-11 rounded-xl border border-slate-200 bg-white text-[13px] font-black text-slate-600">
                Cancel
              </button>
              <button disabled={!title.trim() || saving} className="app-button-primary h-11 disabled:opacity-50">
                {saving ? 'Saving…' : 'Log mitzvah'}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)} className="motion-press flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-[14px] font-black text-white shadow-sm">
            <Plus className="h-4 w-4" />
            Log a mitzvah
          </button>
        )}

        <div className="mt-3 space-y-2">
          {todayLogs.length > 0 ? todayLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-slate-900">{log.description}</p>
                  {log.reflection && <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">“{log.reflection}”</p>}
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-[13px] font-black text-slate-700">No mitzvot logged yet today</p>
              <p className="mt-1 text-[12px] font-medium text-slate-500">Start small. One call, one favor, one good choice counts.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  const tones = {
    orange: 'bg-orange-50 text-orange-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[15px] font-black text-slate-950">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
