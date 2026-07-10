import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { filterMitzvahPoints } from '@/services/entityServices';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ImpactLeaderboard({ currentUser }) {
  const { data: leaders = [] } = useQuery({
    queryKey: ['mitzvah-points-leaderboard'],
    queryFn: () => filterMitzvahPoints({}, '-total_points', 5),
    staleTime: 60000,
  });

  const visible = leaders.filter((row) => (row.total_points || 0) > 0);
  if (visible.length === 0) return null;

  return (
    <section className="surface-tile rounded-[20px] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Trophy className="h-4 w-4" /></span>
        <div>
          <h2 className="text-[14px] font-black leading-tight text-slate-950">Top helpers</h2>
          <p className="text-[11px] font-semibold text-slate-400">Points from mitzvot logged and completed</p>
        </div>
      </div>
      <ol className="space-y-1">
        {visible.map((row, index) => {
          const isMe = row.user_id === currentUser?.id;
          return (
            <li
              key={row.id || row.user_id}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${isMe ? 'bg-blue-50' : ''}`}
            >
              <span className="w-6 shrink-0 text-center text-[13px] font-black text-slate-500">
                {MEDALS[index] || index + 1}
              </span>
              <span className={`min-w-0 flex-1 truncate text-[13px] font-bold ${isMe ? 'text-blue-800' : 'text-slate-800'}`}>
                {row.user_name || 'Community member'}{isMe ? ' (you)' : ''}
              </span>
              <span className="shrink-0 text-[12px] font-black text-slate-500">{row.total_points} pts</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
