import React from 'react';
import { Edit2, Share2, MessageCircle, Flag, Ban, UserRoundCheck, UserRoundPlus } from 'lucide-react';

export default function ModernActionButtons({
  isOwnProfile,
  onEditProfile,
  onMessage,
  onShare,
  onReport,
  onBlock,
  onFriendToggle,
  isFriend = false,
  friendLoading = false,
}) {
  if (isOwnProfile) {
    return (
      <div className="flex gap-2 px-3 pb-1">
        <button
          onClick={onEditProfile}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-2.5 text-[13px] font-black text-slate-700 shadow-sm transition-all active:scale-95 hover:bg-slate-50"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit Profile
        </button>
        <button
          onClick={onShare}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-500 shadow-sm transition-all active:scale-95 hover:bg-slate-50"
          title="Share profile"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-3 pb-1">
      <button
        onClick={onFriendToggle}
        disabled={friendLoading}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-black shadow-sm transition-all active:scale-95 disabled:opacity-60 ${
          isFriend ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-slate-950 text-white hover:bg-slate-800'
        }`}
      >
        {isFriend ? <UserRoundCheck className="h-3.5 w-3.5" /> : <UserRoundPlus className="h-3.5 w-3.5" />}
        {friendLoading ? '...' : isFriend ? 'Friends' : 'Add Friend'}
      </button>
      <button
        onClick={onMessage}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-2.5 text-[13px] font-black text-white shadow-sm transition-all active:scale-95 hover:bg-blue-700"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Message
      </button>
      <button
        onClick={onShare}
        className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-500 shadow-sm transition-all active:scale-95 hover:bg-slate-50"
        title="Share profile"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onReport}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500 active:scale-95"
        title="Report"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onBlock}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500 active:scale-95"
        title="Block"
      >
        <Ban className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
