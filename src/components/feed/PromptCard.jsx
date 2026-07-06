import React, { useState } from 'react';
import PromptResponsesSheet from './PromptResponsesSheet';
import { useQueryClient } from '@tanstack/react-query';
import { postKeys } from '@/lib/queryKeys';

export default function PromptCard({ post, currentUser }) {
  const [showSheet, setShowSheet] = useState(false);
  const [localCount, setLocalCount] = useState(post.comments_count || 0);
  const queryClient = useQueryClient();

  return (
    <>
      <button
        onClick={() => setShowSheet(true)}
        className="w-full rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-100 p-4 text-left shadow-sm"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide">Community Prompt</span>
        </div>
        <div className="text-[16px] font-bold text-slate-900 leading-snug">{post.body}</div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-slate-500">{localCount} {localCount === 1 ? 'response' : 'responses'}</span>
          <span className="text-[12px] font-semibold text-purple-600">Answer →</span>
        </div>
      </button>

      <PromptResponsesSheet
        post={post}
        currentUser={currentUser}
        open={showSheet}
        onOpenChange={setShowSheet}
        onResponseAdded={() => {
          setLocalCount(c => c + 1);
          queryClient.invalidateQueries({ queryKey: postKeys.all });
        }}
      />
    </>
  );
}
