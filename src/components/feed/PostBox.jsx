import React from 'react';
import { ImagePlus, HelpCircle, Calendar } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

const actions = [
  { icon: ImagePlus, label: 'Photo', color: '#16A34A', bg: '#DCFCE7', type: 'feed', subtype: 'photo' },
  { icon: HelpCircle, label: 'Ask', color: '#7C3AED', bg: '#EDE9FE', type: 'feed', subtype: 'question' },
  { icon: Calendar, label: 'Event', color: '#EA580C', bg: '#FFEDD5', type: 'event' },
];

export default function PostBox({ currentUser, onPostClick }) {
  return (
    <div className="rounded-xl mb-3 bg-white" style={{ border: '1px solid #E8ECF4' }}>
      <div className="px-3 py-2.5">
        {/* Input row */}
        <div className="flex items-center gap-2 mb-2.5">
          <UserAvatar user={currentUser} size="xs" />
          <button
            onClick={() => onPostClick('feed')}
            className="flex-1 text-left px-3 py-1.5 rounded-full text-[13px] text-slate-400 bg-slate-50 border border-slate-100 active:scale-[0.99] transition-all"
          >
            What's on your mind?
          </button>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
          {actions.map(({ icon: Icon, label, color, type, subtype }) => (
            <button
              key={label}
              onClick={() => onPostClick(type, subtype)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-[0.97]"
              style={{ color, background: 'transparent' }}
            >
              <Icon style={{ width: 12, height: 12 }} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}