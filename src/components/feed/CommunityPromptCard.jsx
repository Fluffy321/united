import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { dataService, findDirectConversation, createDirectConversation } from '@/services';

export default function CommunityPromptCard({ prompt, responses = [], onReply, currentUser }) {
  const navigate = useNavigate();

  const handleMessage = async (userId) => {
    if (onReply) { onReply(userId); return; }
    try {
      const convs = await dataService.entities.Conversation.list('-updated_date', 50);
      const existing = findDirectConversation(currentUser?.id, userId, convs);
      if (existing) {
        navigate(createPageUrl('Messages') + `?conversation=${existing.id}`);
        return;
      }
      const [otherUser] = await dataService.entities.User.filter({ id: userId });
      const conv = await createDirectConversation(currentUser, {
        id: userId,
        name: otherUser?.display_name || otherUser?.full_name || 'User',
        age_range: otherUser?.age_range,
      });
      navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
    } catch (e) {
      console.error('Message error', e);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-purple-100">
      <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
        Community Prompt
      </div>

      <div className="text-[16px] font-bold text-slate-900">
        {prompt.question}
      </div>

      {responses.length > 0 && (
        <div className="mt-3 space-y-2">
          {responses.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 gap-3"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-slate-800 truncate">{r.userName || r.user_name}</div>
                <div className="text-[12px] text-slate-500 truncate">{r.answer || r.body}</div>
              </div>
              {currentUser && (r.userId || r.user_id) !== currentUser.id && (
                <button
                  onClick={() => handleMessage(r.userId || r.user_id)}
                  className="text-[11px] bg-blue-600 text-white rounded-full px-3 py-1 flex-shrink-0 font-semibold hover:bg-blue-700 transition-colors"
                >
                  Message
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {responses.length === 0 && (
        <p className="text-[12px] text-slate-400 mt-2">Be the first to respond!</p>
      )}

      <button
        onClick={() => onReply && onReply()}
        className="mt-4 w-full bg-purple-600 text-white rounded-full py-2 text-[13px] font-semibold hover:bg-purple-700 transition-colors"
      >
        Add Your Answer
      </button>
    </div>
  );
}