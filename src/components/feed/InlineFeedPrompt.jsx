import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

export default function InlineFeedPrompt({ prompt, onReply }) {
  if (!prompt) return null;

  return (
    <div
      className="rounded-[14px] border border-violet-200 overflow-hidden px-4 py-3.5"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wide">Community Question</span>
      </div>

      <p className="text-[14.5px] font-semibold text-violet-900 leading-snug mb-3">
        {prompt.question}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-violet-500 font-medium">
          {prompt.replies_count > 0 ? `${prompt.replies_count} ${prompt.replies_count === 1 ? 'reply' : 'replies'}` : 'Be the first to reply'}
        </span>
        <button
          onClick={() => onReply(prompt)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-white transition-all active:scale-95"
          style={{ background: '#7c3aed' }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Reply
        </button>
      </div>
    </div>
  );
}