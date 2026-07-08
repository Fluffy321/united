import { format, isToday, parseISO, subDays } from 'date-fns';
import {
  createUserStreak,
  filterMitzvahLog,
  filterUserStreak,
  updateUserStreak,
} from '@/services/entityServices';

export const DAILY_MITZVAH_GOAL = 2;

export function streakDateKey(date = new Date()) {
  return format(date, 'yyyy-MM-dd');
}

export function streakBadgeFor(streak) {
  if (streak >= 30) return 'elite';
  if (streak >= 14) return 'gold';
  if (streak >= 7) return 'silver';
  if (streak >= 2) return 'basic';
  return 'starter';
}

function isLogToday(log) {
  const value = log.date || log.created_date || log.created_at;
  if (!value) return false;
  if (String(value).length === 10) return value === streakDateKey();
  try {
    return isToday(parseISO(value));
  } catch {
    return false;
  }
}

export const streakService = {
  async getUserStreak(userId) {
    if (!userId) return null;
    const rows = await filterUserStreak({ user_id: userId });
    return rows[0] || null;
  },

  async listTodayMitzvahLogs(userId) {
    if (!userId) return [];
    const logs = await filterMitzvahLog({ user_id: userId }, '-created_date', 100);
    return logs.filter(isLogToday);
  },

  async getTodayMitzvahCount(userId) {
    const logs = await this.listTodayMitzvahLogs(userId);
    return logs.length;
  },

  async upsertForCompletedGoal({ currentUser, completedToday }) {
    if (!currentUser?.id || !completedToday) return null;

    const today = streakDateKey();
    const yesterday = streakDateKey(subDays(new Date(), 1));
    const current = await this.getUserStreak(currentUser.id);

    if (current?.last_activity_date === today) return current;

    const nextCurrent = current?.last_activity_date === yesterday
      ? (current.current_streak || 0) + 1
      : 1;

    const patch = {
      user_id: currentUser.id,
      current_streak: nextCurrent,
      best_streak: Math.max(current?.best_streak || 0, nextCurrent),
      last_activity_date: today,
      badge_level: streakBadgeFor(nextCurrent),
    };

    if (current?.id) return updateUserStreak(current.id, patch);
    return createUserStreak(patch);
  },

  async recordLogProgress({ currentUser, beforeCount }) {
    const afterCount = (beforeCount || 0) + 1;
    const reachedGoal = beforeCount < DAILY_MITZVAH_GOAL && afterCount >= DAILY_MITZVAH_GOAL;
    const streak = await this.upsertForCompletedGoal({
      currentUser,
      completedToday: reachedGoal,
    });
    return { reachedGoal, streak };
  },

  async getStreakAtRisk(userId) {
    const streak = await this.getUserStreak(userId);
    if (!streak?.current_streak) return { atRisk: false, streak, todayCount: 0 };

    const today = streakDateKey();
    if (streak.last_activity_date === today) {
      return { atRisk: false, streak, todayCount: DAILY_MITZVAH_GOAL };
    }

    const todayCount = await this.getTodayMitzvahCount(userId);
    return {
      atRisk: todayCount < DAILY_MITZVAH_GOAL,
      streak,
      todayCount,
    };
  },
};

export default streakService;
