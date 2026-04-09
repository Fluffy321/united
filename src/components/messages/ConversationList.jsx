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
    <div className="px-3 py-2 space-y-2">
      {conversations.map((conv, idx) => {
        const other = getOther(conv);
        const unread = conv.unread_count?.[currentUser.id] || 0;
        const isSelected = selectedId === conv.id;
        const isAIChat = other.id === AI_AGENT.id;

        return (
          <button
            key={conv.id || idx}
            onClick={() => onSelect(conv)}
            className={`w-full rounded-2xl px-4 py-3.5 cursor-pointer transition-all flex items-center gap-3 text-left shadow-sm border ${
              isSelected
                ? 'bg-blue-50 border-blue-200 shadow-blue-100'
                : isAIChat
                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 hover:border-indigo-200'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md active:scale-[0.98]'
            } transition-all duration-150`}
          >
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-lg text-white"
              style={{ background: isAIChat ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {isAIChat
                ? <Bot className="w-6 h-6 text-white" />
                : other.avatar
                ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                : other.name?.charAt(0)?.toUpperCase()
              }
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className={`font-bold text-[14px] truncate flex items-center gap-1.5 ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                  {other.name}
                  {isAIChat && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-wide">AI</span>}
                </span>
                {conv.last_message_at && (
                  <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                  </span>
                )}
              </div>
              {conv.request_title && (
                <p className="text-[11px] font-semibold text-[#2563EB] truncate flex items-center gap-1 mb-0.5">
                  <HandHeart className="w-3 h-3 flex-shrink-0" /> {conv.request_title}
                </p>
              )}
              <p className={`text-[13px] truncate ${unread > 0 ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
                {conv.last_message || 'Start the conversation'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}