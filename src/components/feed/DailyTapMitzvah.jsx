import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { DAILY_MITZVAH_GOAL, streakDateKey, streakService } from '@/services';
import { createMitzvahLog, createMitzvahPoints, filterMitzvahLog, filterMitzvahPoints, updateMitzvahPoints } from '@/services/entityServices';

// One curated suggestion per day, deterministic so everyone in the Five Towns
// sees the same "today's mitzvah" — that shared framing is the daily hook.
const DAILY_SUGGESTIONS = [
  { title: 'Call or text someone who might be lonely today', category: 'Kindness' },
  { title: 'Give tzedakah — any amount counts', category: 'Tzedakah' },
  { title: 'Send a thank-you message to someone who helped you', category: 'Kindness' },
  { title: 'Learn one line of Torah', category: 'Torah / Learning' },
  { title: 'Offer someone a ride or run an errand for them', category: 'Chesed' },
  { title: 'Give three sincere compliments', category: 'Kindness' },
  { title: 'Help at home without being asked', category: 'Honoring Parents' },
  { title: 'Check in on an elderly neighbor', category: 'Chesed' },
  { title: 'Say one bracha slowly, with real intention', category: 'Prayer' },
  { title: 'Invite someone to a Shabbat meal this week', category: 'Community' },
  { title: 'Forgive someone a small annoyance today', category: 'Kindness' },
  { title: 'Share something you learned with a friend', category: 'Torah / Learning' },
  { title: 'Pick up the phone for a relative you owe a call', category: 'Honoring Parents' },
  { title: 'Do one favor today before being asked', category: 'Chesed' },
];

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
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

export default function DailyTapMitzvah({ currentUser, streak }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const suggestion = DAILY_SUGGESTIONS[getDayOfYear() % DAILY_SUGGESTIONS.length];

  // Same query key as DailyMitzvahTracker so the two share one cache entry.
  const { data: logs = [] } = useQuery({
    queryKey: ['daily-mitzvah-tracker-logs', currentUser?.id],
    queryFn: () => filterMitzvahLog({ user_id: currentUser.id }, '-date', 100),
    enabled: Boolean(currentUser?.id),
    staleTime: 60000,
  });

  const todayLogs = useMemo(() => (
    logs.filter((log) => {
      const value = log.date || log.created_date || log.created_at;
      if (!value) return false;
      return value.length === 10 ? value === streakDateKey() : isToday(parseISO(value));
    })
  ), [logs]);

  const doneToday = todayLogs.some((log) => log.description === suggestion.title);
  const todayCount = todayLogs.length;
  const currentStreak = streak?.current_streak || 0;

  const handleTap = async () => {
    if (!currentUser?.id || saving || doneToday) return;
    setSaving(true);
    try {
      await createMitzvahLog({
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name || 'Community member',
        date: streakDateKey(),
        category: suggestion.category,
        description: suggestion.title,
        reflection: '',
        hours_completed: 0,
      });
      const { reachedGoal } = await streakService.recordLogProgress({ currentUser, beforeCount: todayCount });
      await addMitzvahPoints(currentUser, reachedGoal ? 20 : 10);

      queryClient.invalidateQueries({ queryKey: ['daily-mitzvah-tracker-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-mitzvah-tracker-streak'] });
      queryClient.invalidateQueries({ queryKey: ['mitzvah-logs'] });
      queryClient.invalidateQueries({ queryKey: ['user-streak'] });
      queryClient.invalidateQueries({ queryKey: ['mitzvah-points'] });

      toast.success(reachedGoal ? 'Daily goal complete. Your streak is alive. 🔥' : 'Mitzvah logged — nice.');
    } catch {
      toast.error('Could not log it yet — try again in a moment.');
    }
    setSaving(false);
  };

  if (!currentUser) return null;

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)' }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#4CAF7D' }}>
          <Sparkles className="mr-1 inline h-3 w-3" />
          Today&rsquo;s mitzvah
        </p>
        {currentStreak > 0 && (
          <span className="text-[11px] font-black" style={{ color: '#fb923c' }}>🔥 {currentStreak}</span>
        )}
      </div>
      <p className="text-[15px] font-black leading-snug text-white mb-3">{suggestion.title}</p>
      {doneToday ? (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: 'rgba(76,175,125,0.2)' }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: '#6fcf97' }} />
          <p className="text-[13px] font-black" style={{ color: '#6fcf97' }}>
            Done — {todayCount >= DAILY_MITZVAH_GOAL ? 'today’s goal is complete' : `${DAILY_MITZVAH_GOAL - todayCount} more keeps the streak alive`}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTap}
          disabled={saving}
          className="motion-press flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-black transition-all disabled:opacity-60"
          style={{ background: '#4CAF7D', color: '#081a10' }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          I did this — count it
        </button>
      )}
    </div>
  );
}
