import React, { useState } from 'react';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const INTERESTS = [
  { key: 'School',  emoji: '🏫', label: 'School',  types: ['School', 'Yeshiva', 'Seminary'], categories: ['School'] },
  { key: 'Food',    emoji: '🍽️', label: 'Food',    types: ['Other'],                          categories: ['Food'] },
  { key: 'Jobs',    emoji: '💼', label: 'Jobs',    types: ['Other'],                          categories: ['Jobs'] },
  { key: 'Shul',    emoji: '🕍', label: 'Shul',    types: ['Shul'],                           categories: ['Shul'] },
  { key: 'Chesed',  emoji: '🤝', label: 'Chesed',  types: ['Other'],                          categories: ['Chessed'] },
];

export default function CommunityInterestOnboarding({ currentUser, allCommunities, onJoined }) {
  const [selected, setSelected] = useState(new Set());
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleJoin = async () => {
    if (selected.size === 0) return toast.error('Pick at least one interest');
    if (!currentUser) { toast.error('Sign in to join communities'); return; }
    setJoining(true);

    // Find matching communities for each selected interest
    const toJoin = [];
    for (const key of selected) {
      const interest = INTERESTS.find(i => i.key === key);
      if (!interest) continue;
      const matches = allCommunities.filter(c => {
        const typeMatch = interest.types.includes(c.type);
        const catMatch = interest.categories.some(cat =>
          c.category?.toLowerCase().includes(cat.toLowerCase()) ||
          c.type?.toLowerCase().includes(cat.toLowerCase())
        );
        return typeMatch || catMatch;
      });
      // Take the top community by follower_count for this interest
      const top = [...matches].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)).slice(0, 1);
      top.forEach(c => { if (!toJoin.find(x => x.id === c.id)) toJoin.push(c); });
    }

    // Cap at 3 communities
    const finalJoin = toJoin.slice(0, 3);

    if (finalJoin.length === 0) {
      toast('No matching communities found yet — check back soon!');
      setJoining(false);
      return;
    }

    await Promise.all(finalJoin.map(async (community) => {
      try {
        await base44.entities.UserCommunity.create({
          user_id: currentUser.id,
          community_id: community.id,
          role: 'Member',
          user_name: currentUser.full_name || currentUser.display_name,
        });
        await base44.entities.Community.update(community.id, {
          follower_count: (community.follower_count || 0) + 1,
        }).catch(() => {});
      } catch {}
    }));

    setDone(true);
    setJoining(false);
    toast.success(`Joined ${finalJoin.length} communities! 🎉`);
    setTimeout(() => onJoined(finalJoin.map(c => c.id)), 600);
  };

  if (done) {
    return (
      <div className="rounded-3xl p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-[16px] font-bold text-slate-900">You're in!</h3>
        <p className="text-[12px] text-slate-500 mt-1">Loading your communities…</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden border border-blue-100 shadow-sm"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)' }}>
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="text-[17px] font-black text-slate-900">What communities interest you?</h3>
        </div>
        <p className="text-[12px] text-slate-500 mb-5">We'll auto-join you to the best ones. You can always leave later.</p>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {INTERESTS.map(i => {
            const active = selected.has(i.key);
            return (
              <button
                key={i.key}
                onClick={() => toggle(i.key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all active:scale-95 ${
                  active
                    ? 'border-blue-500 bg-blue-600 shadow-md'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <span className="text-2xl">{i.emoji}</span>
                <span className={`text-[10px] font-bold leading-tight text-center ${active ? 'text-white' : 'text-slate-600'}`}>
                  {i.label}
                </span>
                {active && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleJoin}
          disabled={joining || selected.size === 0}
          className="w-full py-3.5 rounded-2xl text-white text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
        >
          {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀'}
          {joining ? 'Joining…' : `Join ${selected.size > 0 ? `${selected.size} area${selected.size > 1 ? 's' : ''}` : 'communities'}`}
        </button>
      </div>
    </div>
  );
}