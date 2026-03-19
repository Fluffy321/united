import React from 'react';
import { ImagePlus } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

export default function PostBox({ currentUser, onPostClick }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 mb-3 flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <UserAvatar user={currentUser} size="sm" />
      <button
        onClick={() => onPostClick('feed')}
        className="flex-1 text-left px-4 py-2.5 rounded-full bg-slate-100 text-slate-400 text-[14px] font-medium hover:bg-slate-200 transition-colors"
      >
        What's happening?
      </button>
      <button
        onClick={() => onPostClick('photo')}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
        title="Add photo"
      >
        <ImagePlus style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}