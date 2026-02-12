import React from 'react';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList({ conversations, currentUser, selectedId, onSelect }) {
  const getOtherParticipant = (conv) => {
    const idx = conv.participant_ids?.indexOf(currentUser.id);
    const otherIdx = idx === 0 ? 1 : 0;
    return {
      id: conv.participant_ids?.[otherIdx],
      name: conv.participant_names?.[otherIdx] || 'Unknown',
      age: conv.participant_ages?.[otherIdx] || '18+'
    };
  };

  const getUnreadCount = (conv) => {
    return conv.unread_count?.[currentUser.id] || 0;
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <p className="text-slate-600 font-medium">No conversations yet</p>
        <p className="text-sm text-slate-400 mt-1">Start a conversation from someone's profile</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {conversations.map(conv => {
        const other = getOtherParticipant(conv);
        const unread = getUnreadCount(conv);
        const isSelected = selectedId === conv.id;

        return (
          <div 
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`p-4 cursor-pointer transition-colors ${
              isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden">
                {other.avatar ? (
                  <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  other.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 truncate">{other.name}</span>
                  <Badge variant="outline" className="text-xs font-normal scale-90">
                    {other.age}
                  </Badge>
                  {unread > 0 && (
                    <span className="ml-auto bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                {conv.last_message_at && (
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}