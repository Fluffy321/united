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
    <div>
      {conversations.map((conv, idx) => {
        const other = getOther(conv);
        const unread = conv.unread_count?.[currentUser.id] || 0;
        const isSelected = selectedId === conv.id;
        const isAIChat = other.id === AI_AGENT.id;

        return (
          <div key={conv.id || idx}>
            <button
              onClick={() => onSelect(conv)}
              className={`w-full px-4 py-3.5 cursor-pointer transition-colors flex items-center gap-3 ${
                isSelected ? 'bg-blue-50' : isAIChat ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-slate-50 active:bg-slate-100'
              }`}
            >
              {/* Avatar */}
              <div className="relative w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-lg text-white"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
              >
                {isAIChat
                  ? <Bot className="w-6 h-6 text-white" />
                  : other.avatar
                  ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                  : other.name?.charAt(0)?.toUpperCase()
                }
              </div>
              

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`font-semibold text-[14px] truncate flex items-center gap-1.5 ${unread > 0 ? 'text-slate-900' : 'text-slate-800'}`}>
                    {other.name}
                    {isAIChat && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">AI</span>}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conv.last_message_at && (
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                      </span>
                    )}
                    {unread > 0 && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
                {conv.request_title && (
                  <p className="text-[11px] font-semibold text-[#2563EB] truncate flex items-center gap-1 mb-0.5">
                    <HandHeart className="w-3 h-3 flex-shrink-0" /> {conv.request_title}
                  </p>
                )}
                <p className={`text-[13px] truncate ${unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  {conv.last_message || 'Start the conversation'}
                </p>
              </div>
            </button>
            {idx < conversations.length - 1 && <div className="h-px bg-slate-100" />}
          </div>
        );
      })}
    </div>
  );
}