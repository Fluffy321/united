import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { HandHeart, Bot, Circle } from 'lucide-react';
import { AI_AGENT } from '@/lib/aiAgent';


export default function ConversationList({ conversations, currentUser, selectedId, onSelect }) {
  const getOther = (conv) => {
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

  return (
    <div className="px-3 py-3 space-y-2">
      {conversations.map((conv, idx) => {
        const other = getOther(conv);
        const unread = conv.unread_count?.[currentUser.id] || 0;
        const isSelected = selectedId === conv.id;
        const isAIChat = other.id === AI_AGENT.id;
        const initials = other.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

        return (
          <button
            key={conv.id || idx}
            onClick={() => onSelect(conv)}
            className={`w-full rounded-2xl px-4 py-3.5 cursor-pointer flex items-center gap-3.5 text-left border transition-all duration-150 ${
              isSelected
                ? 'bg-blue-50 border-blue-200 shadow-md shadow-blue-100'
                : isAIChat
                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 hover:shadow-md hover:border-indigo-200 active:scale-[0.98]'
                : unread > 0
                ? 'bg-white border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-200 active:scale-[0.98]'
                : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98]'
            }`}
          >
            {/* Avatar */}
            <div
              className="relative w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-[17px] text-white shadow-sm"
              style={{ background: isAIChat ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {isAIChat
                ? <Bot className="w-7 h-7 text-white" />
                : other.avatar
                ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <span className={`font-bold text-[15px] truncate flex items-center gap-1.5 leading-snug ${
                  unread > 0 ? 'text-slate-900' : 'text-slate-700'
                }`}>
                  {other.name}
                  {isAIChat && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-wide">
                      AI
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  {conv.last_message_at && (
                    <span className={`text-[11px] whitespace-nowrap ${
                      unread > 0 ? 'text-blue-500 font-semibold' : 'text-slate-400'
                    }`}>
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                    </span>
                  )}
                  {unread > 0 && (
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
                unread > 0 ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal'
              }`}>
                {conv.last_message || 'Start the conversation…'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}