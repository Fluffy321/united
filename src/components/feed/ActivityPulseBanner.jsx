import React from 'react';
import { Users, Sparkles, MessageSquare } from 'lucide-react';

export default function ActivityPulseBanner({ stats }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 shadow-sm">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="text-slate-600">
            <span className="font-bold text-slate-900">{stats.activeUsers}</span> active today
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-slate-600">
            <span className="font-bold text-slate-900">{stats.mitzvahs}</span> mitzvahs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="text-slate-600">
            <span className="font-bold text-slate-900">{stats.posts}</span> posts
          </span>
        </div>
      </div>
    </div>
  );
}