import React from 'react';
import { Users, FileText, Flame } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-center shadow-sm transition-all duration-200 active:scale-95 group ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
    >
      <div className={`${color} rounded-2xl w-9 h-9 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </button>
  );
};

export default function ModernStatsRow({ following = 0, posts = 0, impact = 0, onPostsClick, onImpactClick, onFollowingClick }) {
  return (
    <div className="px-3 py-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          label="Following"
          value={following}
          color="bg-blue-500"
          onClick={onFollowingClick}
        />
        <StatCard
          icon={FileText}
          label="Posts"
          value={posts}
          color="bg-purple-500"
          onClick={onPostsClick}
        />
        <StatCard
          icon={Flame}
          label="Impact"
          value={impact}
          color="bg-orange-500"
          onClick={onImpactClick}
        />
      </div>
    </div>
  );
}
