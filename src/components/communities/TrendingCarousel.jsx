import React from 'react';
import { MapPin, Flame, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_EMOJI = { Shul: '🕍', School: '📚', Yeshiva: '📖', Seminary: '🎓', Camp: '⛺', Other: '🏛️' };

export default function TrendingCarousel({ communities, joinedIds, joiningId, onJoin, onView }) {
  const trending = [...communities]
    .sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0))
    .slice(0, 8);

  if (trending.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-3 px-4">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-bold text-slate-800">Trending Near You</span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {trending.map(c => {
          const joined = joinedIds.has(c.id);
          const loading = joiningId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => onView(c.id)}
              className="flex-shrink-0 w-44 bg-white rounded-2xl border border-slate-100 p-3 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center mb-2 text-xl">
                {c.logo_url
                  ? <img src={c.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  : TYPE_EMOJI[c.type] || '🏛️'
                }
              </div>
              <p className="font-bold text-xs text-slate-900 line-clamp-2 mb-0.5">{c.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate">{c.neighborhood}</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-2">
                {(c.follower_count || 0).toLocaleString()} members
              </div>
              <Button
                size="sm"
                variant={joined ? 'outline' : 'default'}
                disabled={loading}
                onClick={e => { e.stopPropagation(); onJoin(e, c); }}
                className={`w-full text-xs h-7 ${joined ? 'border-slate-200 text-slate-600' : 'bg-blue-600 hover:bg-[#0D4EB8]'}`}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : joined ? 'Joined' : 'Join'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}