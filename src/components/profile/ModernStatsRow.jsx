import React from 'react';

export default function ModernStatsRow({
  friends = 0,
  following = 0,
  posts = 0,
  impact = 0,
  onFriendsClick,
  onPostsClick,
  onImpactClick,
  onFollowingClick,
  showFollowing = true,
}) {
  const stats = [
    { label: 'Friends', value: friends, onClick: onFriendsClick },
    ...(showFollowing ? [{ label: 'Communities', value: following, onClick: onFollowingClick }] : []),
    { label: 'Posts', value: posts, onClick: onPostsClick },
    { label: 'Impact', value: impact, onClick: onImpactClick },
  ];

  return (
    <div className="px-4 pb-3">
      <div className={`grid ${showFollowing ? 'grid-cols-4' : 'grid-cols-3'} divide-x divide-slate-100 rounded-2xl border border-slate-200 bg-white`}>
        {stats.map(({ label, value, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="min-h-11 min-w-0 px-1 py-2 text-center transition-colors first:rounded-l-2xl last:rounded-r-2xl hover:bg-slate-50 active:bg-slate-100"
          >
            <p className="text-[16px] font-black leading-none text-slate-950">{value}</p>
            <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[-0.01em] text-slate-400">{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
