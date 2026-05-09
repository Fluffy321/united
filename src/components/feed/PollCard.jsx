import React, { useState, useEffect } from 'react';
import { dataService } from '@/services';
import UserAvatar from '@/components/common/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PollCard({ post, currentUser }) {
  const [votes, setVotes] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [voting, setVoting] = useState(false);

  const options = post.poll_options || [];
  const totalVotes = votes.length;

  useEffect(() => {
    dataService.entities.PollVote.filter({ post_id: post.id }).then(v => {
      setVotes(v);
      if (currentUser) {
        const mine = v.find(x => x.user_id === currentUser.id);
        if (mine) setUserVote(mine.option_index);
      }
    }).catch(() => {});

    const unsub = dataService.entities.PollVote.subscribe((event) => {
      if (event.data?.post_id !== post.id) return;
      setVotes(prev => {
        if (event.type === 'create') return [...prev, event.data];
        if (event.type === 'delete') return prev.filter(v => v.id !== event.id);
        return prev;
      });
    });
    return unsub;
  }, [post.id, currentUser?.id]);

  const handleVote = async (index) => {
    if (!currentUser || userVote !== null || voting) return;
    setVoting(true);
    try {
      await dataService.entities.PollVote.create({ post_id: post.id, user_id: currentUser.id, option_index: index });
      await dataService.entities.UnifiedPost.update(post.id, { poll_votes_count: totalVotes + 1 });
      setUserVote(index);
    } catch {
      toast.error('Could not submit your vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const getCount = (i) => votes.filter(v => v.option_index === i).length;
  const getPct = (i) => totalVotes === 0 ? 0 : Math.round((getCount(i) / totalVotes) * 100);

  const timeAgo = formatDistanceToNow(new Date(post.created_date), { addSuffix: true });

  const BAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];

  return (
    <div className="bg-white px-3 pt-3 pb-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <UserAvatar user={post} name={post.user_name} size="xs" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-[13px] text-slate-900">{post.user_name}</span>
          <span className="text-[11px] text-slate-400 ml-2">{timeAgo}</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
          <BarChart2 className="w-3 h-3" /> Poll
        </span>
      </div>

      {/* Question */}
      <p className="font-bold text-[15px] text-slate-900 mb-3 leading-snug">{post.body}</p>

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt, i) => {
          const pct = getPct(i);
          const count = getCount(i);
          const isChosen = userVote === i;
          const hasVoted = userVote !== null;
          const color = BAR_COLORS[i % BAR_COLORS.length];

          return (
            <button
              key={i}
              type="button"
              disabled={hasVoted || voting || !currentUser}
              onClick={() => handleVote(i)}
              className={`relative w-full text-left rounded-2xl overflow-hidden border transition-all ${
                isChosen ? 'border-blue-500' : 'border-slate-200'
              } ${!hasVoted && currentUser ? 'hover:border-blue-300 active:scale-[0.99]' : ''}`}
              style={{ background: '#F8FAFC' }}
            >
              {/* Progress bar fill */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700 rounded-2xl"
                  style={{ width: `${pct}%`, background: `${color}18` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2.5 gap-2">
                <div className="flex items-center gap-2">
                  {isChosen && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
                  <span className={`text-[13px] font-semibold ${isChosen ? 'text-slate-900' : 'text-slate-700'}`}>{opt}</span>
                </div>
                {hasVoted && (
                  <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-slate-400 mt-2 pl-1">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        {!currentUser && ' · Log in to vote'}
        {currentUser && userVote === null && ' · Tap to vote'}
      </p>
    </div>
  );
}