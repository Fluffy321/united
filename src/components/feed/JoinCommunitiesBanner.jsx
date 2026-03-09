import React from 'react';
import { Users, X, ArrowRight } from 'lucide-react';

export default function JoinCommunitiesBanner({ onJoin, onDismiss }) {
  return (
    <div
      className="rounded-2xl mb-4 p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
        border: '1px solid #bfdbfe',
      }}
    >
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#2563EB' }}
        >
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] text-slate-900 leading-tight">Welcome! Find your community 👋</p>
          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
            Join a shul, school, or interest group to see posts, events, and help requests from people near you.
          </p>
          <button
            onClick={onJoin}
            className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-white px-4 py-2 rounded-xl active:scale-[0.97] transition-all"
            style={{ background: '#2563EB' }}
          >
            Browse Communities
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}