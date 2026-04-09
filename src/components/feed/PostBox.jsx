import React from 'react';
import { ImagePlus, HelpCircle, Calendar, Pencil } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

const actions = [
  { icon: ImagePlus, label: 'Photo', color: '#16A34A', bg: '#DCFCE7', type: 'feed', subtype: 'photo' },
  { icon: HelpCircle, label: 'Ask', color: '#7C3AED', bg: '#EDE9FE', type: 'feed', subtype: 'question' },
  { icon: Calendar, label: 'Event', color: '#EA580C', bg: '#FFEDD5', type: 'event' },
];

export default function PostBox({ currentUser, onPostClick }) {
  return (
    <div className="rounded-3xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)', padding: '10px', boxShadow: '0 4px 18px rgba(37,99,235,0.1)' }}>
      <div className="bg-white rounded-2xl border border-blue-100/80 p-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Input row */}
        <div className="flex items-center gap-3 mb-3">
          <UserAvatar user={currentUser} size="sm" />
          <button
            onClick={() => onPostClick('feed')}
            className="flex-1 text-left px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-all bg-slate-50 text-slate-400 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-400 active:scale-[0.99]"
          >
            What's on your mind?
          </button>
          <button
            onClick={() => onPostClick('feed')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }}
          >
            <Pencil style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Action pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          {actions.map(({ icon: Icon, label, color, bg, type, subtype }) => (
            <button
              key={label}
              onClick={() => onPostClick(type, subtype)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.97]"
              style={{ background: bg, color }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}