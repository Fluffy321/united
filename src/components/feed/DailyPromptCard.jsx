import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

export default function DailyPromptCard({ prompt, onReply }) {
  if (!prompt) return null;

  return (
    <div className="section-card mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-[var(--primary)]" />
        <span className="text-xs font-semibold text-[var(--primary)] bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Daily Prompt</span>
      </div>
      
      <h2 className="text-[15px] font-bold mb-3 leading-snug text-[var(--text-main)]">
        {prompt.question}
      </h2>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onReply}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4" />
          Reply
        </button>
        
        <span className="text-[var(--text-muted)] text-sm">
          {prompt.replies_count || 0} {prompt.replies_count === 1 ? 'reply' : 'replies'}
        </span>
      </div>
    </div>
  );
}