import React from 'react';
import { ImagePlus } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

export default function PostBox({ currentUser, onPostClick }) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-white/80 shadow-sm backdrop-blur p-4 mb-3 flex items-center gap-3">
      <UserAvatar user={currentUser} size="sm" />
      <button
        onClick={() => onPostClick('feed')}
        className="flex-1 text-left px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-colors bg-blue-50/70 text-slate-400 border-0"
      >
        What's happening?
      </button>
      <button
        onClick={() => onPostClick('photo')}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }}
        title="Add photo"
      >
        <ImagePlus style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}