import React from 'react';
import { ImagePlus } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

export default function PostBox({ currentUser, onPostClick }) {
  return (
    <div
      className="rounded-2xl p-3 mb-3 flex items-center gap-3"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #F3EEFF 100%)',
        border: '1px solid #C7D7FD',
        boxShadow: '0 2px 12px rgba(37,99,235,0.08)'
      }}
    >
      <UserAvatar user={currentUser} size="sm" />
      <button
        onClick={() => onPostClick('feed')}
        className="flex-1 text-left px-4 py-2.5 rounded-full text-[14px] font-medium transition-colors"
        style={{ background: 'rgba(255,255,255,0.7)', color: '#94a3b8', border: '1px solid #DDE6FF' }}
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