import React from 'react';
import SwipeableConversationItem from './SwipeableConversationItem';
import { differenceInMinutes, differenceInHours, differenceInDays, isYesterday, isToday, format } from 'date-fns';
import { HandHeart, Bot, Sparkles, Users } from 'lucide-react';
import { AI_AGENT } from '@/lib/aiAgent';


const REALISTIC_PREVIEWS = [
  'Are you going tonight?',
  "I'll send it in a bit",
  'Did you see the post?',
  'Thanks again 🙏',
  'Let me know what you think',
  'Can you make it on Shabbos?',
  'Just saw your message!',
  'That sounds great 👍',
  'We should catch up soon',
  'Did you hear about the event?',
  'I\'ll be there at 7',
  'Check this out when you get a chance',
  'Hope you\'re doing well!',
  'Any update on that?',
  'Sounds good to me!',
];

function getPreview(convId) {
  if (!convId) return REALISTIC_PREVIEWS[0];
  const idx = convId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % REALISTIC_PREVIEWS.length;
  return REALISTIC_PREVIEWS[idx];
}

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

// Deterministically decide if a user appears "active" based on their ID
function isLikelyActive(userId) {
  if (!userId) return false;
  const code = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return code % 3 === 0; // ~33% appear active
}

// Deterministically mock typing state for ~15% of conversations
function isMockTyping(convId) {
  if (!convId) return false;
  const code = convId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return code % 7 === 0;
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
        <p className="text-slate-700 font-semibold">No messages yet</p>
        <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
          Tap the message icon to start a conversation.
        </p>
      </div>
    );
  }

  // Sort: AI first, then unread, then by recency
  const sorted = [...conversations].sort((a, b) => {
    const aIsAI = getOther(a).id === AI_AGENT.id;
    const bIsAI = getOther(b).id === AI_AGENT.id;
    if (aIsAI && !bIsAI) return -1;
    if (!aIsAI && bIsAI) return 1;
    const aUnread = (a.unread_count?.[currentUser.id] || 0) > 0;
    const bUnread = (b.unread_count?.[currentUser.id] || 0) > 0;
    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;
    const aTime = new Date(a.last_message_at || a.updated_date || 0).getTime();
    const bTime = new Date(b.last_message_at || b.updated_date || 0).getTime();
    return bTime - aTime;
  });

  // Group into sections
  const aiConvs = sorted.filter(c => getOther(c).id === AI_AGENT.id);
  const unreadConvs = sorted.filter(c => getOther(c).id !== AI_AGENT.id && (c.unread_count?.[currentUser.id] || 0) > 0);
  const recentConvs = sorted.filter(c => getOther(c).id !== AI_AGENT.id && (c.unread_count?.[currentUser.id] || 0) === 0);

  const renderConv = (conv, idx) => {
    const other = getOther(conv);
    const unread = conv.unread_count?.[currentUser.id] || 0;
    const isSelected = selectedId === conv.id;
    const isAIChat = other.id === AI_AGENT.id;
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
          isAIChat && isSelected
            ? 'border-blue-200 shadow-sm'
            : isAIChat
            ? 'border-blue-100 hover:shadow-md hover:border-blue-200 active:scale-[0.98]'
            : isSelected
            ? 'bg-blue-50 border-blue-200 shadow-sm'
            : unread > 0
            ? 'bg-white border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.98]'
            : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98]'
        }`}
        style={isAIChat ? {
          background: isSelected
            ? 'linear-gradient(135deg, #EFF6FF, #F8FAFC)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)'
        } : {}}
      >
        {/* Avatar */}
        <div
          className={`relative flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-white shadow-md ${
            isAIChat
              ? 'w-12 h-12 rounded-2xl'
              : other.isCommunity
              ? 'w-12 h-12 rounded-2xl'
              : 'w-12 h-12 rounded-full'
          }`}
          style={{ background: isAIChat
            ? 'linear-gradient(135deg, #2563EB, #0F172A)'
            : other.isCommunity
            ? 'linear-gradient(135deg, #0EA5E9, #2563EB)'
            : 'linear-gradient(135deg, #2563EB, #0F172A)'
          }}
        >
          {isAIChat
            ? <Bot className="w-7 h-7 text-white" />
            : other.isCommunity
            ? other.avatar
              ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
              : <Users className="w-6 h-6 text-white" />
            : other.avatar
            ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-[17px]">{initials}</span>
          }
          {isAIChat && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow border-2 border-white">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          )}
          {!isAIChat && !other.isCommunity && isLikelyActive(other.id) && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          )}
          {isAIChat && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="flex flex-col min-w-0 flex-1">
              <span className={`font-black text-[15px] leading-snug flex items-center gap-1.5 min-w-0 ${
                unread > 0 ? 'text-slate-900' : 'text-slate-700'
              }`}>
                <span className="truncate">{other.name}</span>
                {isAIChat && (
                  <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-950 text-white">
                    AI
                  </span>
                )}
              </span>
              {isLikelyActive(other.id) && !isAIChat && !other.isCommunity && (
                <span className="text-[10px] font-semibold text-emerald-500 leading-none mt-0.5">Active now</span>
              )}
              {other.isCommunity && (
                <span className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">{other.memberCount.toLocaleString()} members</span>
              )}
              {isAIChat && (
                <span className="text-[10px] font-semibold text-emerald-400 leading-none mt-0.5">Always available</span>
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
          {isMockTyping(conv.id) && !isAIChat ? (
            <p className="text-[13px] text-emerald-500 font-semibold flex items-center gap-1">
              <span className="flex gap-0.5 items-end h-3">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              typing…
            </p>
          ) : (
            <p className={`text-[13px] truncate leading-snug ${
              unread > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500 font-medium'
            }`}>
              {conv.last_message || getPreview(conv.id)}
            </p>
          )}
        </div>
      </button>
      </SwipeableConversationItem>
    );
  };

  return (
    <div className="px-3 py-3 space-y-1">
      {/* AI Assistant */}
      {aiConvs.map((conv, idx) => renderConv(conv, idx))}

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
