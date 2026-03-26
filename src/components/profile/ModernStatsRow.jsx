import React from 'react';
import { Users, FileText, Flame } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 text-center group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`${color} rounded-lg w-8 h-8 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
    </button>
  );
};

export default function ModernStatsRow({ following = 0, posts = 0, impact = 0, onPostsClick, onImpactClick, onFollowingClick }) {
  return (
    <div className="px-6 py-6">
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