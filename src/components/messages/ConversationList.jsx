import React from 'react';
import SwipeableConversationItem from './SwipeableConversationItem';
import { differenceInMinutes, differenceInHours, differenceInDays, isYesterday, isToday, format } from 'date-fns';
import { HandHeart, Users } from 'lucide-react';

function formatTimestamp(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const mins = differenceInMinutes(now, d);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = differenceInHours(now, d);
  if (hrs < 24 && isToday(d)) return `${hrs}h`;
  if (isYesterday(d)) return 'yesterday';
  const days = differenceInDays(now, d);
  if (days < 7) return format(d, 'EEE');
  return format(d, 'MMM d');
}

export default function ConversationList({ conversations, currentUser, selectedId, onSelect, onArchive, onMarkUnread }) {
  const getOther = (conv) => {
    if (conv.is_community_chat) {
      return {
        id: `community-${conv.community_id}`,
        name: conv.community_name,
        avatar: conv.community_logo || null,
        isCommunity: true,
        memberCount: conv.member_count || 0,
      };
    }
    if (conv.is_demo) {
      return {
        id: `user-${conv.demo_user_name}`,
        name: conv.demo_user_name,
        avatar: null
      };
    }
    const idx = conv.participant_ids?.indexOf(currentUser.id);
    const otherIdx = idx === 0 ? 1 : 0;
    return {
      id: conv.participant_ids?.[otherIdx],
      name: conv.participant_names?.[otherIdx] || 'Unknown',
      avatar: conv.participant_avatars?.[otherIdx] || null
    };
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <p className="text-slate-700 font-semibold">Start with one real conversation</p>
        <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
          Search for someone you know to start a conversation.
        </p>
      </div>
    );
  }

  // Sort: unread first, then by recency
  const sorted = [...conversations].sort((a, b) => {
    const aUnread = (a.unread_count?.[currentUser.id] || 0) > 0;
    const bUnread = (b.unread_count?.[currentUser.id] || 0) > 0;
    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;
    const aTime = new Date(a.last_message_at || a.updated_date || 0).getTime();
    const bTime = new Date(b.last_message_at || b.updated_date || 0).getTime();
    return bTime - aTime;
  });

  // Group into sections
  const unreadConvs = sorted.filter(c => (c.unread_count?.[currentUser.id] || 0) > 0);
  const recentConvs = sorted.filter(c => (c.unread_count?.[currentUser.id] || 0) === 0);

  const renderConv = (conv, idx) => {
    const other = getOther(conv);
    const unread = conv.unread_count?.[currentUser.id] || 0;
    const isSelected = selectedId === conv.id;
    const initials = other.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    return (
      <SwipeableConversationItem
        key={conv.id || idx}
        onArchive={() => onArchive?.(conv)}
        onMarkUnread={() => onMarkUnread?.(conv)}
      >
      <button
        onClick={() => onSelect(conv)}
        className={`w-full rounded-[20px] px-3 py-3 cursor-pointer flex items-center gap-3 text-left border transition-all duration-150 ${
          isSelected
            ? 'bg-blue-50 border-blue-200 shadow-sm'
            : unread > 0
            ? 'bg-white border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.98]'
            : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98]'
        }`}
      >
        {/* Avatar */}
        <div
          className={`relative flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-white shadow-md ${
            other.isCommunity ? 'w-12 h-12 rounded-2xl' : 'w-12 h-12 rounded-full'
          }`}
          style={{ background: other.isCommunity
            ? 'linear-gradient(135deg, #0EA5E9, #2563EB)'
            : 'linear-gradient(135deg, #2563EB, #0F172A)'
          }}
        >
          {other.isCommunity
            ? other.avatar
              ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
              : <Users className="w-6 h-6 text-white" />
            : other.avatar
            ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-[17px]">{initials}</span>
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="flex flex-col min-w-0 flex-1">
              <span className={`font-black text-[15px] leading-snug flex items-center gap-1.5 min-w-0 ${
                unread > 0 ? 'text-slate-900' : 'text-slate-700'
              }`}>
                <span className="truncate">{other.name}</span>
              </span>
              {other.isCommunity && (
                <span className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">{other.memberCount.toLocaleString()} members</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              {conv.last_message_at && (
                <span className={`text-[11px] whitespace-nowrap font-medium ${
                  unread > 0 ? 'text-blue-500 font-semibold' : 'text-slate-400'
                }`}>
                  {formatTimestamp(conv.last_message_at)}
                </span>
              )}
              {unread === 1 && (
                <>
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm" aria-hidden="true" />
                  <span className="sr-only">1 unread message</span>
                </>
              )}
              {unread > 1 && (
                <span className="min-w-[20px] h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 shadow-sm">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
          </div>
          {conv.request_title && (
            <p className="text-[11px] font-semibold text-blue-500 truncate flex items-center gap-1 mb-0.5">
              <HandHeart className="w-3 h-3 flex-shrink-0" /> {conv.request_title}
            </p>
          )}
          <p className={`text-[13px] truncate leading-snug ${
            unread > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500 font-medium'
          }`}>
            {conv.last_message || 'No messages yet'}
          </p>
        </div>
      </button>
      </SwipeableConversationItem>
    );
  };

  return (
    <div className="px-3 py-3 space-y-1">
      {/* Unread */}
      {unreadConvs.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1 pt-3 pb-1">
            <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Unread</span>
            <span className="flex-1 h-px bg-blue-100" />
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          {unreadConvs.map((conv, idx) => renderConv(conv, idx))}
        </>
      )}

      {/* Recent */}
      {recentConvs.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1 pt-3 pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent</span>
            <span className="flex-1 h-px bg-slate-100" />
          </div>
          {recentConvs.map((conv, idx) => renderConv(conv, idx))}
        </>
      )}
    </div>
  );
}
