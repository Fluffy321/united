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
    <div className="rounded-2xl mb-3" style={{ background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div className="p-2.5">
        {/* Input row */}
        <div className="flex items-center gap-2 mb-2">
          <UserAvatar user={currentUser} size="xs" />
          <button
            onClick={() => onPostClick('feed')}
            className="flex-1 text-left px-3 py-2 rounded-xl text-[13px] font-medium bg-slate-50 text-slate-400 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-400 active:scale-[0.99] transition-all"
          >
            What's on your mind?
          </button>
          <button
            onClick={() => onPostClick('feed')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }}
          >
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Action pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
          {actions.map(({ icon: Icon, label, color, bg, type, subtype }) => (
            <button
              key={label}
              onClick={() => onPostClick(type, subtype)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.97]"
              style={{ background: bg, color }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}