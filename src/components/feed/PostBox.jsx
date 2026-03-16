import React from 'react';
import { HandHeart, Bell, Calendar, MapPin } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

const QUICK_ACTIONS = [
  { label: 'Post Alert', icon: Bell, type: 'alert', color: 'text-red-600 bg-red-50 border-red-200' },
  { label: 'Ask for Help', icon: HandHeart, type: 'help', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { label: 'Create Event', icon: Calendar, type: 'event', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { label: 'Log Mitzvah', icon: MapPin, type: 'mitzvah', color: 'text-green-600 bg-green-50 border-green-200' },
];

export default function PostBox({ currentUser, onPostClick, onQuickAction }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Post input row */}
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar user={currentUser} size="sm" />
        <button
          onClick={() => onPostClick('feed')}
          className="flex-1 text-left px-4 py-2.5 rounded-full bg-slate-100 text-slate-400 text-[14px] font-medium hover:bg-slate-200 transition-colors"
        >
          What's happening in your community?
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon, type, color }) => (
          <button
            key={type}
            onClick={() => onQuickAction(type)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 ${color}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}