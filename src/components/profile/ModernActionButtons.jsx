import React from 'react';
import { Edit2, Share2, MessageCircle, Flag, Ban, UserRoundCheck, UserRoundPlus, Clock, UserRoundX } from 'lucide-react';
import { FRIEND_STATUS } from '@/services/friendsService';

export default function ModernActionButtons({
  isOwnProfile,
  onEditProfile,
  onMessage,
  onShare,
  onReport,
  onBlock,
  // New: relationship object { status, requestId }
  relationship = { status: FRIEND_STATUS.NONE, requestId: null },
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  friendLoading = false,
}) {
  if (isOwnProfile) {
    return (
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={onEditProfile}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 py-3 text-[13px] font-black text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition-all hover:bg-slate-800 active:scale-95"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit Profile
        </button>
        <button
          onClick={onShare}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
          title="Share profile"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const { status } = relationship;

  const renderFriendButton = () => {
    if (status === FRIEND_STATUS.FRIENDS) {
      return (
        <button
          onClick={onRemoveFriend}
          disabled={friendLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 py-2.5 text-[13px] font-black text-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-60 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          title="Remove friend"
        >
          <UserRoundCheck className="h-3.5 w-3.5" />
          {friendLoading ? '...' : 'Friends'}
        </button>
      );
    }

    if (status === FRIEND_STATUS.PENDING_SENT) {
      return (
        <button
          onClick={onCancelRequest}
          disabled={friendLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 py-2.5 text-[13px] font-black text-slate-500 shadow-sm transition-all active:scale-95 disabled:opacity-60 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          title="Cancel request"
        >
          <Clock className="h-3.5 w-3.5" />
          {friendLoading ? '...' : 'Requested'}
        </button>
      );
    }

    if (status === FRIEND_STATUS.PENDING_RECEIVED) {
      return (
        <div className="flex flex-1 gap-1.5">
          <button
            onClick={onAcceptRequest}
            disabled={friendLoading}
            className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-slate-950 py-2.5 text-[13px] font-black text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 hover:bg-slate-800"
          >
            <UserRoundCheck className="h-3.5 w-3.5" />
            {friendLoading ? '...' : 'Accept'}
          </button>
          <button
            onClick={onDeclineRequest}
            disabled={friendLoading}
            className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-black text-slate-500 shadow-sm transition-all active:scale-95 disabled:opacity-60 hover:bg-red-50 hover:text-red-500"
            title="Decline"
          >
            <UserRoundX className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={onSendRequest}
        disabled={friendLoading}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 py-2.5 text-[13px] font-black text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 hover:bg-slate-800"
      >
        <UserRoundPlus className="h-3.5 w-3.5" />
        {friendLoading ? '...' : 'Add Friend'}
      </button>
    );
  };

  return (
    <div className="flex gap-2 px-4 pb-4">
      {renderFriendButton()}
      <button
        onClick={onMessage}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-[13px] font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.20)] transition-all active:scale-95 hover:bg-blue-700"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Message
      </button>
      <button
        onClick={onShare}
        className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm transition-all active:scale-95 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
        title="Share profile"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onReport}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500 active:scale-95"
        title="Report"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onBlock}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500 active:scale-95"
        title="Block"
      >
        <Ban className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
