import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { HandHeart, Bot } from 'lucide-react';
import { AI_AGENT } from '@/lib/aiAgent';

export default function ConversationList({ conversations, currentUser, selectedId, onSelect }) {
  const getOther = (conv) => {
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
          Tap the message icon on any post or member profile to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {conversations.map(conv => {
        const other = getOther(conv);
        const unread = conv.unread_count?.[currentUser.id] || 0;
        const isSelected = selectedId === conv.id;

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`px-4 py-3.5 cursor-pointer transition-colors flex items-center gap-3 ${
              isSelected ? 'bg-blue-50' : 'hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-lg text-white"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {other.avatar
                ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                : other.name?.charAt(0)?.toUpperCase()
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className={`font-semibold text-[14px] truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-800'}`}>
                  {other.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {conv.last_message_at && (
                    <span className="text-[11px] text-slate-400">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                    </span>
                  )}
                  {unread > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                      style={{ background: '#2563EB' }}
                    >
                      {unread > 9 ? '9+' : unread}
                    </span>
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
          </div>
        );
      })}
    </div>
  );
}